import Photos
import UIKit
import CoreGraphics

// MARK: - Fingerprint (dHash + aHash, 256 bits each)

struct Fingerprint {
    let d0, d1, d2, d3: UInt64   // difference hash
    let a0, a1, a2, a3: UInt64   // average hash

    @inline(__always)
    func dDistance(to o: Fingerprint) -> Int {
        (d0 ^ o.d0).nonzeroBitCount + (d1 ^ o.d1).nonzeroBitCount +
        (d2 ^ o.d2).nonzeroBitCount + (d3 ^ o.d3).nonzeroBitCount
    }

    @inline(__always)
    func aDistance(to o: Fingerprint) -> Int {
        (a0 ^ o.a0).nonzeroBitCount + (a1 ^ o.a1).nonzeroBitCount +
        (a2 ^ o.a2).nonzeroBitCount + (a3 ^ o.a3).nonzeroBitCount
    }

    /// 16 chunks of 16 bits of the dHash, for multi-index lookup.
    func chunk(_ c: Int) -> UInt16 {
        let word: UInt64
        switch c >> 2 {
        case 0: word = d0
        case 1: word = d1
        case 2: word = d2
        default: word = d3
        }
        return UInt16(truncatingIfNeeded: word >> UInt64((c & 3) * 16))
    }
}

struct ImageStats {
    /// 85th-percentile tile Laplacian variance. A photo with a sharp subject and
    /// soft background still scores high; a truly blurry one scores low everywhere.
    let sharpness: Float
    let contrastStd: Float
    let meanLuma: Float
}

struct ImageFeatures {
    let fingerprint: Fingerprint?
    let stats: ImageStats
}

// MARK: - Lazy per-asset ML (computed only if a rule actually needs it)

final class LazyImageInfo {
    let image: CGImage?
    let orientation: CGImagePropertyOrientation

    init(image: CGImage?, orientation: CGImagePropertyOrientation) {
        self.image = image
        self.orientation = orientation
    }

    lazy var quality: Float? = {
        guard let img = self.image else { return nil }
        return QualityAnalyzer.shared?.score(for: img, orientation: self.orientation)
    }()

    lazy var content: ContentInfo? = {
        guard let img = self.image else { return nil }
        return ContentClassifier.shared?.classify(img, orientation: self.orientation)
    }()

    lazy var hasFace: Bool = {
        guard let img = self.image else { return false }
        return FaceDetector.containsFace(img, orientation: self.orientation)
    }()
}

// MARK: - Thumbnail loading (ONE load per asset)

extension CGImagePropertyOrientation {
    init(uiOrientation o: UIImage.Orientation) {
        switch o {
        case .up: self = .up
        case .upMirrored: self = .upMirrored
        case .down: self = .down
        case .downMirrored: self = .downMirrored
        case .left: self = .left
        case .leftMirrored: self = .leftMirrored
        case .right: self = .right
        case .rightMirrored: self = .rightMirrored
        @unknown default: self = .up
        }
    }
}

enum ThumbnailLoader {
    static let longSide: CGFloat = 512

    static func load(_ asset: PHAsset) -> (CGImage, CGImagePropertyOrientation)? {
        let opts = PHImageRequestOptions()
        opts.isSynchronous = true
        opts.deliveryMode = .highQualityFormat
        opts.resizeMode = .fast                 // uses Photos' cached thumbnails, no full decode
        opts.isNetworkAccessAllowed = false     // never trigger iCloud downloads mid-scan

        let pw = CGFloat(max(asset.pixelWidth, 1))
        let ph = CGFloat(max(asset.pixelHeight, 1))
        let s = min(1, longSide / max(pw, ph))
        let target = CGSize(width: max(1, (pw * s).rounded()), height: max(1, (ph * s).rounded()))

        var out: (CGImage, CGImagePropertyOrientation)?
        PHImageManager.default().requestImage(for: asset, targetSize: target,
                                              contentMode: .aspectFit, options: opts) { img, _ in
            if let img = img, let cg = img.cgImage {
                out = (cg, CGImagePropertyOrientation(uiOrientation: img.imageOrientation))
            }
        }
        return out
    }
}

// MARK: - Pixel analysis (hash + sharpness + exposure from a single gray buffer)

enum ImageAnalysis {
    private static let graySpace = CGColorSpaceCreateDeviceGray()
    static let maxSide = 512

    static func analyze(_ cg: CGImage) -> ImageFeatures? {
        let sw = cg.width, sh = cg.height
        guard sw >= 32, sh >= 32 else { return nil }
        let scale = min(1.0, Double(maxSide) / Double(max(sw, sh)))
        let w = max(32, Int(Double(sw) * scale))
        let h = max(32, Int(Double(sh) * scale))

        var pixels = [UInt8](repeating: 0, count: w * h)
        let drawn = pixels.withUnsafeMutableBytes { raw -> Bool in
            guard let ctx = CGContext(data: raw.baseAddress, width: w, height: h,
                                      bitsPerComponent: 8, bytesPerRow: w,
                                      space: graySpace,
                                      bitmapInfo: CGImageAlphaInfo.none.rawValue) else { return false }
            ctx.interpolationQuality = .high
            ctx.draw(cg, in: CGRect(x: 0, y: 0, width: w, height: h))
            return true
        }
        guard drawn else { return nil }

        return pixels.withUnsafeBufferPointer { buf -> ImageFeatures in
            let p = buf.baseAddress!
            let stats = computeStats(p, w, h)
            // Flat images (blank walls, black frames) give meaningless hashes.
            let fp: Fingerprint? = stats.contrastStd < 3 ? nil : fingerprint(p, w, h)
            return ImageFeatures(fingerprint: fp, stats: stats)
        }
    }

    private static func computeStats(_ p: UnsafePointer<UInt8>, _ w: Int, _ h: Int) -> ImageStats {
        var sum = 0, sumSq = 0
        for i in 0..<(w * h) {
            let v = Int(p[i])
            sum += v
            sumSq += v * v
        }
        let n = Double(w * h)
        let mean = Double(sum) / n
        let std = max(0, Double(sumSq) / n - mean * mean).squareRoot()

        let tile = 64
        let tx = max(1, (w - 2) / tile)
        let ty = max(1, (h - 2) / tile)
        var variances = [Float]()
        variances.reserveCapacity(tx * ty)

        for tyi in 0..<ty {
            let y0 = 1 + tyi * tile
            let y1 = (tyi == ty - 1) ? h - 1 : y0 + tile
            for txi in 0..<tx {
                let x0 = 1 + txi * tile
                let x1 = (txi == tx - 1) ? w - 1 : x0 + tile
                var s = 0, sq = 0, cnt = 0
                for y in y0..<y1 {
                    let row = y * w
                    for x in x0..<x1 {
                        let i = row + x
                        let lap = Int(p[i - w]) + Int(p[i + w]) + Int(p[i - 1]) + Int(p[i + 1]) - 4 * Int(p[i])
                        s += lap
                        sq += lap * lap
                        cnt += 1
                    }
                }
                if cnt > 0 {
                    let m = Double(s) / Double(cnt)
                    variances.append(Float(Double(sq) / Double(cnt) - m * m))
                }
            }
        }
        variances.sort()
        let sharp = variances.isEmpty ? 0 : variances[Int(Float(variances.count - 1) * 0.85)]
        return ImageStats(sharpness: sharp, contrastStd: Float(std), meanLuma: Float(mean))
    }

    private static func fingerprint(_ p: UnsafePointer<UInt8>, _ w: Int, _ h: Int) -> Fingerprint {
        // dHash: 17x16 grid, compare horizontal neighbours -> 256 bits
        let g17 = resample(p, w, h, 17, 16)
        var d = [UInt64](repeating: 0, count: 4)
        for y in 0..<16 {
            for x in 0..<16 where g17[y * 17 + x] > g17[y * 17 + x + 1] {
                let bit = y * 16 + x
                d[bit >> 6] |= (1 as UInt64) << UInt64(bit & 63)
            }
        }
        // aHash: 16x16 grid vs mean -> 256 bits
        let g16 = resample(p, w, h, 16, 16)
        let avg = g16.reduce(0, +) / 256
        var a = [UInt64](repeating: 0, count: 4)
        for i in 0..<256 where g16[i] > avg {
            a[i >> 6] |= (1 as UInt64) << UInt64(i & 63)
        }
        return Fingerprint(d0: d[0], d1: d[1], d2: d[2], d3: d[3],
                           a0: a[0], a1: a[1], a2: a[2], a3: a[3])
    }

    /// Area-average downsample (much better than point-sampling for hashing).
    private static func resample(_ p: UnsafePointer<UInt8>, _ w: Int, _ h: Int,
                                 _ outW: Int, _ outH: Int) -> [Float] {
        var out = [Float](repeating: 0, count: outW * outH)
        for oy in 0..<outH {
            let y0 = oy * h / outH
            let y1 = max(y0 + 1, (oy + 1) * h / outH)
            for ox in 0..<outW {
                let x0 = ox * w / outW
                let x1 = max(x0 + 1, (ox + 1) * w / outW)
                var s = 0
                for y in y0..<y1 {
                    let row = y * w
                    for x in x0..<x1 { s += Int(p[row + x]) }
                }
                out[oy * outW + ox] = Float(s) / Float((y1 - y0) * (x1 - x0))
            }
        }
        return out
    }
}
