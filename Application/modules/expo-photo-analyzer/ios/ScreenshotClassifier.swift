import Photos
import UIKit

/// Screenshot detection & candidate suggestion (old/unneeded screenshots).
class ScreenshotClassifier {

    // MARK: - Configuration

    /// Days after creation date – screenshots older than this are candidates for deletion.
    var ageThresholdDays: Int = 30

    /// Quality threshold (1‑10) – screenshots with score below this are candidates.
    var qualityThreshold: Float = 4.0

    /// Whether to use ML quality assessment.
    var useQualityAssessment: Bool = true

    // MARK: - Private

    private let qualityAnalyzer = QualityAnalyzer()  // nil if model unavailable
    private let targetSize = CGSize(width: 300, height: 300)

    // MARK: - Public API

    /// Returns all assets that are screenshots (system flag).
    func detectScreenshots(from assets: [PHAsset]) -> [PHAsset] {
        return assets.filter { $0.mediaSubtypes.contains(.photoScreenshot) }
    }

    /// From a list of screenshot assets, returns those recommended for deletion.
    /// Uses heuristics: older than `ageThresholdDays` OR low quality score.
    func suggestCandidates(from screenshotAssets: [PHAsset]) -> [PHAsset] {
        let cutoffDate = Date().addingTimeInterval(-Double(ageThresholdDays * 24 * 60 * 60))

        return screenshotAssets.filter { asset in
            // 1. Age
            if let creationDate = asset.creationDate, creationDate < cutoffDate {
                return true
            }

            // 2. Quality (if enabled and model available)
            if useQualityAssessment, let analyzer = qualityAnalyzer {
                if let score = getQualityScore(for: asset, using: analyzer), score < qualityThreshold {
                    return true
                }
            }

            return false
        }
    }

    // MARK: - Private

    private func getQualityScore(for asset: PHAsset, using analyzer: QualityAnalyzer) -> Float? {
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
}
