import ExpoModulesCore
import Photos
import Combine

public class ExpoPhotoAnalyzerModule: Module {
    private var cancellables = Set<AnyCancellable>()
    private var analyzer: PhotoAnalyzer?

    public func definition() -> ModuleDefinition {
        Name("ExpoPhotoAnalyzer")

        // Declare the event name so JS can subscribe to it
        Events("onProgress")

        AsyncFunction("analyzePhotos") { (promise: Promise) in
            let status = PHPhotoLibrary.authorizationStatus()
            guard status == .authorized || status == .limited else {
                promise.reject("PERMISSION_DENIED", "Photo library access is required. Please grant permission.")
                return
            }

            let analyzer = PhotoAnalyzer()
            self.analyzer = analyzer

            // Bridge the same @Published progress/category the SwiftUI version used,
            // and forward every change to JS as a native event.
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

        Function("hello") {
            return "Hello from ExpoPhotoAnalyzer! 🌎"
        }
    }

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
