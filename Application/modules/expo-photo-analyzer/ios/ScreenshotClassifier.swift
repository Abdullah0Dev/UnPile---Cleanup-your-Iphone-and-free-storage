import Photos

final class ScreenshotClassifier {
    var ageThresholdDays: Int = 30
    var qualityThreshold: Float = 4.0
    /// Off by default: NIMA scores *photo aesthetics*, which is meaningless for UI screenshots,
    /// and it was the slowest part of this step.
    var useQualityAssessment = false

    func isScreenshot(_ asset: PHAsset) -> Bool {
        asset.mediaSubtypes.contains(.photoScreenshot)
    }

    func detectScreenshots(from assets: [PHAsset]) -> [PHAsset] {
        assets.filter { isScreenshot($0) }
    }

    func isCandidate(_ asset: PHAsset, inAlbum: Bool, now: Date, quality: () -> Float?) -> Bool {
        if asset.isFavorite || inAlbum { return false }   // the user organised it
        if let d = asset.creationDate, now.timeIntervalSince(d) > Double(ageThresholdDays) * 86400 {
            return true
        }
        if useQualityAssessment, let q = quality(), q < qualityThreshold { return true }
        return false
    }
}
