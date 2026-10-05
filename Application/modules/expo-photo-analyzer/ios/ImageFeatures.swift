import Photos
import UIKit
import CoreGraphics

// MARK: - Fingerprint

struct Fingerprint {
    let d0, d1, d2, d3: UInt64
    let a0, a1, a2, a3: UInt64

    @inline(__always)
    func dDistance(to o: Fingerprint) -> Int {
        (d0 ^ o.d0).nonzeroBitCount +
        (d1 ^ o.d1).nonzeroBitCount +
        (d2 ^ o.d2).nonzeroBitCount +
        (d3 ^ o.d3).nonzeroBitCount
    }

    @inline(__always)
    func aDistance(to o: Fingerprint) -> Int {
        (a0 ^ o.a0).nonzeroBitCount +
        (a1 ^ o.a1).nonzeroBitCount +
        (a2 ^ o.a2).nonzeroBitCount +
        (a3 ^ o.a3).nonzeroBitCount
    }

    /// 16 chunks × 16 bits for multi-index lookup.
    @inline(__always)
    func chunk(_ c: Int) -> UInt16 {
        let word: UInt64

        switch c >> 2 {
        case 0: word = d0
        case 1: word = d1
        case 2: word = d2
        default: word = d3
        }

        return UInt16(
            truncatingIfNeeded: word >> UInt64((c & 3) * 16)
        )
    }
}

// MARK: - Image stats

struct ImageStats {
    /// 85th-percentile tile Laplacian variance.
    /// Keeps photos whose subject is sharp but background is soft.
    let sharpness: Float

    /// Whole-image Laplacian variance used by the old blur metric.
    let lapVariance: Float

    let contrastStd: Float
    let meanLuma: Float
}

struct ImageFeatures {
    let fingerprint: Fingerprint?
    let stats: ImageStats
}

// MARK: - Lazy ML

final class LazyImageInfo {
    let image: CGImage?
    let orientation: CGImagePropertyOrientation

    init(image: CGImage?, orientation: CGImagePropertyOrientation) {
        self.image = image
        self.orientation = orientation
    }

    lazy var quality: Float? = {
        guard let image else { return nil }
        return QualityAnalyzer.shared?.score(
            for: image,
            orientation: orientation
        )
    }()

    lazy var content: ContentInfo? = {
        guard let image else { return nil }
        return ContentClassifier.shared?.classify(
            image,
            orientation: orientation
        )
    }()

    lazy var hasFace: Bool = {
        guard let image else { return false }
        return FaceDetector.containsFace(
            image,
            orientation: orientation
        )
    }()
}

// MARK: - Orientation

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

// MARK: - Thumbnail loading

enum ThumbnailLoader {
    /// Balance between image-detail accuracy and decode/resize cost.
    static let longSide: CGFloat = 300

    static func load(
        _ asset: PHAsset
    ) -> (CGImage, CGImagePropertyOrientation)? {
        let opts = PHImageRequestOptions()
        opts.isSynchronous = true
        opts.deliveryMode = .fastFormat
        opts.resizeMode = .fast
        opts.isNetworkAccessAllowed = false
        opts.version = .current

        let pw = CGFloat(max(asset.pixelWidth, 1))
        let ph = CGFloat(max(asset.pixelHeight, 1))
        let scale = min(1.0, longSide / max(pw, ph))

        let target = CGSize(
            width: max(1, (pw * scale).rounded()),
            height: max(1, (ph * scale).rounded())
        )

        var output: (CGImage, CGImagePropertyOrientation)?

        PHImageManager.default().requestImage(
            for: asset,
            targetSize: target,
            contentMode: .aspectFit,
            options: opts
        ) { image, _ in
            guard let image, let cg = image.cgImage else { return }

            output = (
                cg,
                CGImagePropertyOrientation(
                    uiOrientation: image.imageOrientation
                )
            )
        }

        return output
    }
}

// MARK: - Pixel analysis

enum ImageAnalysis {
    private static let graySpace = CGColorSpaceCreateDeviceGray()

    static let maxSide = 300

    static func analyze(_ cg: CGImage) -> ImageFeatures? {
        let sw = cg.width
        let sh = cg.height

        guard sw >= 32, sh >= 32 else { return nil }

        let scale = min(
            1.0,
            Double(maxSide) / Double(max(sw, sh))
        )

        let w = max(32, Int(Double(sw) * scale))
        let h = max(32, Int(Double(sh) * scale))

        var pixels = [UInt8](repeating: 0, count: w * h)

        let drawn = pixels.withUnsafeMutableBytes { raw -> Bool in
            guard
                let base = raw.baseAddress,
                let ctx = CGContext(
                    data: base,
                    width: w,
                    height: h,
                    bitsPerComponent: 8,
                    bytesPerRow: w,
                    space: graySpace,
                    bitmapInfo: CGImageAlphaInfo.none.rawValue
                )
            else {
                return false
            }

            ctx.interpolationQuality = .high
            ctx.draw(cg, in: CGRect(x: 0, y: 0, width: w, height: h))
            return true
        }

        guard drawn else { return nil }

        return pixels.withUnsafeBufferPointer { buffer in
            let stats = computeStats(buffer.baseAddress!, w, h)

            let fp: Fingerprint? =
                stats.contrastStd < 3
                ? nil
                : fingerprint(buffer.baseAddress!, w, h)

            return ImageFeatures(
                fingerprint: fp,
                stats: stats
            )
        }
    }

    private static func computeStats(
        _ p: UnsafePointer<UInt8>,
        _ w: Int,
        _ h: Int
    ) -> ImageStats {
        var totalSum: Int64 = 0
        var totalSq: Int64 = 0

        // Borders are excluded from the Laplacian pass, so include them here.
        for x in 0..<w {
            let top = Int64(p[x])
            let bottom = Int64(p[(h - 1) * w + x])

            totalSum += top + bottom
            totalSq += top * top + bottom * bottom
        }

        if h > 2 {
            for y in 1..<(h - 1) {
                let row = y * w

                let left = Int64(p[row])
                totalSum += left
                totalSq += left * left

                if w > 1 {
                    let right = Int64(p[row + w - 1])
                    totalSum += right
                    totalSq += right * right
                }
            }
        }

        let tile = 64
        let tx = max(1, (w - 2) / tile)
        let ty = max(1, (h - 2) / tile)

        var tileVariances = [Float]()
        tileVariances.reserveCapacity(tx * ty)

        // Whole-image Laplacian variance: restores the old metric.
        var globalLapSum: Int64 = 0
        var globalLapSq: Int64 = 0
        var globalLapCount: Int64 = 0

        for tyi in 0..<ty {
            let y0 = 1 + tyi * tile
            let y1 = (tyi == ty - 1) ? h - 1 : y0 + tile

            for txi in 0..<tx {
                let x0 = 1 + txi * tile
                let x1 = (txi == tx - 1) ? w - 1 : x0 + tile

                var sum: Int64 = 0
                var sumSq: Int64 = 0
                var count: Int64 = 0

                for y in y0..<y1 {
                    let row = y * w

                    for x in x0..<x1 {
                        let index = row + x
                        let pixel = Int64(p[index])

                        totalSum += pixel
                        totalSq += pixel * pixel

                        let lap =
                            Int64(p[index - w]) +
                            Int64(p[index + w]) +
                            Int64(p[index - 1]) +
                            Int64(p[index + 1]) -
                            4 * pixel

                        sum += lap
                        sumSq += lap * lap
                        count += 1

                        globalLapSum += lap
                        globalLapSq += lap * lap
                        globalLapCount += 1
                    }
                }

                if count > 0 {
                    let mean = Double(sum) / Double(count)
                    let variance = max(
                        0,
                        Double(sumSq) / Double(count) - mean * mean
                    )

                    tileVariances.append(Float(variance))
                }
            }
        }

        let pixelCount = max(1, w * h)
        let mean = Double(totalSum) / Double(pixelCount)
        let std = max(
            0,
            Double(totalSq) / Double(pixelCount) - mean * mean
        ).squareRoot()

        let globalLapVariance: Float

        if globalLapCount > 0 {
            let lapMean = Double(globalLapSum) / Double(globalLapCount)
            globalLapVariance = Float(max(
                0,
                Double(globalLapSq) / Double(globalLapCount) - lapMean * lapMean
            ))
        } else {
            globalLapVariance = 0
        }

        tileVariances.sort()

        let sharpness: Float

        if tileVariances.isEmpty {
            sharpness = 0
        } else {
            let index = min(
                tileVariances.count - 1,
                max(
                    0,
                    Int(Float(tileVariances.count - 1) * 0.85)
                )
            )

            sharpness = tileVariances[index]
        }

        return ImageStats(
            sharpness: sharpness,
            lapVariance: globalLapVariance,
            contrastStd: Float(std),
            meanLuma: Float(mean)
        )
    }

    private static func fingerprint(
        _ p: UnsafePointer<UInt8>,
        _ w: Int,
        _ h: Int
    ) -> Fingerprint {
        let g17 = resample(p, w, h, 17, 16)
        var d = [UInt64](repeating: 0, count: 4)

        for y in 0..<16 {
            for x in 0..<16 where g17[y * 17 + x] > g17[y * 17 + x + 1] {
                let bit = y * 16 + x
                d[bit >> 6] |= UInt64(1) << UInt64(bit & 63)
            }
        }

        let g16 = resample(p, w, h, 16, 16)
        let avg = g16.reduce(0, +) / 256
        var a = [UInt64](repeating: 0, count: 4)

        for i in 0..<256 where g16[i] > avg {
            a[i >> 6] |= UInt64(1) << UInt64(i & 63)
        }

        return Fingerprint(
            d0: d[0], d1: d[1], d2: d[2], d3: d[3],
            a0: a[0], a1: a[1], a2: a[2], a3: a[3]
        )
    }

    /// Area-average downsample for stable perceptual hashes.
    private static func resample(
        _ p: UnsafePointer<UInt8>,
        _ w: Int,
        _ h: Int,
        _ outW: Int,
        _ outH: Int
    ) -> [Float] {
        var output = [Float](repeating: 0, count: outW * outH)

        for oy in 0..<outH {
            let y0 = oy * h / outH
            let y1 = max(y0 + 1, (oy + 1) * h / outH)

            for ox in 0..<outW {
                let x0 = ox * w / outW
                let x1 = max(x0 + 1, (ox + 1) * w / outW)

                var sum = 0

                for y in y0..<y1 {
                    let row = y * w
                    for x in x0..<x1 {
                        sum += Int(p[row + x])
                    }
                }

                let area = max(1, (y1 - y0) * (x1 - x0))
                output[oy * outW + ox] = Float(sum) / Float(area)
            }
        }

        return output
    }
}
