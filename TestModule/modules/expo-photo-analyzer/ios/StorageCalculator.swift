import Photos

class StorageCalculator {

  /// Calculate total file size of a set of assets in bytes.
  static func totalSize(of assets: [PHAsset]) -> Int64 {
    var total: Int64 = 0
    for asset in assets {
      if let size = fileSize(of: asset) {
        total += size
      }
    }
    return total
  }

  /// Get file size of a single asset by looking at the first resource.
  static func fileSize(of asset: PHAsset) -> Int64? {
    guard let resource = PHAssetResource.assetResources(for: asset).first else { return nil }
    // The fileSize is a hidden property; we use KVC
    let size = resource.value(forKey: "fileSize") as? Int64
    return size
  }

  /// Calculate total savings for an analysis result dictionary.
  static func totalSavings(screenshots: [String],
                           duplicates: [[String]],
                           blurry: [String],
                           livePhotos: [String],
                           allAssets: [PHAsset]) -> Int64 {
    let candidateIds = Set(screenshots + blurry + livePhotos +
                           duplicates.flatMap { $0 })
    let candidates = allAssets.filter { candidateIds.contains($0.localIdentifier) }
    return totalSize(of: candidates)
  }
}