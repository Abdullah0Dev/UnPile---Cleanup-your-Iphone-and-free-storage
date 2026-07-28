import ExpoModulesCore
import Photos
import Combine

public class ExpoPhotoAnalyzerModule: Module {
    private var cancellables = Set<AnyCancellable>()
    private var analyzer: PhotoAnalyzer?

    public func definition() -> ModuleDefinition {
        Name("ExpoPhotoAnalyzer")
        Events("onProgress")

        AsyncFunction("analyzePhotos") { promise in
            self.performAnalysis(promise: promise)
        }

        Function("hello") {
            return "Hello from ExpoPhotoAnalyzer! 🤲"
        }

        AsyncFunction("deletePhotos") { ids, promise in
            self.performDeletion(ids: ids, promise: promise)
        }
    }

    // ── Private Helpers ──────────────────────────────────────────

    private func performAnalysis(promise: Promise) {
        let status = PHPhotoLibrary.authorizationStatus()
        guard status == .authorized || status == .limited else {
            promise.reject("PERMISSION_DENIED", "Photo library access is required. Please grant permission.")
            return
        }

        let analyzer = PhotoAnalyzer()
        self.analyzer = analyzer

        Publishers.CombineLatest(analyzer.$progress, analyzer.$category)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] progress, category in
                self?.sendEvent("onProgress", [
                    "progress": progress,
                    "category": category
                ])
            }
            .store(in: &self.cancellables)

        analyzer.analyzePhotos { [weak self] result in
            let dict = self?.convertResult(result) ?? [:]
            promise.resolve(dict)
            self?.cancellables.removeAll()
            self?.analyzer = nil
        }
    }

    private func performDeletion(ids: [String], promise: Promise) {
        let status = PHPhotoLibrary.authorizationStatus()
        guard status == .authorized || status == .limited else {
            promise.reject("PERMISSION_DENIED", "Photo library access required to delete photos.")
            return
        }

        let assets = PHAsset.fetchAssets(withLocalIdentifiers: ids, options: nil)
        guard assets.count > 0 else {
            promise.reject("NO_ASSETS", "No valid assets found to delete.")
            return
        }

        PHPhotoLibrary.shared().performChanges({
            PHAssetChangeRequest.deleteAssets(assets)
        }) { success, error in
            if success {
                promise.resolve([
                    "success": true,
                    "deletedCount": assets.count,
                    "errors": [] as [String]
                ])
            } else {
                let errorMessage = error?.localizedDescription ?? "Unknown error"
                promise.reject("DELETE_FAILED", errorMessage)
            }
        }
    }

    // ── Result conversion ──────────────────────────────────────────

    private func convertResult(_ result: AnalysisResult) -> [String: Any] {
        return [
            "screenshots": result.screenshots,
            "screenshotCandidates": result.screenshotCandidates,
            "duplicateGroups": result.duplicateGroups.map { group in
                [
                    "bestAssetId": group.bestAsset.localIdentifier,
                    "duplicateAssetIds": group.duplicateAssets.map { $0.localIdentifier }
                ]
            },
            "clutter": result.clutter,
            "blurry": result.blurry,
            "livePhotos": result.livePhotos,
            "livePhotoCandidates": result.livePhotoCandidates,
            "totalSavingsBytes": result.totalSavingsBytes,
            "categorySavings": result.categorySavings,
            "assetSizes": result.assetSizes  // ✅
        ]
    }
}
