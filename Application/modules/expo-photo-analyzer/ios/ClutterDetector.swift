import Photos

final class ClutterDetector {
    var ageThresholdDays: Int = 30
    var downloadAgeThresholdDays: Int = 10
    var maxFileSizeBytes: Int64 = 500 * 1024
    var minPixelCount: Int = 480 * 480
    var qualityThreshold: Float = 4.0
    var useQualityAssessment = true
    var useContentClassification = true
    var useFilenameCheck = true
    /// png/webp/gif that aren't screenshots are almost always saved from the web or chats.
    var treatNonCameraFormatsAsDownloads = true

    /// Anything >= 2MP counts as "camera-like". (The old rule also required >2MB, which
    /// flagged ordinary 12MP HEIC family photos without GPS as clutter.)
    private let cameraPixelThreshold = 2_000_000

    func isClutter(asset: PHAsset, meta: AssetMeta, inAlbum: Bool, now: Date, info: LazyImageInfo) -> Bool {
        // 1. Never clutter: screenshots (own category), favorites, anything in an album
        if asset.mediaSubtypes.contains(.photoScreenshot) || asset.isFavorite || inAlbum { return false }

        // 2. Age + filename
        guard let created = asset.creationDate else { return false }
        let ageDays = Int(now.timeIntervalSince(created) / 86400)
        let isDownload = useFilenameCheck &&
            FilenameHeuristics.looksDownloaded(meta.filename, flagNonCameraFormats: treatNonCameraFormatsAsDownloads)

        if ageDays < (isDownload ? downloadAgeThresholdDays : ageThresholdDays) { return false }
        if isDownload { return true }

        // 3. Content rules (face detection / unneeded objects), lazy
        let pixels = asset.pixelWidth * asset.pixelHeight
        let hasCameraInfo = asset.location != nil || pixels >= cameraPixelThreshold

        if useContentClassification {
            if info.hasFace { return !hasCameraInfo }                  // person w/o camera info = saved image
            if info.content?.isUnneededObject == true { return true }  // receipt, laptop, ...
        }

        // 4. Large photos are protected unless extremely low quality
        if pixels > 1_000_000 && meta.size > 1_000_000 {
            if useQualityAssessment, let q = info.quality, q < 3.0 { return true }
            return false
        }

        // 5. Small / suspicious photos
        if pixels < minPixelCount { return true }
        if meta.size > 0 && meta.size < maxFileSizeBytes { return true }
        if asset.location == nil && pixels < cameraPixelThreshold { return true }

        if useQualityAssessment, let q = info.quality, q < qualityThreshold { return true }
        return false
    }
}
