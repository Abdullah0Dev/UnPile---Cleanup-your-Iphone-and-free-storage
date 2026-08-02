import Photos
import UIKit

class LivePhotoDetector {

    // MARK: - Configuration

    /// Minimum age (in days) – Live Photos older than this are candidates.
    var ageThresholdDays: Int = 60

    /// Quality threshold (1‑10) – Live Photos with score below this are low quality.
    var qualityThreshold: Float = 2.0

    /// If true, use ML quality assessment.
    var useQualityAssessment: Bool = true

    /// If true, use filename heuristics.
    var useFilenameCheck: Bool = true

    /// Filename keywords that indicate a download/cache image.
    var unwantedFilenameKeywords: Set<String> = [
        "WhatsApp", "Telegram", "Signal", "WeChat", "Line",
        "Download", "Cache", "Temp", "Saved"
    ]

    /// If true, use content classification (MobileNetV4) to detect unneeded objects.
    var useContentClassification: Bool = true

    /// Labels considered "likely not needed" (temporary work items, etc.)
    private let unneededLabels: Set<String> = [
        "laptop", "notebook", "monitor", "display",
        "whiteboard", "chalkboard",
        "document", "paper", "receipt", "invoice",
        "id", "passport", "driver_license",
        "card", "business_card",
        "keyboard", "mouse", "computer",
        "desk", "office",
        "book", "magazine"
    ]

    // MARK: - Private

    private let qualityAnalyzer = QualityAnalyzer()
    private let contentClassifier = ContentClassifier()
    private let targetSize = CGSize(width: 300, height: 300)

    // MARK: - Public API

    func detectLivePhotos(from assets: [PHAsset]) -> [PHAsset] {
        return assets.filter { $0.mediaSubtypes.contains(.photoLive) }
    }

    func suggestCandidates(from livePhotoAssets: [PHAsset]) -> [PHAsset] {
        return livePhotoAssets.filter { asset in
            // Exclude favorites
            if asset.isFavorite { return false }

            // Check if in any custom album (user organised it → keep)
            let collections = PHAssetCollection.fetchAssetCollectionsContaining(asset, with: .album, options: nil)
            if collections.count > 0 { return false }

            // Age check
            guard let creationDate = asset.creationDate else { return false }
            let ageInDays = Calendar.current.dateComponents([.day], from: creationDate, to: Date()).day ?? 0

            // Filename check
            var isDownload = false
            var filename: String? = nil
            if useFilenameCheck, let name = originalFilename(for: asset) {
                filename = name
                let lowercased = name.lowercased()
                for keyword in unwantedFilenameKeywords {
                    if lowercased.contains(keyword.lowercased()) {
                        isDownload = true
                        break
                    }
                }
            }

            // Metadata check (camera info or location)
            let pixelCount = asset.pixelWidth * asset.pixelHeight
            let fileSize = fileSize(for: asset) ?? 0
            let hasCameraInfo = asset.location != nil ||
                (pixelCount > 2_000_000 && fileSize > 2_000_000 && !isDownload)

            // Content classification
            var contentLabel: String? = nil
            var isPerson = false
            var isUnneededObject = false

            if useContentClassification, let classifier = contentClassifier {
                if let label = getContentLabel(for: asset, using: classifier) {
                    contentLabel = label
                    let lowercased = label.lowercased()
                    isPerson = lowercased.contains("person") ||
                               lowercased.contains("people") ||
                               lowercased.contains("family") ||
                               lowercased.contains("child") ||
                               lowercased.contains("baby") ||
                               lowercased.contains("face")
                    isUnneededObject = unneededLabels.contains { lowercased.contains($0) }
                }
            }

            // ---- Decision rules ----

            // 1. Person with camera info → KEEP
            if isPerson && hasCameraInfo {
                return false
            }

            // 2. Person without camera info → DELETE (likely downloaded)
            if isPerson && !hasCameraInfo {
                return true
            }

            // 3. Unneeded object → DELETE (receipt, laptop, etc.)
            if isUnneededObject {
                return true
            }

            // 4. Download filename + old enough → DELETE
            if isDownload && ageInDays >= ageThresholdDays {
                return true
            }

            // 5. Age fallback → DELETE if older than threshold
            if ageInDays >= ageThresholdDays {
                return true
            }

            // 6. Quality fallback (very low quality) → DELETE
            if useQualityAssessment, let analyzer = qualityAnalyzer {
                if let score = getQualityScore(for: asset, using: analyzer), score < qualityThreshold {
                    return true
                }
            }

            // Passed all checks → KEEP
            return false
        }
    }

    // MARK: - Private Helpers

    private func originalFilename(for asset: PHAsset) -> String? {
        guard let resource = PHAssetResource.assetResources(for: asset).first else { return nil }
        return resource.originalFilename
    }

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

    private func getContentLabel(for asset: PHAsset, using classifier: ContentClassifier) -> String? {
        let options = PHImageRequestOptions()
        options.isSynchronous = false
        options.deliveryMode = .highQualityFormat
        options.resizeMode = .exact
        options.isNetworkAccessAllowed = true

        var label: String? = nil
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
            classifier.classify(image) { result in
                label = result
                semaphore.signal()
            }
        }

        semaphore.wait()
        return label
    }
}
