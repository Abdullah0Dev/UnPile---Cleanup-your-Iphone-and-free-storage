//
//  QualityAnalyzer.swift
//  UnpileTest
//
//  Created by Dev Minds on 7/26/26.
//

import CoreML
import Vision
import UIKit

class QualityAnalyzer {

    // Which model to use: "MobileNet" or "NIMANasnet"
    static let modelName = "NIMANasnet"  // or "NIMANasnet"

    private let model: VNCoreMLModel
    private let inputSize: CGSize

    init?() {
        guard let resourceBundleURL = Bundle.main.url(forResource: "ExpoPhotoAnalyzerResources", withExtension: "bundle"),
              let resourceBundle = Bundle(url: resourceBundleURL),
              let modelURL = resourceBundle.url(forResource: "NIMANasnet", withExtension: "mlmodelc") else {
            print("❌ Model not found in resource bundle")
            return nil
        }

        do {
            let coreMLModel = try MLModel(contentsOf: modelURL)
            let visionModel = try VNCoreMLModel(for: coreMLModel)
            self.model = visionModel

            switch QualityAnalyzer.modelName {
            case "MobileNet":
                self.inputSize = CGSize(width: 224, height: 224)
            case "NIMANasnet":
                self.inputSize = CGSize(width: 299, height: 299)
            default:
                self.inputSize = CGSize(width: 224, height: 224)
            }
        } catch {
            print("❌ Failed to load model: \(error)")
            return nil
        }
    }
    func assessQuality(for image: UIImage, completion: @escaping (Float?) -> Void) {
        guard let cgImage = image.cgImage else {
            completion(nil)
            return
        }

        let request = VNCoreMLRequest(model: model) { request, error in
            guard error == nil else {
                completion(nil)
                return
            }

            // The model outputs 10 classes (scores 1-10) as VNClassificationObservation.
            guard let observations = request.results as? [VNClassificationObservation],
                  observations.count == 10 else {
                completion(nil)
                return
            }

            // Compute weighted average
            var weightedSum: Float = 0
            var totalConfidence: Float = 0
            for obs in observations {
                if let score = Float(obs.identifier) {
                    weightedSum += score * obs.confidence
                    totalConfidence += obs.confidence
                }
            }
            let averageScore = weightedSum / totalConfidence
            completion(averageScore)
        }

        // Resize image to model's expected input size
        guard let resizedCGImage = resizeImage(cgImage, to: inputSize) else {
            completion(nil)
            return
        }

        let handler = VNImageRequestHandler(cgImage: resizedCGImage, options: [:])
        do {
            try handler.perform([request])
        } catch {
            completion(nil)
        }
    }

    // MARK: - Helper: resize image

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
