import Photos
import Combine
import Foundation

// MARK: - Data Models (unchanged)

public struct DuplicateGroup {
    public let bestAsset: PHAsset
    public let duplicateAssets: [PHAsset]
    public var allAssets: [PHAsset] { [bestAsset] + duplicateAssets }
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
    var blurry = false
    var clutter = false //ImageAnalysis
    var screenshotCandidate = false
    var liveCandidate = false
}

// MARK: - PhotoAnalyzer

public class PhotoAnalyzer: ObservableObject {
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

    // MARK: Public API

    public func startAnalysis() {
        analyzePhotos { _ in }
    }

    public func analyzePhotos(completion: @escaping (AnalysisResult) -> Void) {
        stateLock.lock()
        if running { stateLock.unlock(); return }
        running = true
        stateLock.unlock()

        DispatchQueue.main.async {
            self.isScanning = true
            self.progress = 0
        }

        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self = self else { return }
            let analysis = self.performScan()

            DispatchQueue.main.async {
                self.result = analysis
                self.isScanning = false
                self.stateLock.lock(); self.running = false; self.stateLock.unlock()
                completion(analysis)
            }
        }
    }

    // MARK: Scan

    private func performScan() -> AnalysisResult {
        report(0, "Preparing...", force: true)

        // Warm up models once, before workers start (first load compiles for the ANE).
        _ = QualityAnalyzer.shared
        _ = ContentClassifier.shared

        let fetch = PHFetchOptions()
        fetch.sortDescriptors = [NSSortDescriptor(key: "creationDate", ascending: false)]
        let fetched = PHAsset.fetchAssets(with: .image, options: fetch)
        var assets = [PHAsset]()
        assets.reserveCapacity(fetched.count)
        fetched.enumerateObjects { a, _, _ in assets.append(a) }
        let n = assets.count

        let albumIds = albumMemberIds()      // ONE pass instead of one query per photo
        let now = Date()

        var scans = [AssetScan](repeating: AssetScan(), count: n)
        var sizes = [Int64](repeating: 0, count: n)

        // ---- Single parallel pass: load each photo once, run every analyzer on it ----
        let progressLock = NSLock()
        var done = 0
        let step = max(1, n / 200)

        scans.withUnsafeMutableBufferPointer { sp in
            sizes.withUnsafeMutableBufferPointer { zp in
                parallelFor(n) { i in
                    let asset = assets[i]
                    let meta = AssetMetadata.read(asset)
                    zp[i] = meta.size

                    let isShot = screenshotClassifier.isScreenshot(asset)
                    let inAlbum = albumIds.contains(asset.localIdentifier)

                    let thumb = ThumbnailLoader.load(asset)
                    let info = LazyImageInfo(image: thumb?.0, orientation: thumb?.1 ?? .up)

                    var scan = AssetScan()
                    if let cg = thumb?.0, let feats = ImageAnalysis.analyze(cg) {
                        scan.fingerprint = feats.fingerprint
                        if !isShot {
                            scan.blurry = blurDetector.isBlurry(stats: feats.stats) { info.quality }
                        }
                    }

                    if isShot {
                        scan.screenshotCandidate = screenshotClassifier.isCandidate(
                            asset, inAlbum: inAlbum, now: now) { info.quality }
                    } else {
                        scan.clutter = clutterDetector.isClutter(
                            asset: asset, meta: meta, inAlbum: inAlbum, now: now, info: info)
                    }

                    if livePhotoDetector.isLivePhoto(asset) {
                        scan.liveCandidate = livePhotoDetector.isCandidate(
                            asset: asset, meta: meta, inAlbum: inAlbum, now: now, info: info)
                    }

                    sp[i] = scan

                    progressLock.lock(); done += 1; let d = done; progressLock.unlock()
                    if d % step == 0 || d == n {
                        self.report(Float(d) / Float(max(n, 1)) * 0.92, "Analyzing photos...")
                    }
                }
            }
        }

        // ---- Duplicates (fingerprints already computed; this takes milliseconds) ----
        report(0.93, "Grouping duplicates...", force: true)
        let duplicateGroups = duplicateDetector.findDuplicateGroups(
            assets: assets, fingerprints: scans.map { $0.fingerprint }, sizes: sizes)

        // ---- Collect id lists (same order as before: newest first) ----
        var screenshotIds = [String](), candidateScreenshotIds = [String]()
        var livePhotoIds = [String](), candidateLiveIds = [String]()
        var blurry = [String](), clutter = [String]()
        var sizeById = [String: Int64](minimumCapacity: n)

        for i in 0..<n {
            let id = assets[i].localIdentifier
            sizeById[id] = sizes[i]
            if screenshotClassifier.isScreenshot(assets[i]) {
                screenshotIds.append(id)
                if scans[i].screenshotCandidate { candidateScreenshotIds.append(id) }
            }
            if livePhotoDetector.isLivePhoto(assets[i]) {
                livePhotoIds.append(id)
                if scans[i].liveCandidate { candidateLiveIds.append(id) }
            }
            if scans[i].blurry { blurry.append(id) }
            if scans[i].clutter { clutter.append(id) }
        }

        report(0.97, "Finishing...", force: true)

        // ---- Deduplicate across categories ----
        let duplicateIds = duplicateGroups.flatMap { $0.duplicateAssets.map { $0.localIdentifier } }
        let deduped = deduplicateCandidates(
            duplicateIds: duplicateIds,
            screenshotCandidates: candidateScreenshotIds,
            livePhotoCandidates: candidateLiveIds,
            blurry: blurry,
            clutter: clutter)

        // ---- Savings from the size map we already have ----
        func sum(_ ids: [String]) -> Int64 { ids.reduce(0) { $0 + (sizeById[$1] ?? 0) } }

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
        allIds.formUnion(duplicateGroups.flatMap { [$0.bestAsset.localIdentifier] + $0.duplicateAssets.map { $0.localIdentifier } })
        allIds.formUnion(clutter)
        allIds.formUnion(blurry)
        allIds.formUnion(livePhotoIds)
        allIds.formUnion(candidateLiveIds)

        var assetSizes = [String: Int64]()
        for id in allIds {
            if let s = sizeById[id], s > 0 { assetSizes[id] = s }
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
            assetSizes: assetSizes)
    }

    // MARK: Helpers

    /// Persistent worker pool: 2–6 threads pulling the next index.
    private func parallelFor(_ n: Int, _ body: (Int) -> Void) {
        guard n > 0 else { return }
        let workers = min(max(2, ProcessInfo.processInfo.activeProcessorCount), 6)
        let lock = NSLock()
        var next = 0
        DispatchQueue.concurrentPerform(iterations: workers) { _ in
            while true {
                lock.lock(); let i = next; next += 1; lock.unlock()
                if i >= n { break }
                autoreleasepool { body(i) }
            }
        }
    }

    /// All asset ids that live in at least one album (same meaning as the old per-asset query).
    private func albumMemberIds() -> Set<String> {
        var ids = Set<String>()
        let albums = PHAssetCollection.fetchAssetCollections(with: .album, subtype: .any, options: nil)
        albums.enumerateObjects { collection, _, _ in
            let members = PHAsset.fetchAssets(in: collection, options: nil)
            members.enumerateObjects { a, _, _ in ids.insert(a.localIdentifier) }
        }
        return ids
    }

    private func report(_ p: Float, _ cat: String, force: Bool = false) {
        stateLock.lock()
        let should = force || cat != lastCategory || abs(p - lastReported) >= 0.005
        if should { lastReported = p; lastCategory = cat }
        stateLock.unlock()
        guard should else { return }
        DispatchQueue.main.async {
            self.progress = p
            self.category = cat
        }
    }

    private func deduplicateCandidates(
        duplicateIds: [String],
        screenshotCandidates: [String],
        livePhotoCandidates: [String],
        blurry: [String],
        clutter: [String]
    ) -> (screenshotCandidates: [String], livePhotoCandidates: [String], blurry: [String], clutter: [String]) {
        var used = Set<String>(duplicateIds)
        let s = screenshotCandidates.filter { !used.contains($0) }; used.formUnion(s)
        let l = livePhotoCandidates.filter { !used.contains($0) }; used.formUnion(l)
        let b = blurry.filter { !used.contains($0) }; used.formUnion(b)
        let c = clutter.filter { !used.contains($0) }
        return (s, l, b, c)
    }
}
