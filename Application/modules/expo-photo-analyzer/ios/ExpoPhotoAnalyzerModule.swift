import ExpoModulesCore
import Photos
import Combine

public final class ExpoPhotoAnalyzerModule: Module {

    private var cancellables = Set<AnyCancellable>()

    private var analyzer: PhotoAnalyzer?

    // Protects the module from callbacks arriving after
    // the Expo app context has been destroyed.
    private let lifecycleLock = NSLock()

    private var contextIsAlive = true
    private var isObservingProgress = false

    public func definition() -> ModuleDefinition {

        Name("ExpoPhotoAnalyzer")

        Events("onProgress")

        // ---------------------------------------------
        // App lifecycle
        // ---------------------------------------------

        OnAppContextDestroys {
            self.handleAppContextDestroyed()
        }

        // ---------------------------------------------
        // Event lifecycle
        // ---------------------------------------------

        OnStartObserving("onProgress") {
            self.lifecycleLock.lock()
            self.isObservingProgress = true
            self.lifecycleLock.unlock()
        }

        OnStopObserving("onProgress") {
            self.lifecycleLock.lock()
            self.isObservingProgress = false
            self.lifecycleLock.unlock()
        }

        // ---------------------------------------------
        // Analyze
        // ---------------------------------------------

        AsyncFunction("analyzePhotos") { [weak self] promise in

            guard let self else {
                return
            }

            self.performAnalysis(
                promise: promise
            )
        }

        // ---------------------------------------------
        // Test
        // ---------------------------------------------

        Function("hello") {
            return "Hello from ExpoPhotoAnalyzer! 🤲"
        }

        // ---------------------------------------------
        // Delete
        // ---------------------------------------------

        AsyncFunction("deletePhotos") {
            ids,
            promise in

            self.performDeletion(
                ids: ids,
                promise: promise
            )
        }
    }

    // MARK: - Lifecycle

    private func handleAppContextDestroyed() {

        lifecycleLock.lock()

        contextIsAlive = false
        isObservingProgress = false

        lifecycleLock.unlock()

        // Stop future progress callbacks.
        cancellables.removeAll()

        // Stop the expensive native scan.
        analyzer?.cancel()

        analyzer = nil
    }

    private func canUseContext() -> Bool {

        lifecycleLock.lock()
        defer {
            lifecycleLock.unlock()
        }

        return contextIsAlive
    }

    private func shouldSendProgress() -> Bool {

        lifecycleLock.lock()
        defer {
            lifecycleLock.unlock()
        }

        return contextIsAlive &&
               isObservingProgress
    }

    // MARK: - Permissions

    private func hasPhotoAccess() -> Bool {

        let status =
            PHPhotoLibrary.authorizationStatus(
                for: .readWrite
            )

        return status == .authorized ||
               status == .limited
    }

    // MARK: - Analysis

    private func performAnalysis(
        promise: Promise
    ) {

        guard canUseContext() else {
            return
        }

        guard hasPhotoAccess() else {

            promise.reject(
                "PERMISSION_DENIED",
                "Photo library access is required. Please grant permission."
            )

            return
        }

        guard analyzer == nil else {

            promise.reject(
                "ALREADY_RUNNING",
                "A scan is already in progress."
            )

            return
        }

        let analyzer =
            PhotoAnalyzer()

        self.analyzer =
            analyzer

        // ---------------------------------------------
        // Progress events
        // ---------------------------------------------

        analyzer.$progress
            .combineLatest(analyzer.$category)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] progress, category in

                guard let self else {
                    return
                }

                self.sendEvent(
                    "onProgress",
                    [
                        "progress": progress,
                        "stage": category,
                        "totalItems": analyzer.totalItems,
                        "processedItems": analyzer.processedItems
                    ]
                )
            }
            .store(in: &cancellables)

        // ---------------------------------------------
        // Scan
        // ---------------------------------------------

        analyzer.analyzePhotos {
            [weak self] result in

            guard let self else {
                return
            }

            // The JS context may have disappeared while
            // the native scan was running.
            guard self.canUseContext() else {
                return
            }

            // Capture conversion BEFORE clearing the analyzer.
            let dict =
                self.convertResult(result)

            self.analyzer = nil
            self.cancellables.removeAll()

            // Resolve ONLY while the context is alive.
            promise.resolve(dict)
        }
    }

    // MARK: - Deletion

    private func performDeletion(
        ids: [String],
        promise: Promise
    ) {

        guard canUseContext() else {
            return
        }

        guard hasPhotoAccess() else {

            promise.reject(
                "PERMISSION_DENIED",
                "Photo library access required to delete photos."
            )

            return
        }

        let assets =
            PHAsset.fetchAssets(
                withLocalIdentifiers: ids,
                options: nil
            )

        guard assets.count > 0 else {

            promise.reject(
                "NO_ASSETS",
                "No valid assets found to delete."
            )

            return
        }

        PHPhotoLibrary.shared()
            .performChanges({

                PHAssetChangeRequest.deleteAssets(
                    assets
                )

            }) { [weak self] success, error in

                guard
                    let self,
                    self.canUseContext()
                else {
                    return
                }

                if success {

                    promise.resolve([
                        "success": true,
                        "deletedCount": assets.count,
                        "errors": [] as [String]
                    ])

                } else {

                    promise.reject(
                        "DELETE_FAILED",
                        error?.localizedDescription ??
                        "Unknown error"
                    )
                }
            }
    }

    // MARK: - Result conversion

    private func convertResult(
        _ result: AnalysisResult
    ) -> [String: Any] {

        return [

            "screenshots":
                result.screenshots,

            "screenshotCandidates":
                result.screenshotCandidates,

            "duplicateGroups":
                result.duplicateGroups.map {
                    group in

                    [
                        "bestAssetId":
                            group.bestAsset.localIdentifier,

                        "duplicateAssetIds":
                            group.duplicateAssets.map {
                                $0.localIdentifier
                            }
                    ]
                },

            "clutter":
                result.clutter,

            "blurry":
                result.blurry,

            "livePhotos":
                result.livePhotos,

            "livePhotoCandidates":
                result.livePhotoCandidates,

            "totalSavingsBytes":
                result.totalSavingsBytes,

            "categorySavings":
                result.categorySavings,

            "assetSizes":
                result.assetSizes
        ]
    }
}
