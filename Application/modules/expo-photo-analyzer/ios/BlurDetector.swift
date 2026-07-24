import CoreImage
import Photos

class BlurDetector {
  func findBlurry(assets: [PHAsset], progressHandler: @escaping (Float) -> Void) -> [String] {
    var blurryIds: [String] = []
    let total = Float(assets.count)
    for (index, asset) in assets.enumerated() {
      if isBlurry(asset: asset) {
        blurryIds.append(asset.localIdentifier)
      }
      if index % 10 == 0 {
        progressHandler(Float(index) / total)
      }
    }
    return blurryIds
  }

  private func isBlurry(asset: PHAsset) -> Bool {
    let options = PHImageRequestOptions()
    options.isSynchronous = true
    options.deliveryMode = .fastFormat
    var isBlurry = false
    PHImageManager.default().requestImage(
      for: asset,
      targetSize: CGSize(width: 300, height: 300),
      contentMode: .aspectFit,
      options: options
    ) { image, _ in
      guard let cgImage = image?.cgImage else { return }
      let ciImage = CIImage(cgImage: cgImage)
      let laplacianFilter = CIFilter(name: "CILaplacian")!
      laplacianFilter.setValue(ciImage, forKey: kCIInputImageKey)
      guard let output = laplacianFilter.outputImage else { return }
      let context = CIContext()
      var bitmap = [UInt8](repeating: 0, count: 4)
      context.render(output, toBitmap: &bitmap, rowBytes: 4, bounds: CGRect(x: 0, y: 0, width: 1, height: 1), format: .RGBA8, colorSpace: nil)
      // Variance approximation: use mean of absolute values of first pixel channels
      let variance = abs(Double(bitmap[0]) - 128.0) + abs(Double(bitmap[1]) - 128.0) + abs(Double(bitmap[2]) - 128.0)
      isBlurry = variance < 50  // threshold
    }
    return isBlurry
  }
}