import Photos

struct AssetMeta {
    let size: Int64        // 0 = unknown
    let filename: String
}

enum AssetMetadata {
    /// ONE PHAssetResource lookup per asset, giving both size and filename.
    /// NOTE: "fileSize" is an undocumented KVC key. It works today but is the one
    /// part of this module that could break in a future iOS version.
    static func read(_ asset: PHAsset) -> AssetMeta {
        let res = PHAssetResource.assetResources(for: asset)
        guard let r = res.first(where: { $0.type == .photo }) ?? res.first else {
            return AssetMeta(size: 0, filename: "")
        }
        let size = (r.value(forKey: "fileSize") as? NSNumber)?.int64Value ?? 0
        return AssetMeta(size: size, filename: r.originalFilename)
    }
}

enum FilenameHeuristics {
    /// Removed from the old list: "IMG_" (that is EVERY iPhone camera file, so the
    /// old code treated every photo as a download), plus "Line"/"Signal" which
    /// matched random filenames. Patterns below are specific to real download sources.
    static let defaultKeywords: [String] = [
        "whatsapp", "-wa0", "telegram", "signal-", "mmexport", "wx_camera", "line_",
        "download", "cache", "temp", "saved", "received_", "fb_img",
        "vid_", "pano_", "burst_"
    ]

    static func looksDownloaded(_ filename: String,
                                keywords: [String] = defaultKeywords,
                                flagNonCameraFormats: Bool = true) -> Bool {
        let n = filename.lowercased()
        if n.isEmpty { return false }
        if keywords.contains(where: { n.contains($0) }) { return true }
        if flagNonCameraFormats {
            let ext = (n as NSString).pathExtension
            if ext == "png" || ext == "webp" || ext == "gif" { return true }
        }
        return false
    }
}

/// Kept for API compatibility.
class StorageCalculator {
    static func totalSize(of assets: [PHAsset]) -> Int64 {
        assets.reduce(0) { $0 + AssetMetadata.read($1).size }
    }
    static func fileSize(of asset: PHAsset) -> Int64? {
        let s = AssetMetadata.read(asset).size
        return s > 0 ? s : nil
    }
    static func totalSavings(screenshots: [String], duplicates: [[String]], blurry: [String],
                             livePhotos: [String], allAssets: [PHAsset]) -> Int64 {
        let ids = Set(screenshots + blurry + livePhotos + duplicates.flatMap { $0 })
        return totalSize(of: allAssets.filter { ids.contains($0.localIdentifier) })
    }
}
