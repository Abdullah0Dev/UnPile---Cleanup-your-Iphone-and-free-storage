import Photos
import Combine
import Foundation

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
    public let assetSizes: [String: Int64]
}

private struct AssetScan {
    var fingerprint: Fingerprint? = nil
    var sharpness: Float = 0
    var blurry = false
    var clutter = false
    var isScreenshot = false
    var screenshotCandidate = false
    var isLivePhoto = false
    var liveCandidate = false
}

// MARK: - Thread-safe scan storage

private final class ScanStorage {
    private let lock = NSLock()
    private var scans: [AssetScan]
    private var sizes: [Int64]

    init(count: Int) {
        scans = [AssetScan](repeating: AssetScan(), count: count)
        sizes = [Int64](repeating: 0, count: count)
    }

    @inline(__always)
    func write(index: Int, scan: AssetScan, size: Int64) {
        lock.lock()
        scans[index] = scan
        sizes[index] = size
        lock.unlock()
    }

    func snapshot() -> (scans: [AssetScan], sizes: [Int64]) {
        lock.lock()
        let scansCopy = scans
        let sizesCopy = sizes
        lock.unlock()
        return (scansCopy, sizesCopy)
    }
}

// MARK: - PhotoAnalyzer

public final class PhotoAnalyzer: ObservableObject {
    @Published public var progress: Float = 0
    @Published public var category: String = ""
    @Published public var result: AnalysisResult? = nil
    @Published public var isScanning = false

    private let screenshotClassifier = ScreenshotClassifier()
    private let livePhotoDetector = LivePhotoDetector()
    private let blurDetector = BlurDetector()
    private let clutterDetector = ClutterDetector()
    private let duplicateDetector = DuplicateDetector()

    private let stateLock = NSLock()
    private var running = false
    private var lastReported: Float = -1
    private var lastCategory = ""

    public init() {}

    // MARK: - Public API

    public func startAnalysis() {
        analyzePhotos { _ in }
    }

    public func analyzePhotos(
        completion: @escaping (AnalysisResult) -> Void
    ) {
        stateLock.lock()

        if running {
            stateLock.unlock()
            return
        }

        running = true
        stateLock.unlock()

        DispatchQueue.main.async {
            self.isScanning = true
            self.progress = 0
        }

        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self else { return }

            let analysis = self.performScan()

            DispatchQueue.main.async {
                self.result = analysis
                self.isScanning = false

                self.stateLock.lock()
                self.running = false
                self.stateLock.unlock()

                completion(analysis)
            }
        }
    }

    // MARK: - Scan

    private func performScan() -> AnalysisResult {
        report(0, "Preparing...", force: true)

        if ScanProfiler.shared.enabled {
            ScanProfiler.shared.reset()
        }

        let fetch = PHFetchOptions()
        fetch.sortDescriptors = [
            NSSortDescriptor(key: "creationDate", ascending: false)
        ]

        let fetched = PHAsset.fetchAssets(
            with: .image,
            options: fetch
        )

        var assets = [PHAsset]()
        assets.reserveCapacity(fetched.count)

        fetched.enumerateObjects { asset, _, _ in
            assets.append(asset)
        }

        let n = assets.count
        let albumIds = albumMemberIds()
        let now = Date()
        let storage = ScanStorage(count: n)

        // Capture only the worker dependencies. This avoids capturing self through
        // every property access and, importantly, avoids inout-array captures.
        let screenshotClassifier = self.screenshotClassifier
        let livePhotoDetector = self.livePhotoDetector
        let blurDetector = self.blurDetector
        let clutterDetector = self.clutterDetector

        let progressLock = NSLock()
        var done = 0
        let step = max(1, n / 200)

        // MARK: Parallel analysis pass

        parallelFor(n) { i in
            autoreleasepool {
                let asset = assets[i]

                let meta = ScanProfiler.shared.measure(.metadata) {
                    AssetMetadata.read(asset)
                }

                let inAlbum = albumIds.contains(asset.localIdentifier)

                // These are metadata-only and calculated exactly once per asset.
                let isScreenshot = ScanProfiler.shared.measure(.screenshot) {
                    screenshotClassifier.isScreenshot(asset)
                }

                let isLive = ScanProfiler.shared.measure(.livePhoto) {
                    livePhotoDetector.isLivePhoto(asset)
                }

                // Exactly one thumbnail request per asset.
                let thumbnail = ScanProfiler.shared.measure(.thumbnail) {
                    ThumbnailLoader.load(asset)
                }

                let info = LazyImageInfo(
                    image: thumbnail?.0,
                    orientation: thumbnail?.1 ?? .up
                )

                var scan = AssetScan()
                scan.isScreenshot = isScreenshot
                scan.isLivePhoto = isLive

                // ---------------------------------------------------------
                // Pixel analysis + blur + clutter
                // ---------------------------------------------------------

                if let cg = thumbnail?.0,
                   let features = ScanProfiler.shared.measure(.pixelAnalysis, {
                       ImageAnalysis.analyze(cg)
                   }) {

                    scan.fingerprint = features.fingerprint
                    scan.sharpness = features.stats.sharpness

                    if !isScreenshot {
                        scan.blurry = ScanProfiler.shared.measure(.blur) {
                            blurDetector.isBlurry(stats: features.stats) {
                                info.quality
                            }
                        }

                        scan.clutter = clutterDetector.isClutter(
                            asset: asset,
                            meta: meta,
                            inAlbum: inAlbum,
                            now: now,
                            info: info,
                            stats: features.stats
                        )
                    }
                } else if !isScreenshot {
                    // Metadata-only fallback if the thumbnail could not be loaded.
                    scan.clutter = clutterDetector.isClutter(
                        asset: asset,
                        meta: meta,
                        inAlbum: inAlbum,
                        now: now,
                        info: info,
                        stats: nil
                    )
                }

                // ---------------------------------------------------------
                // Screenshot candidate: exactly ONCE
                // ---------------------------------------------------------

                if isScreenshot {
                    scan.screenshotCandidate = screenshotClassifier.isCandidate(
                        asset,
                        inAlbum: inAlbum,
                        now: now
                    ) {
                        info.quality
                    }
                }

                // ---------------------------------------------------------
                // Live Photo candidate
                // ---------------------------------------------------------

                if isLive {
                    scan.liveCandidate = livePhotoDetector.isCandidate(
                        asset: asset,
                        meta: meta,
                        inAlbum: inAlbum,
                        now: now,
                        info: info
                    )
                }

                storage.write(
                    index: i,
                    scan: scan,
                    size: meta.size
                )

                progressLock.lock()
                done += 1
                let currentDone = done
                progressLock.unlock()

                if currentDone % step == 0 || currentDone == n {
                    self.report(
                        Float(currentDone) / Float(max(n, 1)) * 0.92,
                        "Analyzing photos..."
                    )
                }
            }
        }

        let stored = storage.snapshot()
        let scans = stored.scans
        let sizes = stored.sizes

        // -------------------------------------------------------------
        // Duplicates (fingerprints already computed)
        // -------------------------------------------------------------

        report(0.93, "Grouping duplicates...", force: true)

        let duplicateGroups = ScanProfiler.shared.measure(.duplicates) {
            duplicateDetector.findDuplicateGroups(
                assets: assets,
                fingerprints: scans.map { $0.fingerprint },
                sizes: sizes,
                sharpness: scans.map { $0.sharpness }
            )
        }

        // -------------------------------------------------------------
        // Collect results
        // -------------------------------------------------------------

        var screenshotIds = [String]()
        var candidateScreenshotIds = [String]()
        var livePhotoIds = [String]()
        var candidateLiveIds = [String]()
        var blurry = [String]()
        var clutter = [String]()

        var sizeById = [String: Int64](minimumCapacity: n)

        for i in 0..<n {
            let asset = assets[i]
            let id = asset.localIdentifier
            sizeById[id] = sizes[i]

            if scans[i].isScreenshot {
                screenshotIds.append(id)
                if scans[i].screenshotCandidate {
                    candidateScreenshotIds.append(id)
                }
            }

            if scans[i].isLivePhoto {
                livePhotoIds.append(id)
                if scans[i].liveCandidate {
                    candidateLiveIds.append(id)
                }
            }

            if scans[i].blurry {
                blurry.append(id)
            }

            if scans[i].clutter {
                clutter.append(id)
            }
        }

        report(0.97, "Finishing...", force: true)

        let duplicateIds = duplicateGroups.flatMap {
            $0.duplicateAssets.map { $0.localIdentifier }
        }

        let deduped = deduplicateCandidates(
            duplicateIds: duplicateIds,
            screenshotCandidates: candidateScreenshotIds,
            livePhotoCandidates: candidateLiveIds,
            blurry: blurry,
            clutter: clutter
        )

        func sum(_ ids: [String]) -> Int64 {
            ids.reduce(0) { $0 + (sizeById[$1] ?? 0) }
        }

        let categorySavings: [String: Int64] = [
            "screenshots": sum(deduped.screenshotCandidates),
            "duplicates": sum(duplicateIds),
            "blurry": sum(deduped.blurry),
            "clutter": sum(deduped.clutter),
            "livePhotos": sum(deduped.livePhotoCandidates)
        ]

        var candidateSet = Set<String>()
        candidateSet.formUnion(deduped.screenshotCandidates)
        candidateSet.formUnion(deduped.blurry)
        candidateSet.formUnion(deduped.clutter)
        candidateSet.formUnion(deduped.livePhotoCandidates)
        candidateSet.formUnion(duplicateIds)

        let totalSavings = sum(Array(candidateSet))

        var allIds = Set<String>()
        allIds.formUnion(screenshotIds)
        allIds.formUnion(candidateScreenshotIds)
        allIds.formUnion(
            duplicateGroups.flatMap {
                [$0.bestAsset.localIdentifier] +
                $0.duplicateAssets.map { $0.localIdentifier }
            }
        )
        allIds.formUnion(clutter)
        allIds.formUnion(blurry)
        allIds.formUnion(livePhotoIds)
        allIds.formUnion(candidateLiveIds)

        var assetSizes = [String: Int64]()
        assetSizes.reserveCapacity(allIds.count)

        for id in allIds {
            if let size = sizeById[id], size > 0 {
                assetSizes[id] = size
            }
        }

        if ScanProfiler.shared.enabled {
            print("\n📊 PhotoAnalyzer profiler\n\(ScanProfiler.shared.report())\n")
        }

        report(1.0, "Done", force: true)

        return AnalysisResult(
            screenshots: screenshotIds,
            screenshotCandidates: deduped.screenshotCandidates,
            duplicateGroups: duplicateGroups,
            clutter: deduped.clutter,
            blurry: deduped.blurry,
            livePhotos: livePhotoIds,
            livePhotoCandidates: deduped.livePhotoCandidates,
            totalSavingsBytes: totalSavings,
            categorySavings: categorySavings,
            assetSizes: assetSizes
        )
    }

    // MARK: - Parallel worker pool

    private func parallelFor(
        _ n: Int,
        _ body: @escaping (Int) -> Void
    ) {
        guard n > 0 else { return }

        let cpuCount = ProcessInfo.processInfo.activeProcessorCount

        // Bounded concurrency prevents Photos/Core ML contention from destroying throughput.
        let workers = min(max(4, cpuCount), 8)

        let nextLock = NSLock()
        var next = 0

        DispatchQueue.concurrentPerform(iterations: workers) { _ in
            while true {
                nextLock.lock()
                let index = next
                next += 1
                nextLock.unlock()

                if index >= n {
                    break
                }

                autoreleasepool {
                    body(index)
                }
            }
        }
    }

    // MARK: - Albums

    private func albumMemberIds() -> Set<String> {
        var ids = Set<String>()

        let albums = PHAssetCollection.fetchAssetCollections(
            with: .album,
            subtype: .any,
            options: nil
        )

        albums.enumerateObjects { collection, _, _ in
            let members = PHAsset.fetchAssets(
                in: collection,
                options: nil
            )

            members.enumerateObjects { asset, _, _ in
                ids.insert(asset.localIdentifier)
            }
        }

        return ids
    }

    // MARK: - Progress

    private func report(
        _ p: Float,
        _ category: String,
        force: Bool = false
    ) {
        stateLock.lock()

        let shouldReport =
            force ||
            category != lastCategory ||
            abs(p - lastReported) >= 0.005

        if shouldReport {
            lastReported = p
            lastCategory = category
        }

        stateLock.unlock()

        guard shouldReport else { return }

        DispatchQueue.main.async {
            self.progress = p
            self.category = category
        }
    }

    // MARK: - Deduplication across categories

    private func deduplicateCandidates(
        duplicateIds: [String],
        screenshotCandidates: [String],
        livePhotoCandidates: [String],
        blurry: [String],
        clutter: [String]
    ) -> (
        screenshotCandidates: [String],
        livePhotoCandidates: [String],
        blurry: [String],
        clutter: [String]
    ) {
        var used = Set<String>(duplicateIds)

        let screenshots = screenshotCandidates.filter { !used.contains($0) }
        used.formUnion(screenshots)

        let live = livePhotoCandidates.filter { !used.contains($0) }
        used.formUnion(live)

        let blur = blurry.filter { !used.contains($0) }
        used.formUnion(blur)

        let cleanClutter = clutter.filter { !used.contains($0) }

        return (
            screenshots,
            live,
            blur,
            cleanClutter
        )
    }
}
