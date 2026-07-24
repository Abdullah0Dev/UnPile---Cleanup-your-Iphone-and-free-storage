import ExpoModulesCore
import Photos
import Vision
import CoreImage
import UIKit

public class PhotoAnalyzerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoPhotoAnalyzer")

    // Main function called from JS
    AsyncFunction("analyzePhotos") { (useAI: Bool, promise: Promise) in
      let analyzer = PhotoAnalyzer(useAI: useAI)
      analyzer.analyze { progress, category in
        self.sendEvent("onProgress", [
          "progress": progress,
          "category": category
        ])
      } completion: { result, error in
        if let error = error {
          promise.reject(error)
        } else if let result = result {
          promise.resolve(result)
        }
      }
    }

    Events("onProgress")
  }
}

// MARK: - PhotoAnalyzer class
class PhotoAnalyzer {
  private let useAI: Bool
  private var allAssets: [PHAsset] = []
  private let imageManager = PHImageManager.default()
  private let thumbnailSize = CGSize(width: 300, height: 300)

  // Result structures
  var screenshots: [String] = []
  var duplicateClusters: [[String]] = []
  var blurry: [String] = []
  var livePhotos: [String] = []
  var totalSavings: Int64 = 0

  init(useAI: Bool) {
    self.useAI = false//useAI
  }

  func analyze(progressHandler: @escaping (Float, String) -> Void,
               completion: @escaping ([String: Any]?, Error?) -> Void) {

    DispatchQueue.global(qos: .userInitiated).async {
      // 1. Fetch all image assets
      let fetchOptions = PHFetchOptions()
      fetchOptions.sortDescriptors = [NSSortDescriptor(key: "creationDate", ascending: false)]
      let assets = PHAsset.fetchAssets(with: .image, options: fetchOptions)
      self.allAssets = assets.objects(at: IndexSet(0..<assets.count))
      let total = Float(self.allAssets.count)

      // 2. Screenshots detection
      progressHandler(0.0, "Finding screenshots...")
      self.detectScreenshots()
      progressHandler(0.2, "Screenshots done")

      // 3. Duplicate detection (heavy, update progress)
      progressHandler(0.25, "Scanning for duplicates...")
      self.detectDuplicates(progressHandler: { subProgress in
        let overall = 0.25 + (subProgress * 0.35)
        progressHandler(overall, "Duplicates \(Int(subProgress*100))%")
      })
      progressHandler(0.6, "Duplicates done")

      // 4. Blur detection
      progressHandler(0.65, "Checking photo quality...")
      self.detectBlur { subProgress in
        let overall = 0.65 + (subProgress * 0.2)
        progressHandler(overall, "Quality check \(Int(subProgress*100))%")
      }
      progressHandler(0.85, "Quality check done")

      // 5. Live Photos (just identify them)
      progressHandler(0.9, "Finding large Live Photos...")
      self.detectLivePhotos()
      progressHandler(0.95, "Wrapping up")

      // 6. Calculate total savings
      self.calculateSavings()
      progressHandler(1.0, "Done")

      // Build result dictionary
      let result: [String: Any] = [
        "screenshots": self.screenshots,
        "duplicates": self.duplicateClusters,
        "blurry": self.blurry,
        "livePhotos": self.livePhotos,
        "totalSavingsBytes": self.totalSavings
      ]
      completion(result, nil)
    }
  }

  private func detectScreenshots() {
    var screenshotAssets: [String] = []
    for asset in allAssets {
      if asset.mediaSubtypes.contains(.photoScreenshot) {
        screenshotAssets.append(asset.localIdentifier)
      } else if useAI {
        // AI fallback: check with Core ML if it looks like a screenshot
        // We'll implement this later (optional)
        if ScreenshotAIClassifier.shared.isScreenshot(asset: asset) {
          screenshotAssets.append(asset.localIdentifier)
        }
      }
    }
    self.screenshots = screenshotAssets
  }

  private func detectDuplicates(progressHandler: @escaping (Float) -> Void) {
    let detector = DuplicateDetector()
    let clusters = detector.findDuplicates(assets: allAssets, progressHandler: progressHandler)
    self.duplicateClusters = clusters.map { $0.map { $0.localIdentifier } }
  }

  private func detectBlur(progressHandler: @escaping (Float) -> Void) {
    let detector = BlurDetector()
    let blurryIds = detector.findBlurry(assets: allAssets, progressHandler: progressHandler)
    self.blurry = blurryIds
  }

  private func detectLivePhotos() {
    // Find all Live Photos, sorted by size (largest first)
    let liveAssets = allAssets.filter { $0.mediaSubtypes.contains(.photoLive) }
    // Get file size for each, sort, take top N? For MVP we can just list all.
    self.livePhotos = liveAssets.map { $0.localIdentifier }
  }

  private func calculateSavings() {
    var total: Int64 = 0
    let allCandidateIds = Set(screenshots + blurry + livePhotos +
                              duplicateClusters.flatMap { $0 })

    for asset in allAssets where allCandidateIds.contains(asset.localIdentifier) {
      if let resource = PHAssetResource.assetResources(for: asset).first {
        if let size = resource.value(forKey: "fileSize") as? Int64 {
          total += size
        }
      }
    }
    self.totalSavings = total
  }
}