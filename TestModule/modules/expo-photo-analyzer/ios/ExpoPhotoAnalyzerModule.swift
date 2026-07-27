import ExpoModulesCore
import Photos

public class ExpoPhotoAnalyzerModule: Module {
    public func definition() -> ModuleDefinition {
        Name("ExpoPhotoAnalyzer")

        // MARK: - Main analysis function
        AsyncFunction("analyzePhotos") { (promise: Promise) in
            // 1. Check photo library permissions
            let status = PHPhotoLibrary.authorizationStatus()
            guard status == .authorized || status == .limited else {
                promise.reject("PERMISSION_DENIED", "Photo library access is required. Please grant permission.")
                return
            }

            // 2. Create the analyzer
            let analyzer = PhotoAnalyzer()

            // 3. Start analysis with completion
            analyzer.analyzePhotos { result in
                let dict = self.convertResult(result)
                promise.resolve(dict)
            }
        }

        // MARK: - Test function
        Function("hello") {
            return "Hello from ExpoPhotoAnalyzer! 🌎"
        }
    }

    // MARK: - Helpers

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
            "totalSavingsBytes": result.totalSavingsBytes
        ]
    }
}
