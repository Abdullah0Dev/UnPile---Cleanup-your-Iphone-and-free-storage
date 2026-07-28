import Photos
import UIKit

class ClutterDetector {

    // MARK: - Configuration

    /// Minimum age (in days) for regular images (photos, personal content).
    var ageThresholdDays: Int = 30

    /// Minimum age (in days) for images with suspicious filenames (WhatsApp, Telegram, Download, etc.).
    var downloadAgeThresholdDays: Int = 10

    var maxFileSizeBytes: Int64 = 500 * 1024
    var minPixelCount: Int = 480 * 480

    var qualityThreshold: Float = 4.0
    var useQualityAssessment: Bool = true

    var useContentClassification: Bool = true
    var contentClassifierConfidenceThreshold: Float = 0.5

    var useFilenameCheck: Bool = true
    var unwantedFilenameKeywords: Set<String> = [
        "WhatsApp", "Telegram", "Signal", "WeChat", "Line",
        "Download", "Cache", "Temp", "Saved", "Screenshot",
        "IMG_", "VID_", "PANO_", "BURST_"  // Often auto‑generated, but we might not want to catch all of these.
    ]

    var debugMode: Bool = true

    // MARK: - Private

    private let qualityAnalyzer = QualityAnalyzer()
    private let contentClassifier = ContentClassifier()  // nil if model unavailable
    private let targetSize = CGSize(width: 300, height: 300)

    private let unneededLabels: Set<String> = [
        "laptop", "notebook", "monitor", "display",
        "whiteboard", "chalkboard",
        "document", "paper", "receipt", "invoice",
        "id", "passport", "driver_license",
        "card", "business_card",
        "keyboard", "mouse", "computer",
        "desk", "office",
        "book", "magazine",
        "screenshot",
    ]

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

        // Age check – we'll determine threshold based on filename
        guard let creationDate = asset.creationDate else { return false }
        let ageInDays = Calendar.current.dateComponents([.day], from: creationDate, to: Date()).day ?? 0

        // ---- Filename check (NEW) ----
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

        // Determine effective age threshold
        let effectiveThreshold = isDownload ? downloadAgeThresholdDays : ageThresholdDays

        if ageInDays < effectiveThreshold {
            if debugMode {
                let type = isDownload ? "download" : "regular"
                print("🟢 Not clutter: too recent (\(ageInDays) days) for \(type) image")
            }
            return false
        }

        // ---- If it's a download and old enough, flag it immediately ----
        if isDownload {
            if debugMode {
                print("🔴 Clutter: download filename (\(filename ?? "unknown")) is older than \(downloadAgeThresholdDays) days")
            }
            return true
        }

        // ---- Regular images: apply other heuristics ----
        let pixelCount = asset.pixelWidth * asset.pixelHeight
        let fileSize = fileSize(for: asset) ?? 0

        // ---- PROTECT LARGE, HIGH-QUALITY PHOTOS ----
        if pixelCount > 1_000_000 && fileSize > 1_000_000 {
            if useQualityAssessment, let analyzer = qualityAnalyzer {
                if let score = getQualityScore(for: asset, using: analyzer), score < 3.0 {
                    if debugMode { print("🔴 Clutter: large photo but extremely low quality (\(score))") }
                    return true
                }
            }
            if debugMode { print("🟢 Not clutter: large, high-quality photo") }
            return false
        }

        // ---- SMALLER / SUSPICIOUS PHOTOS ----
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

        // 4. Low ML quality (NIMA score)
        if useQualityAssessment, let analyzer = qualityAnalyzer {
            if let score = getQualityScore(for: asset, using: analyzer), score < qualityThreshold {
                if debugMode { print("🔴 Clutter: low quality score (\(score) < \(qualityThreshold))") }
                return true
            }
        }

        // 5. Content classification (MobileNetV4)
        if useContentClassification, let classifier = contentClassifier {
            if let label = getContentLabel(for: asset, using: classifier) {
                let isUnneeded = unneededLabels.contains { label.lowercased().contains($0) }
                if isUnneeded {
                    if debugMode { print("🔴 Clutter: content is '\(label)' which is likely not needed after \(ageThresholdDays) days") }
                    return true
                }
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

    private func originalFilename(for asset: PHAsset) -> String? {
        guard let resource = PHAssetResource.assetResources(for: asset).first else { return nil }
        return resource.originalFilename
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
