<!-- import Photos
import UIKit

class DuplicateDetector {
    private let similarityThreshold = 10   // Hamming distance threshold (0‑64)

    func findDuplicates(assets: [PHAsset], progressHandler: @escaping (Float) -> Void) -> [[PHAsset]] {
        var fingerprints: [(PHAsset, Data?)] = []
        let total = Float(assets.count)

        // 1. Generate perceptual hashes (CPU only)
        for (idx, asset) in assets.enumerated() {
            let fp = generateFingerprint(for: asset)
            fingerprints.append((asset, fp))
            progressHandler(Float(idx + 1) / total * 0.5)
        }

        // 2. Cluster by Hamming distance
        var clusters: [[PHAsset]] = []
        var used = Set<String>()
        let totalClusters = Float(assets.count)

        for (i, (asset1, fp1)) in fingerprints.enumerated() {
            progressHandler(0.5 + 0.5 * (Float(i) / totalClusters))

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
                clusters.append(cluster)
            }
            used.insert(asset1.localIdentifier)
        }

        return clusters
    }

    // MARK: - Perceptual Hash (Average Hash, 8x8 → 64 bits)
    private func generateFingerprint(for asset: PHAsset) -> Data? {
        let options = PHImageRequestOptions()
        options.isSynchronous = true
        options.deliveryMode = .highQualityFormat
        options.resizeMode = .exact
        options.isNetworkAccessAllowed = true

        var hashData: Data?

        PHImageManager.default().requestImage(
            for: asset,
            targetSize: CGSize(width: 300, height: 300),  // enough for quality
            contentMode: .aspectFit,
            options: options
        ) { image, info in
            guard let cgImage = image?.cgImage else { return }
            hashData = self.averageHash(cgImage: cgImage)
        }

        return hashData
    }

    // MARK: - Average Hash (8x8 grayscale)
    private func averageHash(cgImage: CGImage) -> Data? {
        let size = 8
        let width = size
        let height = size

        // Create a grayscale bitmap context
        let colorSpace = CGColorSpaceCreateDeviceGray()
        let bytesPerPixel = 1
        let bytesPerRow = width * bytesPerPixel
        let bitsPerComponent = 8

        guard let context = CGContext(
            data: nil,
            width: width,
            height: height,
            bitsPerComponent: bitsPerComponent,
            bytesPerRow: bytesPerRow,
            space: colorSpace,
            bitmapInfo: CGImageAlphaInfo.none.rawValue
        ) else { return nil }

        // Draw the image scaled to 8x8
        let rect = CGRect(x: 0, y: 0, width: width, height: height)
        context.draw(cgImage, in: rect)

        // Get pixel data
        guard let data = context.data else { return nil }
        let pixels = data.bindMemory(to: UInt8.self, capacity: width * height)

        // Compute average brightness
        var total: UInt = 0
        for i in 0 ..< (width * height) {
            total += UInt(pixels[i])
        }
        let avg = UInt8(total / UInt(width * height))

        // Generate 64-bit hash: bit = 1 if pixel > avg else 0
        var hash: UInt64 = 0
        for i in 0 ..< (width * height) {
            let bit = (pixels[i] > avg) ? 1 : 0
            hash = (hash << 1) | UInt64(bit)
        }

        // Convert to 8 bytes (big‑endian)
        var bigEndian = hash.bigEndian
        return Data(bytes: &bigEndian, count: MemoryLayout<UInt64>.size)
    }

    // MARK: - Hamming Distance
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
}
 -->