import Photos
import Vision
import CoreImage
import UIKit
import Combine

// MARK: - Data Models

public struct DuplicateGroup {
    public let bestAsset: PHAsset
    public let duplicateAssets: [PHAsset]

    public var allAssets: [PHAsset] {
        [bestAsset] + duplicateAssets
    }
}

public struct AnalysisResult {
    public let screenshots: [String]
    public let screenshotCandidates: [String]
    public let duplicateGroups: [DuplicateGroup]
    public let clutter: [String]
    public let blurry: [String]
    public let livePhotos: [String]
    public let livePhotoCandidates: [String]
    public let totalSavingsBytes: Int64
    public let categorySavings: [String: Int64]
    public let assetSizes: [String: Int64]  //  New
}

// MARK: - PhotoAnalyzer

public class PhotoAnalyzer: ObservableObject {
    @Published public var progress: Float = 0
    @Published public var category: String = ""
    @Published public var result: AnalysisResult? = nil
    @Published public var isScanning = false

    private let screenshotClassifier = ScreenshotClassifier()
    private let livePhotoDetector = LivePhotoDetector()

    public init() {}

    // MARK: - Helpers (shared)

    private func computeCategorySavings(
        _ assets: [PHAsset],
        screenshotCandidates: [String],
        duplicateGroups: [DuplicateGroup],
        blurry: [String],
        clutter: [String],
        livePhotoCandidates: [String]
    ) -> [String: Int64] {
        var savings: [String: Int64] = [:]

        func size(for assetId: String) -> Int64 {
            let assets = PHAsset.fetchAssets(withLocalIdentifiers: [assetId], options: nil)
            guard let asset = assets.firstObject,
                  let resource = PHAssetResource.assetResources(for: asset).first,
                  let size = resource.value(forKey: "fileSize") as? Int64 else {
                return 0
            }
            return size
        }

        let screenshotSize = screenshotCandidates.reduce(0) { $0 + size(for: $1) }
        savings["screenshots"] = screenshotSize

        let duplicateIds = duplicateGroups.flatMap { $0.duplicateAssets.map { $0.localIdentifier } }
        let duplicateSize = duplicateIds.reduce(0) { $0 + size(for: $1) }
        savings["duplicates"] = duplicateSize

        let blurrySize = blurry.reduce(0) { $0 + size(for: $1) }
        savings["blurry"] = blurrySize

        let clutterSize = clutter.reduce(0) { $0 + size(for: $1) }
        savings["clutter"] = clutterSize

        let liveSize = livePhotoCandidates.reduce(0) { $0 + size(for: $1) }
        savings["livePhotos"] = liveSize

        return savings
    }

    private func computeAssetSizes(for ids: [String]) -> [String: Int64] {
        var sizes: [String: Int64] = [:]
        for id in ids {
            let assets = PHAsset.fetchAssets(withLocalIdentifiers: [id], options: nil)
            guard let asset = assets.firstObject,
                  let resource = PHAssetResource.assetResources(for: asset).first,
                  let size = resource.value(forKey: "fileSize") as? Int64 else {
                continue
            }
            sizes[id] = size
        }
        return sizes
    }

    private func updateProgress(_ progress: Float, _ category: String) {
        DispatchQueue.main.async {
            self.progress = progress
            self.category = category
        }
    }

    private func detectDuplicates(_ assets: [PHAsset], progressHandler: @escaping (Float) -> Void) -> [DuplicateGroup] {
        let detector = DuplicateDetector()
        return detector.findDuplicateGroups(assets: assets, progressHandler: progressHandler)
    }

    private func detectBlur(_ assets: [PHAsset], progressHandler: @escaping (Float) -> Void) -> [String] {
        let detector = BlurDetector()
        return detector.findBlurry(assets: assets, progressHandler: progressHandler)
    }

    private func detectClutter(_ assets: [PHAsset], progressHandler: @escaping (Float) -> Void) -> [String] {
        let detector = ClutterDetector()
        detector.debugMode = false
        detector.ageThresholdDays = 30
        detector.maxFileSizeBytes = 500 * 1024
        detector.qualityThreshold = 4.0
        return detector.findClutter(assets: assets, progressHandler: progressHandler)
    }

    private func calculateTotalSavings(_ assets: [PHAsset],
                                       screenshotCandidates: [String],
                                       duplicateGroups: [DuplicateGroup],
                                       blurry: [String],
                                       clutter: [String],
                                       livePhotoCandidates: [String]) -> Int64 {
        var candidateIds = Set<String>()
        candidateIds.formUnion(screenshotCandidates)
        candidateIds.formUnion(blurry)
        candidateIds.formUnion(clutter)
        candidateIds.formUnion(livePhotoCandidates)

        for group in duplicateGroups {
            for asset in group.duplicateAssets {
                candidateIds.insert(asset.localIdentifier)
            }
        }

        var total: Int64 = 0
        for asset in assets where candidateIds.contains(asset.localIdentifier) {
            if let resource = PHAssetResource.assetResources(for: asset).first,
               let size = resource.value(forKey: "fileSize") as? Int64 {
                total += size
            }
        }
        return total
    }

    // MARK: - For SwiftUI

    public func startAnalysis() {
        guard !isScanning else { return }
        isScanning = true
        progress = 0

        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self = self else { return }

            let fetchOptions = PHFetchOptions()
            fetchOptions.sortDescriptors = [NSSortDescriptor(key: "creationDate", ascending: false)]
            let assets = PHAsset.fetchAssets(with: .image, options: fetchOptions)
            let allAssets = assets.objects(at: IndexSet(0..<assets.count))

            // 1. Screenshots
            self.updateProgress(0.0, "Finding screenshots...")
            let screenshotAssets = self.screenshotClassifier.detectScreenshots(from: allAssets)
            let screenshotIds = screenshotAssets.map { $0.localIdentifier }
            let candidateScreenshotAssets = self.screenshotClassifier.suggestCandidates(from: screenshotAssets)
            let candidateScreenshotIds = candidateScreenshotAssets.map { $0.localIdentifier }
            self.updateProgress(0.2, "Screenshots done")

            // 2. Duplicates
            self.updateProgress(0.25, "Scanning for duplicates...")
            let duplicateGroups = self.detectDuplicates(allAssets) { sub in
                let overall = 0.25 + sub * 0.35
                self.updateProgress(overall, "Duplicates \(Int(sub*100))%")
            }
            self.updateProgress(0.6, "Duplicates done")

            // 3. Blurry
            self.updateProgress(0.65, "Checking photo quality...")
            let blurry = self.detectBlur(allAssets) { sub in
                let overall = 0.65 + sub * 0.2
                self.updateProgress(overall, "Quality check \(Int(sub*100))%")
            }
            self.updateProgress(0.85, "Quality check done")

            // 4. Live Photos
            self.updateProgress(0.87, "Finding Live Photos...")
            let livePhotoAssets = self.livePhotoDetector.detectLivePhotos(from: allAssets)
            let livePhotoIds = livePhotoAssets.map { $0.localIdentifier }
            let candidateLivePhotoAssets = self.livePhotoDetector.suggestCandidates(from: livePhotoAssets)
            let candidateLivePhotoIds = candidateLivePhotoAssets.map { $0.localIdentifier }
            self.updateProgress(0.93, "Live Photos done")

            // 5. Clutter
            self.updateProgress(0.93, "Finding clutter...")
            let clutter = self.detectClutter(allAssets) { sub in
                let overall = 0.93 + sub * 0.05
                self.updateProgress(overall, "Clutter \(Int(sub*100))%")
            }
            self.updateProgress(0.98, "Clutter done")

            // 6. Savings
            let totalSavings = self.calculateTotalSavings(
                allAssets,
                screenshotCandidates: candidateScreenshotIds,
                duplicateGroups: duplicateGroups,
                blurry: blurry,
                clutter: clutter,
                livePhotoCandidates: candidateLivePhotoIds
            )

            let categorySavings = self.computeCategorySavings(
                allAssets,
                screenshotCandidates: candidateScreenshotIds,
                duplicateGroups: duplicateGroups,
                blurry: blurry,
                clutter: clutter,
                livePhotoCandidates: candidateLivePhotoIds
            )

            // Collect all asset IDs for assetSizes
            let allIds = Set(
                screenshotIds +
                candidateScreenshotIds +
                duplicateGroups.flatMap { [$0.bestAsset.localIdentifier] + $0.duplicateAssets.map { $0.localIdentifier } } +
                clutter +
                blurry +
                livePhotoIds +
                candidateLivePhotoIds
            )
            let assetSizes = self.computeAssetSizes(for: Array(allIds))

            self.updateProgress(1.0, "Done")

            let analysisResult = AnalysisResult(
                screenshots: screenshotIds,
                screenshotCandidates: candidateScreenshotIds,
                duplicateGroups: duplicateGroups,
                clutter: clutter,
                blurry: blurry,
                livePhotos: livePhotoIds,
                livePhotoCandidates: candidateLivePhotoIds,
                totalSavingsBytes: totalSavings,
                categorySavings: categorySavings,
                assetSizes: assetSizes  // 
            )

            DispatchQueue.main.async {
                self.result = analysisResult
                self.isScanning = false
            }
        }
    }

    // MARK: - For React Native / Expo

    public func analyzePhotos(completion: @escaping (AnalysisResult) -> Void) {
        guard !isScanning else { return }
        isScanning = true
        progress = 0

        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self = self else { return }

            let fetchOptions = PHFetchOptions()
            fetchOptions.sortDescriptors = [NSSortDescriptor(key: "creationDate", ascending: false)]
            let assets = PHAsset.fetchAssets(with: .image, options: fetchOptions)
            let allAssets = assets.objects(at: IndexSet(0..<assets.count))

            // 1. Screenshots
            self.updateProgress(0.0, "Finding screenshots...")
            let screenshotAssets = self.screenshotClassifier.detectScreenshots(from: allAssets)
            let screenshotIds = screenshotAssets.map { $0.localIdentifier }
            let candidateScreenshotAssets = self.screenshotClassifier.suggestCandidates(from: screenshotAssets)
            let candidateScreenshotIds = candidateScreenshotAssets.map { $0.localIdentifier }
            self.updateProgress(0.2, "Screenshots done")

            // 2. Duplicates
            self.updateProgress(0.25, "Scanning for duplicates...")
            let duplicateGroups = self.detectDuplicates(allAssets) { sub in
                let overall = 0.25 + sub * 0.35
                self.updateProgress(overall, "Duplicates \(Int(sub*100))%")
            }
            self.updateProgress(0.6, "Duplicates done")

            // 3. Blurry
            self.updateProgress(0.65, "Checking photo quality...")
            let blurry = self.detectBlur(allAssets) { sub in
                let overall = 0.65 + sub * 0.2
                self.updateProgress(overall, "Quality check \(Int(sub*100))%")
            }
            self.updateProgress(0.85, "Quality check done")

            // 4. Live Photos
            self.updateProgress(0.87, "Finding Live Photos...")
            let livePhotoAssets = self.livePhotoDetector.detectLivePhotos(from: allAssets)
            let livePhotoIds = livePhotoAssets.map { $0.localIdentifier }
            let candidateLivePhotoAssets = self.livePhotoDetector.suggestCandidates(from: livePhotoAssets)
            let candidateLivePhotoIds = candidateLivePhotoAssets.map { $0.localIdentifier }
            self.updateProgress(0.93, "Live Photos done")

            // 5. Clutter
            self.updateProgress(0.93, "Finding clutter...")
            let clutter = self.detectClutter(allAssets) { sub in
                let overall = 0.93 + sub * 0.05
                self.updateProgress(overall, "Clutter \(Int(sub*100))%")
            }
            self.updateProgress(0.98, "Clutter done")

            // 6. Savings
            let totalSavings = self.calculateTotalSavings(
                allAssets,
                screenshotCandidates: candidateScreenshotIds,
                duplicateGroups: duplicateGroups,
                blurry: blurry,
                clutter: clutter,
                livePhotoCandidates: candidateLivePhotoIds
            )

            let categorySavings = self.computeCategorySavings(
                allAssets,
                screenshotCandidates: candidateScreenshotIds,
                duplicateGroups: duplicateGroups,
                blurry: blurry,
                clutter: clutter,
                livePhotoCandidates: candidateLivePhotoIds
            )

            // Collect all asset IDs for assetSizes
            let allIds = Set(
                screenshotIds +
                candidateScreenshotIds +
                duplicateGroups.flatMap { [$0.bestAsset.localIdentifier] + $0.duplicateAssets.map { $0.localIdentifier } } +
                clutter +
                blurry +
                livePhotoIds +
                candidateLivePhotoIds
            )
            let assetSizes = self.computeAssetSizes(for: Array(allIds))

            self.updateProgress(1.0, "Done")

            let analysisResult = AnalysisResult(
                screenshots: screenshotIds,
                screenshotCandidates: candidateScreenshotIds,
                duplicateGroups: duplicateGroups,
                clutter: clutter,
                blurry: blurry,
                livePhotos: livePhotoIds,
                livePhotoCandidates: candidateLivePhotoIds,
                totalSavingsBytes: totalSavings,
                categorySavings: categorySavings,
                assetSizes: assetSizes  // 
            )

            DispatchQueue.main.async {
                self.result = analysisResult
                self.isScanning = false
                completion(analysisResult)
            }
        }
    }
}
