import CoreML
import Vision
import Photos

class ScreenshotAIClassifier {
  static let shared = ScreenshotAIClassifier()
  private var model: VNCoreMLModel?

  init() {
    guard let mlModel = try? ScreenshotClassifier(configuration: MLModelConfiguration()).model else { return }
    model = try? VNCoreMLModel(for: mlModel)
  }

  func isScreenshot(asset: PHAsset) -> Bool {
    guard let model = model else { return false }
    let request = VNCoreMLRequest(model: model)
    request.imageCropAndScaleOption = .centerCrop
    let handler: VNImageRequestHandler
    let options = PHImageRequestOptions()
    options.isSynchronous = true
    options.deliveryMode = .fastFormat
    var result = false

    PHImageManager.default().requestImage(
      for: asset,
      targetSize: CGSize(width: 299, height: 299),
      contentMode: .aspectFill,
      options: options
    ) { image, _ in
      guard let cgImage = image?.cgImage else { return }
      let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
      try? handler.perform([request])
      if let observations = request.results as? [VNClassificationObservation],
         let first = observations.first,
         first.identifier == "screenshot" && first.confidence > 0.8 {
        result = true
      }
    }
    return result
  }
}