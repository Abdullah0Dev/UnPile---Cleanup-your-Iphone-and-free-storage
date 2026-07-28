import Photos
import UIKit

class DuplicateDetector {
    // Hamming distance threshold for 256‑bit hashes (16×16)
    private let similarityThreshold = 15

    func findDuplicateGroups(
        assets: [PHAsset],
        progressHandler: @escaping (Float) -> Void
    ) -> [DuplicateGroup] {
        var fingerprints: [(PHAsset, Data?)] = []
        let total = Float(assets.count)

        // 1. Generate fingerprints (progress 0…0.5)
        for (idx, asset) in assets.enumerated() {
            let fp = generateFingerprint(for: asset)
            fingerprints.append((asset, fp))
            progressHandler(Float(idx + 1) / total * 0.5)
        }

        // 2. Cluster by Hamming distance (progress 0.5…0.9)
        var rawClusters: [[PHAsset]] = []
        var used = Set<String>()
        let totalClusters = Float(assets.count)

        for (i, (asset1, fp1)) in fingerprints.enumerated() {
            progressHandler(0.5 + 0.4 * (Float(i) / totalClusters))

            if used.contains(asset1.localIdentifier) { continue }
            guard let fp1 = fp1 else { continue }

            var cluster = [asset1]
            for (j, (asset2, fp2)) in fingerprints.enumerated() where j > i {
                if used.contains(asset2.localIdentifier) { continue }
                if let fp2 = fp2 {
                    let distance = hammingDistance(fp1, fp2)
                    if distance < similarityThreshold {
                        cluster.append(asset2)
                        used.insert(asset2.localIdentifier)
                    }
                }
            }
            if cluster.count > 1 {
                rawClusters.append(cluster)
            }
            used.insert(asset1.localIdentifier)
        }

        // 3. For each cluster, pick the best asset and build DuplicateGroup
        progressHandler(0.9)   // fixed: only Float argument
        let groups = rawClusters.map { cluster -> DuplicateGroup in
            let sorted = cluster.sorted { asset1, asset2 in
                qualityScore(for: asset1) > qualityScore(for: asset2)
            }
            let best = sorted.first!
            let duplicates = Array(sorted.dropFirst())
            return DuplicateGroup(bestAsset: best, duplicateAssets: duplicates)
        }

        progressHandler(1.0)
        return groups
    }

    // MARK: - Fingerprint Generation (16×16 average hash)
    private func generateFingerprint(for asset: PHAsset) -> Data? {
        let options = PHImageRequestOptions()
        options.isSynchronous = true
        options.deliveryMode = .highQualityFormat
        options.resizeMode = .exact
        options.isNetworkAccessAllowed = true

        var hashData: Data?

        PHImageManager.default().requestImage(
            for: asset,
            targetSize: CGSize(width: 300, height: 300),
            contentMode: .aspectFit,
            options: options
        ) { image, info in
            guard let cgImage = image?.cgImage else { return }
            hashData = self.averageHash16x16(cgImage: cgImage)
        }

        return hashData
    }

    // 16×16 average hash → 256 bits → 32 bytes
    private func averageHash16x16(cgImage: CGImage) -> Data? {
        let size = 16
        let width = size
        let height = size
        let bytesPerPixel = 1
        let bytesPerRow = width * bytesPerPixel
        let bitsPerComponent = 8

        guard let context = CGContext(
            data: nil,
            width: width,
            height: height,
            bitsPerComponent: bitsPerComponent,
            bytesPerRow: bytesPerRow,
            space: CGColorSpaceCreateDeviceGray(),
            bitmapInfo: CGImageAlphaInfo.none.rawValue
        ) else { return nil }

        context.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))

        guard let data = context.data else { return nil }
        let pixels = data.bindMemory(to: UInt8.self, capacity: width * height)

        // Compute average
        var total: UInt = 0
        for i in 0 ..< (width * height) {
            total += UInt(pixels[i])
        }
        let avg = UInt8(total / UInt(width * height))

        // Build a 256‑bit integer (as 32 bytes)
        var hashBytes = [UInt8](repeating: 0, count: 32) // 256 bits
        for i in 0 ..< (width * height) {
            let byteIndex = i / 8
            let bitIndex = i % 8
            if pixels[i] > avg {
                hashBytes[byteIndex] |= (1 << bitIndex)
            }
        }
        return Data(hashBytes)
    }

    // MARK: - Hamming Distance (for 32‑byte data)
    private func hammingDistance(_ data1: Data, _ data2: Data) -> Int {
        guard data1.count == data2.count else { return Int.max }
        var distance = 0
        let bytes1 = [UInt8](data1)
        let bytes2 = [UInt8](data2)
        for i in 0 ..< bytes1.count {
            var xor = bytes1[i] ^ bytes2[i]
            while xor != 0 {
                distance += Int(xor & 1)
                xor >>= 1
            }
        }
        return distance
    }

    // MARK: - Quality Scoring
    private func qualityScore(for asset: PHAsset) -> Int {
        // Prefer higher resolution
        let pixelCount = asset.pixelWidth * asset.pixelHeight

        // Try to get file size via PHAssetResource
        var fileSize: Int64 = 0
        if let resource = PHAssetResource.assetResources(for: asset).first,
           let size = resource.value(forKey: "fileSize") as? Int64 {
            fileSize = size
        }

        // Combine: give more weight to pixel count (primary), file size as tie‑breaker
        return pixelCount * 1000 + Int(fileSize)
    }
}
