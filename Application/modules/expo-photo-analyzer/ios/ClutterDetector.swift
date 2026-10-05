import Photos

final class ClutterDetector {

    // MARK: - Settings

    var ageThresholdDays: Int = 30
    var downloadAgeThresholdDays: Int = 10

    var maxFileSizeBytes: Int64 = 500 * 1024
    var minPixelCount: Int = 480 * 480

    var qualityThreshold: Float = 4.0

    var useQualityAssessment = true
    var useContentClassification = true
    var useFilenameCheck = true

    var treatNonCameraFormatsAsDownloads = true

    // This is only a "camera-like" signal.
    // It does NOT mean "always keep".
    private let cameraPixelThreshold = 2_000_000

    // MARK: - Main decision

    func isClutter(
        asset: PHAsset,
        meta: AssetMeta,
        inAlbum: Bool,
        now: Date,
        info: LazyImageInfo,
        stats: ImageStats?
    ) -> Bool {

        // =============================================
        // 1. ABSOLUTE PROTECTION
        // =============================================

        // Screenshots are handled by the screenshot category.
        if asset.mediaSubtypes.contains(.photoScreenshot) {
            return false
        }

        // User explicitly marked it as important.
        if asset.isFavorite {
            return false
        }

        // Anything inside an album is considered intentional.
        if inAlbum {
            return false
        }

        // =============================================
        // 2. AGE GATE
        // =============================================

        guard let created = asset.creationDate else {
            return false
        }

        let ageDays = max(
            0,
            Int(
                now.timeIntervalSince(created) / 86_400
            )
        )

        let isDownload =
            useFilenameCheck &&
            FilenameHeuristics.looksDownloaded(
                meta.filename,
                flagNonCameraFormats:
                    treatNonCameraFormatsAsDownloads
            )

        let requiredAge =
            isDownload
            ? downloadAgeThresholdDays
            : ageThresholdDays

        // Recent photos are never clutter.
        guard ageDays >= requiredAge else {
            return false
        }

        // =============================================
        // 3. BASIC PHOTO SIGNALS
        // =============================================

        let pixels = max(
            1,
            asset.pixelWidth * asset.pixelHeight
        )

        let hasLocation =
            asset.location != nil

        // IMPORTANT:
        //
        // This does NOT mean the image was definitely
        // taken by the camera.
        //
        // It simply says:
        // "This looks like a normal high-resolution
        // camera photo."
        let looksCameraLike =
            hasLocation ||
            pixels >= cameraPixelThreshold

        let isTiny =
            pixels < minPixelCount

        let isTinyFile =
            meta.size > 0 &&
            meta.size < maxFileSizeBytes

        // =============================================
        // 4. DOWNLOADED / WEB / CHAT IMAGE
        // =============================================

        // A downloaded-looking image with weak camera
        // characteristics is very likely clutter.
        //
        // But if it's large / camera-like, don't instantly
        // delete it. Let the normal analysis continue.
        if isDownload && !looksCameraLike {
            return true
        }

        // =============================================
        // 5. EXTREMELY SMALL IMAGE
        // =============================================

        if isTiny {
            return true
        }

        // =============================================
        // 6. EXTREMELY SMALL FILE
        // =============================================

        if isTinyFile {
            return true
        }

        // =============================================
        // 7. CONTENT ANALYSIS
        // =============================================
        //
        // THIS IS ALSO USED FOR CAMERA PHOTOS.
        //
        // Camera-like != automatic keep.
        //
        // We simply protect people before checking
        // unwanted objects.
        // =============================================

        if useContentClassification {

            // -----------------------------------------
            // PERSON PROTECTION
            // -----------------------------------------
            //
            // MobileNet thinks the image contains a
            // person-like subject.
            //
            // Protect it from CLUTTER.
            //

            if info.content?.isPersonLike == true {
                return false
            }

            // -----------------------------------------
            // FACE PROTECTION
            // -----------------------------------------
            //
            // Vision actually detected a meaningful face.
            //

            if info.hasFace {
                return false
            }

            // -----------------------------------------
            // UNNEEDED OBJECT
            // -----------------------------------------
            //
            // Examples:
            // receipt
            // document
            // laptop
            // keyboard
            // monitor
            // etc.
            //

            if info.content?.isUnneededObject == true {
                return true
            }
        }

        // =============================================
        // 8. LOW-RES NON-CAMERA IMAGE
        // =============================================

        if !looksCameraLike &&
           pixels < cameraPixelThreshold {
            return true
        }

        // =============================================
        // 9. QUALITY CHECK
        // =============================================
        //
        // NIMA is NOT run blindly on every photo.
        //
        // Camera photos can reach this check.
        // That's intentional.
        //
        // But we only use it when the photo is somewhat
        // suspicious.
        // =============================================

        let suspiciousForQuality =
            !looksCameraLike ||
            isTinyFile ||
            pixels < 3_000_000

        if suspiciousForQuality,
           useQualityAssessment,
           let quality = info.quality,
           quality < qualityThreshold {

            return true
        }

        // =============================================
        // 10. DEFAULT
        // =============================================
        //
        // Normal camera photo reaches here.
        //
        // KEEP.
        //

        return false
    }
}
