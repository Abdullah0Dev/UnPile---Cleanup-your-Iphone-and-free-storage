import Photos
import UIKit

class ClutterDetector {

    // MARK: - Configuration

    /// Minimum age (in days) – images older than this are considered forgotten.
    var ageThresholdDays: Int = 30

    /// Maximum file size (in bytes) – images smaller than this are likely cache/thumbnails.
    var maxFileSizeBytes: Int64 = 500 * 1024   // 500 KB

    /// Minimum pixel count (width * height) – images smaller than this are low resolution.
    var minPixelCount: Int = 480 * 480

    /// Quality threshold (1‑10) – images with score below this are low quality.
    var qualityThreshold: Float = 4.0

    /// If true, use ML quality assessment.
    var useQualityAssessment: Bool = true

    /// If true, print debug logs to the console.
    var debugMode: Bool = false

    // MARK: - Private

    private let qualityAnalyzer = QualityAnalyzer()
    private let targetSize = CGSize(width: 300, height: 300)

    // MARK: - Public API

    func findClutter(assets: [PHAsset], progressHandler: @escaping (Float) -> Void) -> [String] {
        var clutterIds: [String] = []
        let total = Float(assets.count)

        for (index, asset) in assets.enumerated() {
            if isClutter(asset: asset) {
                clutterIds.append(asset.localIdentifier)
            }

            if index % 5 == 0 || index == assets.count - 1 {
                progressHandler(Float(index + 1) / total)
            }
        }

        return clutterIds
    }

    // MARK: - Private Helpers

    private func isClutter(asset: PHAsset) -> Bool {
        // Exclude screenshots (handled separately)
        if asset.mediaSubtypes.contains(.photoScreenshot) {
            if debugMode { print("🟢 Not clutter: screenshot") }
            return false
        }

        // Exclude favorites
        if asset.isFavorite {
            if debugMode { print("🟢 Not clutter: favorite") }
            return false
        }

        // Check if it's in any custom album
        let collections = PHAssetCollection.fetchAssetCollectionsContaining(asset, with: .album, options: nil)
        if collections.count > 0 {
            if debugMode { print("🟢 Not clutter: in an album") }
            return false
        }

        // Age check
        guard let creationDate = asset.creationDate else { return false }
        let ageInDays = Calendar.current.dateComponents([.day], from: creationDate, to: Date()).day ?? 0
        if ageInDays < ageThresholdDays {
            if debugMode { print("🟢 Not clutter: too recent (\(ageInDays) days)") }
            return false
        }

        let pixelCount = asset.pixelWidth * asset.pixelHeight
        let fileSize = fileSize(for: asset) ?? 0

        // ---- PROTECT LARGE, HIGH-QUALITY PHOTOS ----
        // If the image is larger than 1 megapixel and larger than 1 MB,
        // it is likely a real photo, not clutter.
        if pixelCount > 1_000_000 && fileSize > 1_000_000 {
            // Only flag if quality is extremely poor (below 3.0)
            if useQualityAssessment, let analyzer = qualityAnalyzer {
                if let score = getQualityScore(for: asset, using: analyzer), score < 3.0 {
                    if debugMode { print("🔴 Clutter: large photo but extremely low quality (\(score))") }
                    return true
                }
            }
            // Otherwise, keep it.
            if debugMode { print("🟢 Not clutter: large, high-quality photo") }
            return false
        }

        // ---- SMALLER / SUSPICIOUS PHOTOS ----
        // Apply heuristics for smaller files and downloads

        // 1. Low resolution
        if pixelCount < minPixelCount {
            if debugMode { print("🔴 Clutter: low resolution (\(pixelCount) < \(minPixelCount))") }
            return true
        }

        // 2. Small file size (cache / thumbnail)
        if fileSize < maxFileSizeBytes {
            if debugMode { print("🔴 Clutter: small file size (\(fileSize) < \(maxFileSizeBytes))") }
            return true
        }

        // 3. No location data (common for downloads)
        if asset.location == nil {
            if debugMode { print("🔴 Clutter: no location data") }
            return true
        }

        // 4. Low ML quality (below threshold)
        if useQualityAssessment, let analyzer = qualityAnalyzer {
            if let score = getQualityScore(for: asset, using: analyzer), score < qualityThreshold {
                if debugMode { print("🔴 Clutter: low quality score (\(score) < \(qualityThreshold))") }
                return true
            }
        }

        // If none of the above triggered, it's not clutter.
        if debugMode { print("🟢 Not clutter: passed all checks") }
        return false
    }

    // MARK: - Helpers

    private func fileSize(for asset: PHAsset) -> Int64? {
        guard let resource = PHAssetResource.assetResources(for: asset).first else { return nil }
        return resource.value(forKey: "fileSize") as? Int64
    }

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
