import Photos

final class LivePhotoDetector {
    var ageThresholdDays: Int = 60
    var downloadAgeThresholdDays: Int = 10

    var useFilenameCheck = true
    var useContentClassification = true

    func isLivePhoto(_ asset: PHAsset) -> Bool {
        asset.mediaSubtypes.contains(.photoLive)
    }

    func detectLivePhotos(from assets: [PHAsset]) -> [PHAsset] {
        assets.filter { isLivePhoto($0) }
    }

    func isCandidate(
        asset: PHAsset,
        meta: AssetMeta,
        inAlbum: Bool,
        now: Date,
        info: LazyImageInfo
    ) -> Bool {
        if asset.isFavorite || inAlbum {
            return false
        }

        guard let created = asset.creationDate else {
            return false
        }

        let ageDays = max(
            0,
            Int(now.timeIntervalSince(created) / 86_400)
        )

        let isDownload =
            useFilenameCheck &&
            FilenameHeuristics.looksDownloaded(meta.filename)

        // Recent live photos are protected.
        if !isDownload && ageDays < ageThresholdDays {
            return false
        }

        if isDownload && ageDays < downloadAgeThresholdDays {
            return false
        }

        let pixels = max(
            1,
            asset.pixelWidth * asset.pixelHeight
        )

        let hasCameraInfo =
            asset.location != nil || pixels >= 2_000_000

        // For downloaded or weak-camera-signature items, protect obvious people.
        if useContentClassification &&
           (isDownload || !hasCameraInfo) {

            if info.hasFace {
                return false
            }

            if info.content?.isPersonLike == true {
                return false
            }
        }

        // Preserve the existing behavior: an old Live Photo becomes a candidate.
        return ageDays >= ageThresholdDays || isDownload
    }
}
