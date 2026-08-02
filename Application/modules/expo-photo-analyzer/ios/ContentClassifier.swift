import CoreML
import Vision
import UIKit

class ContentClassifier {

    static let modelName = "MobileNet"  // Your model file name (without extension)

    private let model: VNCoreMLModel
    private let inputSize = CGSize(width: 224, height: 224)

    init?() {
        guard let resourceBundleURL = Bundle.main.url(forResource: "ExpoPhotoAnalyzerResources", withExtension: "bundle"),
              let resourceBundle = Bundle(url: resourceBundleURL),
              let modelURL = resourceBundle.url(forResource: ContentClassifier.modelName, withExtension: "mlmodelc") else {
            print("❌ Content model not found in resource bundle")
            return nil
        }

        do {
            let coreMLModel = try MLModel(contentsOf: modelURL)
            let visionModel = try VNCoreMLModel(for: coreMLModel)
            self.model = visionModel
        } catch {
            print("❌ Failed to load content model: \(error)")
            return nil
        }
    }

    /// Classifies the image and returns the top label (e.g., "laptop", "desk", "person")
    func classify(_ image: UIImage, completion: @escaping (String?) -> Void) {
        guard let cgImage = image.cgImage else {
            print("❌ classify: No CGImage")
            completion(nil)
            return
        }

        let request = VNCoreMLRequest(model: model) { request, error in
            if let error = error {
                print("❌ classify error: \(error)")
                completion(nil)
                return
            }
            guard let observations = request.results as? [VNClassificationObservation] else {
                print("❌ No observations")
                completion(nil)
                return
            }
            if let top = observations.first {
                print("📸 Content label: \(top.identifier) (confidence: \(top.confidence))")
                completion(top.identifier)
            } else {
                print("❌ No top observation")
                completion(nil)
            }
        }

        guard let resized = resizeImage(cgImage, to: inputSize) else {
            print("❌ Failed to resize image")
            completion(nil)
            return
        }

        let handler = VNImageRequestHandler(cgImage: resized, options: [:])
        do {
            try handler.perform([request])
            print("✅ classify request performed")
        } catch {
            print("❌ classify perform error: \(error)")
            completion(nil)
        }
    }
    private func resizeImage(_ cgImage: CGImage, to size: CGSize) -> CGImage? {
        let width = Int(size.width)
        let height = Int(size.height)
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        let bitmapInfo = CGImageAlphaInfo.premultipliedLast.rawValue

        guard let context = CGContext(
            data: nil,
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: 0,
            space: colorSpace,
            bitmapInfo: bitmapInfo
        ) else { return nil }

        context.interpolationQuality = .high
        context.draw(cgImage, in: CGRect(origin: .zero, size: size))
        return context.makeImage()
    }
}
