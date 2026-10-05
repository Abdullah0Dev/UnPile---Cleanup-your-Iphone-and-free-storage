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

    var treatNonCameraFormatsAsDownloads = true

    /// Large modern camera images get strong protection by default.
    private let cameraPixelThreshold = 2_000_000
    private let strongCameraPixelThreshold = 6_000_000

    func isClutter(
        asset: PHAsset,
        meta: AssetMeta,
        inAlbum: Bool,
        now: Date,
        info: LazyImageInfo,
        stats: ImageStats?
    ) -> Bool {
        // 1. Hard protection.
        if asset.mediaSubtypes.contains(.photoScreenshot) ||
           asset.isFavorite ||
           inAlbum {
            return false
        }

        // 2. Age gate.
        guard let created = asset.creationDate else {
            return false
        }

        let ageDays = max(
            0,
            Int(now.timeIntervalSince(created) / 86_400)
        )

        let isDownload = useFilenameCheck &&
            FilenameHeuristics.looksDownloaded(
                meta.filename,
                flagNonCameraFormats: treatNonCameraFormatsAsDownloads
            )

        let requiredAge =
            isDownload
            ? downloadAgeThresholdDays
            : ageThresholdDays

        guard ageDays >= requiredAge else {
            return false
        }

        let pixels = max(
            1,
            asset.pixelWidth * asset.pixelHeight
        )

        let hasLocation = asset.location != nil
        let lowFileSize = meta.size > 0 && meta.size < maxFileSizeBytes

        // 3. Downloaded/chat/web image.
        // Protect obvious people before suggesting deletion.
        if isDownload {
            if useContentClassification {
                if info.hasFace {
                    return false
                }

                if info.content?.isPersonLike == true {
                    return false
                }
            }

            return true
        }

        // 4. Strongly suspicious images only.
        let weakCameraSignature =
            !hasLocation && pixels < cameraPixelThreshold

        let mediumCameraPhoto =
            pixels < strongCameraPixelThreshold

        let needsContentCheck =
            useContentClassification &&
            (weakCameraSignature || mediumCameraPhoto || lowFileSize)

        if needsContentCheck {
            // Face first: Vision is a cheap protection mechanism compared with ML.
            if info.hasFace {
                return false
            }

            // MobileNet second: catches people even when a face isn't detected.
            if info.content?.isPersonLike == true {
                return false
            }

            if info.content?.isUnneededObject == true {
                return true
            }
        }

        // 5. Obvious small / low-byte files.
        if pixels < minPixelCount {
            return true
        }

        if lowFileSize {
            return true
        }

        // 6. Missing camera signal + low resolution.
        if !hasLocation && pixels < cameraPixelThreshold {
            return true
        }

        // 7. NIMA only on suspicious images that survived the cheap rules.
        // Also avoid spending inference time on clearly high-quality stats.
        let needsQualityCheck: Bool

        if let stats {
            needsQualityCheck =
                stats.lapVariance < 450 ||
                stats.sharpness < 150 ||
                stats.contrastStd < 15
        } else {
            needsQualityCheck = true
        }

        if needsQualityCheck,
           useQualityAssessment,
           let q = info.quality,
           q < qualityThreshold {
            return true
        }

        // 8. Default = protect.
        return false
    }
}
