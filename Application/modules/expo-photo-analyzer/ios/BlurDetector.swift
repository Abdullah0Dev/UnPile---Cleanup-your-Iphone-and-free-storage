import UIKit
import Photos

class BlurDetector {
    // MARK: - Configuration

    /// If true, use Core ML quality score as the primary metric.
    var useMLAssessment: Bool = true

    /// Threshold for ML score (1‑10). Scores below this are considered blurry/low-quality.
    var mlQualityThreshold: Float = 4.0

    /// Fallback Laplacian variance threshold.
    var laplacianThreshold: Double = 200.0

    // MARK: - Private

    private let targetSize = CGSize(width: 300, height: 300)
    private let qualityAnalyzer = QualityAnalyzer()  // nil if model unavailable

    // MARK: - Public API

    func findBlurry(assets: [PHAsset], progressHandler: @escaping (Float) -> Void) -> [String] {
        var blurryIds: [String] = []
        let total = Float(assets.count)

        for (index, asset) in assets.enumerated() {
            if isBlurry(asset: asset) {
                blurryIds.append(asset.localIdentifier)
            }

            if index % 5 == 0 || index == assets.count - 1 {
                progressHandler(Float(index + 1) / total)
            }
        }

        return blurryIds
    }

    // MARK: - Private Helpers

    private func isBlurry(asset: PHAsset) -> Bool {
        // 1. Try ML assessment if available and enabled
        if useMLAssessment, let analyzer = qualityAnalyzer {
            if let score = getMLScore(for: asset, using: analyzer), score < mlQualityThreshold {
                return true
            }
            // If ML fails or score is above threshold, fall through to Laplacian
        }

        // 2. Fallback: Laplacian variance
        return isBlurryByLaplacian(asset: asset)
    }

    private func getMLScore(for asset: PHAsset, using analyzer: QualityAnalyzer) -> Float? {
        let options = PHImageRequestOptions()
        options.isSynchronous = false
        options.deliveryMode = .highQualityFormat
        options.resizeMode = .exact
        options.isNetworkAccessAllowed = true

        var score: Float? = nil
        let semaphore = DispatchSemaphore(value: 0)

        PHImageManager.default().requestImage(
            for: asset,
            targetSize: targetSize,
            contentMode: .aspectFit,
            options: options
        ) { image, _ in
            guard let image = image else {
                semaphore.signal()
                return
            }
            analyzer.assessQuality(for: image) { result in
                score = result
                semaphore.signal()
            }
        }

        semaphore.wait()
        return score
    }

    private func isBlurryByLaplacian(asset: PHAsset) -> Bool {
        let options = PHImageRequestOptions()
        options.isSynchronous = true
        options.deliveryMode = .highQualityFormat
        options.resizeMode = .exact
        options.isNetworkAccessAllowed = true

        var isBlurry = false
        let semaphore = DispatchSemaphore(value: 0)

        PHImageManager.default().requestImage(
            for: asset,
            targetSize: targetSize,
            contentMode: .aspectFit,
            options: options
        ) { image, _ in
            defer { semaphore.signal() }
            guard let cgImage = image?.cgImage else {
                isBlurry = false
                return
            }
            isBlurry = self.hasLowVariance(cgImage)
        }

        semaphore.wait()
        return isBlurry
    }

    // MARK: - Laplacian Variance (fallback)

    private func hasLowVariance(_ cgImage: CGImage) -> Bool {
        let width = cgImage.width
        let height = cgImage.height
        guard width > 2, height > 2 else { return false }

        let colorSpace = CGColorSpaceCreateDeviceGray()
        let bytesPerRow = width
        guard let context = CGContext(
            data: nil,
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: bytesPerRow,
            space: colorSpace,
            bitmapInfo: CGImageAlphaInfo.none.rawValue
        ) else { return false }

        context.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))
        guard let data = context.data else { return false }
        let pixels = data.bindMemory(to: UInt8.self, capacity: width * height)

        var sumSq: Double = 0.0
        var count = 0

        for y in 1..<(height - 1) {
            for x in 1..<(width - 1) {
                let idx = y * width + x
                let center = Double(pixels[idx])
                let left = Double(pixels[y * width + (x - 1)])
                let right = Double(pixels[y * width + (x + 1)])
                let up = Double(pixels[(y - 1) * width + x])
                let down = Double(pixels[(y + 1) * width + x])

                let lap = up + down + left + right - 4.0 * center
                sumSq += lap * lap
                count += 1
            }
        }

        guard count > 0 else { return false }
        let variance = sumSq / Double(count)
        return variance < laplacianThreshold
    }
}
