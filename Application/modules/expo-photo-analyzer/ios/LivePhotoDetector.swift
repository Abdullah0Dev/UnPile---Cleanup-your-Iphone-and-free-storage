import Photos

final class LivePhotoDetector {
    var ageThresholdDays: Int = 60
    var qualityThreshold: Float = 2.0
    var useQualityAssessment = true
    var useFilenameCheck = true
    var useContentClassification = true

    func isLivePhoto(_ asset: PHAsset) -> Bool {
        asset.mediaSubtypes.contains(.photoLive)
    }

    func detectLivePhotos(from assets: [PHAsset]) -> [PHAsset] {
        assets.filter { isLivePhoto($0) }
    }

    /// Same decision table as before, evaluated cheapest-first so most Live Photos
    /// never need a face/object model run.
    func isCandidate(asset: PHAsset, meta: AssetMeta, inAlbum: Bool, now: Date, info: LazyImageInfo) -> Bool {
        if asset.isFavorite || inAlbum { return false }
        guard let created = asset.creationDate else { return false }

        let ageDays = Int(now.timeIntervalSince(created) / 86400)
        let old = ageDays >= ageThresholdDays
        let isDownload = useFilenameCheck && FilenameHeuristics.looksDownloaded(meta.filename)
        let pixels = asset.pixelWidth * asset.pixelHeight
        let hasCameraInfo = asset.location != nil || pixels >= 2_000_000

        // Old + (download or no camera info) -> delete, regardless of content.
        if old && (isDownload || !hasCameraInfo) { return true }

        if useContentClassification {
            if info.hasFace { return !hasCameraInfo }                   // keep real people shots
            if info.content?.isUnneededObject == true { return true }
        }

        if old { return true }

        if useQualityAssessment, let q = info.quality, q < qualityThreshold { return true }
        return false
    }
}
