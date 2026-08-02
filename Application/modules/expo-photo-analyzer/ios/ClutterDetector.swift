import Photos
import UIKit

class ClutterDetector {

    // MARK: - Configuration

    var ageThresholdDays: Int = 30
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
        "IMG_", "VID_", "PANO_", "BURST_"
    ]

    var debugMode: Bool = true

    // MARK: - Private

    private let qualityAnalyzer = QualityAnalyzer()
    private let contentClassifier = ContentClassifier()
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
        let assetId = asset.localIdentifier
        let isTargetAsset = assetId == "341BCE39-F873-4678-979A-5FC1752ADA81/L0/001"
        
        // 1. Exclude screenshots, favorites, albums
        if asset.mediaSubtypes.contains(.photoScreenshot) {
            if debugMode { print("🟢 Not clutter: screenshot \(assetId)") }
            return false
        }
        if asset.isFavorite {
            if debugMode { print("🟢 Not clutter: favorite \(assetId)") }
            return false
        }
        let collections = PHAssetCollection.fetchAssetCollectionsContaining(asset, with: .album, options: nil)
        if collections.count > 0 {
            if debugMode { print("🟢 Not clutter: in an album \(assetId)") }
            return false
        }

        // 2. Age and filename checks
        guard let creationDate = asset.creationDate else { return false }
        let ageInDays = Calendar.current.dateComponents([.day], from: creationDate, to: Date()).day ?? 0

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

        let effectiveThreshold = isDownload ? downloadAgeThresholdDays : ageThresholdDays
        
        if isTargetAsset {
            print("🔍 TARGET ASSET: \(assetId)")
            print("   Age: \(ageInDays) days")
            print("   Filename: \(filename ?? "nil")")
            print("   isDownload: \(isDownload)")
            print("   effectiveThreshold: \(effectiveThreshold)")
        }

        if ageInDays < effectiveThreshold {
            if debugMode {
                let type = isDownload ? "download" : "regular"
                print("🟢 Not clutter: too recent (\(ageInDays) days) for \(type) image \(assetId)")
            }
            return false
        }

        // If download and old enough → immediate clutter
        if isDownload {
            if debugMode {
                print("🔴 Clutter: download filename (\(filename ?? "unknown")) is older than \(downloadAgeThresholdDays) days \(assetId)")
            }
            return true
        }

        // 3. Metadata and content classification (moved BEFORE size protection)
        let pixelCount = asset.pixelWidth * asset.pixelHeight
        let fileSize = fileSize(for: asset) ?? 0

        // hasCameraInfo: location OR (high resolution AND not a download)
        let hasCameraInfo = asset.location != nil ||
            (pixelCount > 2_000_000 && fileSize > 2_000_000 && !isDownload)

        if isTargetAsset {
            print("   pixelCount: \(pixelCount)")
            print("   fileSize: \(fileSize)")
            print("   hasCameraInfo: \(hasCameraInfo)")
            print("   location: \(asset.location != nil ? "YES" : "NO")")
        }

        // Run content classification
        var contentLabel: String? = nil
        var isPerson = false
        var isUnneededObject = false

        if useContentClassification {
            if let classifier = contentClassifier {
                if isTargetAsset {
                    print("   Calling content classifier...")
                }
                if let label = getContentLabel(for: asset, using: classifier) {
                    contentLabel = label
                    if isTargetAsset {
                        print("   Content label: \(label)")
                    }
                    let lowercased = label.lowercased()
                    isPerson = lowercased.contains("person") ||
                               lowercased.contains("people") ||
                               lowercased.contains("family") ||
                               lowercased.contains("child") ||
                               lowercased.contains("baby") ||
                               lowercased.contains("face")
                    isUnneededObject = unneededLabels.contains { lowercased.contains($0) }
                    if isTargetAsset {
                        print("   isPerson: \(isPerson)")
                        print("   isUnneededObject: \(isUnneededObject)")
                    }
                } else {
                    if isTargetAsset || debugMode {
                        print("⚠️ No content label returned for asset \(assetId)")
                    }
                }
            } else {
                if isTargetAsset || debugMode {
                    print("⚠️ ContentClassifier is nil! Cannot classify.")
                }
            }
        } else {
            if isTargetAsset || debugMode {
                print("⚠️ Content classification disabled")
            }
        }

        // 4. Apply rules based on content and metadata
        if isPerson {
            if hasCameraInfo {
                if debugMode { print("🟢 Not clutter: person with camera info (location or high-res) \(assetId)") }
                return false
            } else {
                if debugMode { print("🔴 Clutter: person without camera info (likely downloaded) \(assetId)") }
                return true
            }
        }

        // If it's an unneeded object (receipt, laptop, etc.), flag it
        if isUnneededObject {
            if debugMode { print("🔴 Clutter: content is '\(contentLabel ?? "unknown")' (unneeded object) \(assetId)") }
            return true
        }

        // 5. Size heuristics (now only for images not flagged by content/metadata)
        // Protect large, high-quality photos
        if pixelCount > 1_000_000 && fileSize > 1_000_000 {
            if useQualityAssessment, let analyzer = qualityAnalyzer {
                if let score = getQualityScore(for: asset, using: analyzer), score < 3.0 {
                    if debugMode { print("🔴 Clutter: large photo but extremely low quality (\(score)) \(assetId)") }
                    return true
                }
            }
            if debugMode { print("🟢 Not clutter: large, high-quality photo (no content flags) \(assetId)") }
            return false
        }

        // Smaller / suspicious photos
        if pixelCount < minPixelCount {
            if debugMode { print("🔴 Clutter: low resolution (\(pixelCount) < \(minPixelCount)) \(assetId)") }
            return true
        }
        if fileSize < maxFileSizeBytes {
            if debugMode { print("🔴 Clutter: small file size (\(fileSize) < \(maxFileSizeBytes)) \(assetId)") }
            return true
        }
        if asset.location == nil {
            if debugMode { print("🔴 Clutter: no location data \(assetId)") }
            return true
        }

        // Low ML quality (NIMA score)
        if useQualityAssessment, let analyzer = qualityAnalyzer {
            if let score = getQualityScore(for: asset, using: analyzer), score < qualityThreshold {
                if debugMode { print("🔴 Clutter: low quality score (\(score) < \(qualityThreshold)) \(assetId)") }
                return true
            }
        }

        if debugMode { print("🟢 Not clutter: passed all checks \(assetId)") }
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

        let assetId = asset.localIdentifier
        let isTarget = assetId == "341BCE39-F873-4678-979A-5FC1752ADA81/L0/001"
        if isTarget {
            print("   🔍 getContentLabel: requesting image for \(assetId)")
        }

        PHImageManager.default().requestImage(
            for: asset,
            targetSize: targetSize,
            contentMode: .aspectFit,
            options: options
        ) { image, _ in
            guard let image = image else {
                if isTarget { print("   ❌ getContentLabel: no image returned") }
                semaphore.signal()
                return
            }
            if isTarget { print("   ✅ getContentLabel: image received, classifying...") }
            classifier.classify(image) { result in
                label = result
                if isTarget {
                    if let result = result {
                        print("   ✅ getContentLabel: classification result: \(result)")
                    } else {
                        print("   ❌ getContentLabel: classification returned nil")
                    }
                }
                semaphore.signal()
            }
        }

        semaphore.wait()
        return label
    }
}
