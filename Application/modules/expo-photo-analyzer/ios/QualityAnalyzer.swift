import CoreML
import Vision
import UIKit

final class QualityAnalyzer {
    static let modelName = "NIMANasnet"
    static let shared: QualityAnalyzer? = QualityAnalyzer()

    private let model: VNCoreMLModel
    private let gate = DispatchSemaphore(value: 2)

    init?() {
        guard let model = MLModelLoader.loadVisionModel(named: Self.modelName) else {
            return nil
        }

        self.model = model
    }

    func score(
        for cgImage: CGImage,
        orientation: CGImagePropertyOrientation = .up
    ) -> Float? {
        ScanProfiler.shared.measure(.quality) {
            gate.wait()
            defer { gate.signal() }

            let request = VNCoreMLRequest(model: model)
            request.imageCropAndScaleOption = .scaleFill

            let handler = VNImageRequestHandler(
                cgImage: cgImage,
                orientation: orientation,
                options: [:]
            )

            do {
                try handler.perform([request])
            } catch {
                return nil
            }

            guard
                let observations = request.results as? [VNClassificationObservation],
                observations.count >= 2
            else {
                return nil
            }

            var weighted: Float = 0
            var total: Float = 0

            for observation in observations {
                guard let value = Float(observation.identifier) else {
                    continue
                }

                weighted += value * observation.confidence
                total += observation.confidence
            }

            guard total > 0 else { return nil }
            return weighted / total
        }
    }
}
