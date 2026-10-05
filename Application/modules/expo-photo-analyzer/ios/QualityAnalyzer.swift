import CoreML
import Vision
import UIKit

/// NIMA quality scorer (1–10). Loaded ONCE and shared by every detector.
final class QualityAnalyzer {
    static let modelName = "NIMANasnet"
    static let shared: QualityAnalyzer? = QualityAnalyzer()

    private let model: VNCoreMLModel
    /// Limits concurrent inferences so threads don't pile up on the Neural Engine.
    private let gate = DispatchSemaphore(value: 3)

    init?() {
        guard let m = MLModelLoader.loadVisionModel(named: QualityAnalyzer.modelName) else { return nil }
        model = m
    }

    /// Synchronous. Returns the weighted mean score (1–10) or nil on failure.
    func score(for cgImage: CGImage, orientation: CGImagePropertyOrientation = .up) -> Float? {
        gate.wait()
        defer { gate.signal() }

        let request = VNCoreMLRequest(model: model)
        request.imageCropAndScaleOption = .scaleFill   // same as the old manual stretch-resize
        let handler = VNImageRequestHandler(cgImage: cgImage, orientation: orientation, options: [:])
        do { try handler.perform([request]) } catch { return nil }

        guard let obs = request.results as? [VNClassificationObservation], obs.count >= 2 else { return nil }
        var weighted: Float = 0
        var total: Float = 0
        for o in obs {
            if let s = Float(o.identifier) {
                weighted += s * o.confidence
                total += o.confidence
            }
        }
        return total > 0 ? weighted / total : nil
    }
}
