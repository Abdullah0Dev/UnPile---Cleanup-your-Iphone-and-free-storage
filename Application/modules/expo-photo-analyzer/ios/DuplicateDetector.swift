import Vision
import Photos

class DuplicateDetector {
  func findDuplicates(assets: [PHAsset], progressHandler: @escaping (Float) -> Void) -> [[PHAsset]] {
    // 1. Generate fingerprints
    var fingerprints: [(PHAsset, Data?)] = []
    let group = DispatchGroup()
    let queue = DispatchQueue(label: "fingerprintQueue", attributes: .concurrent)

    for asset in assets {
      queue.async(group: group) {
        let fingerprint = self.generateFingerprint(for: asset)
        fingerprints.append((asset, fingerprint))
      }
    }
    group.wait()

    // 2. Cluster by Hamming distance (simple threshold)
    var clusters: [[PHAsset]] = []
    var used = Set<String>()

    for (i, (asset1, fp1)) in fingerprints.enumerated() {
      if used.contains(asset1.localIdentifier) { continue }
      guard let fp1 = fp1 else { continue }
      var cluster = [asset1]

      for (j, (asset2, fp2)) in fingerprints.enumerated() where j > i {
        if used.contains(asset2.localIdentifier) { continue }
        if let fp2 = fp2 {
          let distance = self.hammingDistance(fp1, fp2)
          if distance < 10 {  // threshold
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

  private func generateFingerprint(for asset: PHAsset) -> Data? {
    let options = PHImageRequestOptions()
    options.isSynchronous = true
    options.deliveryMode = .fastFormat
    var fingerprint: Data?
    PHImageManager.default().requestImage(
      for: asset,
      targetSize: CGSize(width: 300, height: 300),
      contentMode: .aspectFit,
      options: options
    ) { image, _ in
      guard let cgImage = image?.cgImage else { return }
      let request = VNGenerateImageFeaturePrintRequest()
      let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
      try? handler.perform([request])
      fingerprint = request.results?.first?.featurePrint?.data()
    }
    return fingerprint
  }

  private func hammingDistance(_ data1: Data, _ data2: Data) -> Int {
    var distance = 0
    for (b1, b2) in zip(data1, data2) {
      var xor = b1 ^ b2
      while xor != 0 {
        distance += Int(xor & 1)
        xor >>= 1
      }
    }
    return distance
  }
}