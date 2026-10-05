import Photos

final class DuplicateDetector {
    var dHashThreshold = 14
    var aHashThreshold = 22
    var bucketCap = 120
    var timeWindow = 25
    var aspectTolerance: Float = 0.02

    func findDuplicateGroups(
        assets: [PHAsset],
        fingerprints fps: [Fingerprint?],
        sizes: [Int64],
        sharpness: [Float]
    ) -> [DuplicateGroup] {
        let n = assets.count
        guard n > 1 else { return [] }

        var buckets = [[UInt16: [Int32]]](repeating: [:], count: 16)

        for i in 0..<n {
            guard let f = fps[i] else { continue }

            for c in 0..<16 {
                buckets[c][f.chunk(c), default: []].append(Int32(i))
            }
        }

        let aspect: [Float] = assets.map {
            let width = Float(max($0.pixelWidth, 1))
            let height = Float(max($0.pixelHeight, 1))
            return max(width, height) / min(width, height)
        }

        let isShot: [Bool] = assets.map {
            $0.mediaSubtypes.contains(.photoScreenshot)
        }

        var used = [Bool](repeating: false, count: n)
        var seen = [Int](repeating: -1, count: n)
        var clusters = [[Int]]()

        for i in 0..<n {
            guard !used[i], let f1 = fps[i] else { continue }

            var candidates = [Int]()
            candidates.reserveCapacity(32)

            for c in 0..<16 {
                guard
                    let bucket = buckets[c][f1.chunk(c)],
                    bucket.count <= bucketCap
                else {
                    continue
                }

                for j32 in bucket {
                    let j = Int(j32)
                    if j > i && seen[j] != i {
                        seen[j] = i
                        candidates.append(j)
                    }
                }
            }

            let end = min(n, i + 1 + timeWindow)
            if i + 1 < end {
                for j in (i + 1)..<end where seen[j] != i {
                    seen[j] = i
                    candidates.append(j)
                }
            }

            candidates.sort()

            var cluster = [i]

            for j in candidates where !used[j] {
                guard let f2 = fps[j] else { continue }

                let relativeAspectDifference =
                    abs(aspect[i] - aspect[j]) /
                    max(aspect[i], aspect[j])

                if relativeAspectDifference > aspectTolerance {
                    continue
                }

                let strict = isShot[i] || isShot[j]
                let dThreshold = strict ? dHashThreshold / 2 : dHashThreshold
                let aThreshold = strict ? aHashThreshold / 2 : aHashThreshold

                if f1.dDistance(to: f2) <= dThreshold &&
                   f1.aDistance(to: f2) <= aThreshold {
                    cluster.append(j)
                    used[j] = true
                }
            }

            used[i] = true

            if cluster.count > 1 {
                clusters.append(cluster)
            }
        }

        return clusters.map { indexes in
            let ranked = indexes.sorted { a, b in
                let favoriteA = assets[a].isFavorite
                let favoriteB = assets[b].isFavorite

                if favoriteA != favoriteB {
                    return favoriteA
                }

                // Keep the sharpest copy when favorites don't decide it.
                let sharpA = a < sharpness.count ? sharpness[a] : 0
                let sharpB = b < sharpness.count ? sharpness[b] : 0

                if sharpA != sharpB {
                    return sharpA > sharpB
                }

                let pixelsA = assets[a].pixelWidth * assets[a].pixelHeight
                let pixelsB = assets[b].pixelWidth * assets[b].pixelHeight

                if pixelsA != pixelsB {
                    return pixelsA > pixelsB
                }

                if sizes[a] != sizes[b] {
                    return sizes[a] > sizes[b]
                }

                return a < b
            }

            return DuplicateGroup(
                bestAsset: assets[ranked[0]],
                duplicateAssets: ranked.dropFirst().map { assets[$0] }
            )
        }
    }
}
