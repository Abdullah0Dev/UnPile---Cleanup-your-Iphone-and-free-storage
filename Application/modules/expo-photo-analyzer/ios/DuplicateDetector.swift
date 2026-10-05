import Photos

/// Clusters near-duplicates from precomputed fingerprints (no image loading here).
/// Uses multi-index hashing: the 256-bit dHash is split into 16 chunks of 16 bits.
/// If two hashes differ by <16 bits, at least one chunk matches exactly (pigeonhole),
/// so we find ALL close pairs anywhere in the library without O(n²) comparisons.
final class DuplicateDetector {
    var dHashThreshold = 14      // max differing bits out of 256 (dHash)
    var aHashThreshold = 22      // second hash must also agree (kills false positives)
    var bucketCap = 120          // skip over-full buckets (flat/common patterns)
    var timeWindow = 25          // also always compare with the next N photos by date
    var aspectTolerance: Float = 0.02

    func findDuplicateGroups(assets: [PHAsset], fingerprints fps: [Fingerprint?], sizes: [Int64]) -> [DuplicateGroup] {
        let n = assets.count
        guard n > 1 else { return [] }

        var buckets = [[UInt16: [Int32]]](repeating: [:], count: 16)
        for i in 0..<n {
            guard let f = fps[i] else { continue }
            for c in 0..<16 { buckets[c][f.chunk(c), default: []].append(Int32(i)) }
        }

        let aspect: [Float] = assets.map {
            let w = Float(max($0.pixelWidth, 1)), h = Float(max($0.pixelHeight, 1))
            return max(w, h) / min(w, h)
        }
        let isShot: [Bool] = assets.map { $0.mediaSubtypes.contains(.photoScreenshot) }

        var used = [Bool](repeating: false, count: n)
        var seen = [Int](repeating: -1, count: n)
        var clusters: [[Int]] = []

        for i in 0..<n {
            guard !used[i], let f1 = fps[i] else { continue }

            var cand = [Int]()
            for c in 0..<16 {
                if let b = buckets[c][f1.chunk(c)], b.count <= bucketCap {
                    for j32 in b {
                        let j = Int(j32)
                        if j > i, seen[j] != i { seen[j] = i; cand.append(j) }
                    }
                }
            }
            let end = min(n, i + 1 + timeWindow)
            if i + 1 < end {
                for j in (i + 1)..<end where seen[j] != i { seen[j] = i; cand.append(j) }
            }
            cand.sort()

            var cluster = [i]
            for j in cand where !used[j] {
                guard let f2 = fps[j] else { continue }
                if abs(aspect[i] - aspect[j]) > aspectTolerance * max(aspect[i], aspect[j]) { continue }
                // Screenshots look alike (same UI chrome) so require much tighter matches.
                let strict = isShot[i] || isShot[j]
                let dT = strict ? dHashThreshold / 2 : dHashThreshold
                let aT = strict ? aHashThreshold / 2 : aHashThreshold
                if f1.dDistance(to: f2) <= dT && f1.aDistance(to: f2) <= aT {
                    cluster.append(j)
                    used[j] = true
                }
            }
            used[i] = true
            if cluster.count > 1 { clusters.append(cluster) }
        }

        return clusters.map { idxs in
            // Best = favorite first, then resolution, then file size.
            let ranked = idxs.sorted { a, b in
                let fa = assets[a].isFavorite, fb = assets[b].isFavorite
                if fa != fb { return fa }
                let pa = assets[a].pixelWidth * assets[a].pixelHeight
                let pb = assets[b].pixelWidth * assets[b].pixelHeight
                if pa != pb { return pa > pb }
                if sizes[a] != sizes[b] { return sizes[a] > sizes[b] }
                return a < b
            }
            return DuplicateGroup(bestAsset: assets[ranked[0]],
                                  duplicateAssets: ranked.dropFirst().map { assets[$0] })
        }
    }
}
