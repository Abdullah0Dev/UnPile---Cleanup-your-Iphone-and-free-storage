import CoreML
import Vision
import UIKit

struct ContentInfo {
    let topLabel: String?
    let isUnneededObject: Bool
}

/// Face detection via Apple's Vision (fast, no model file needed).
/// Replaces the old label-contains("person") check, which never matches ImageNet labels.
enum FaceDetector {
    static func containsFace(_ cg: CGImage, orientation: CGImagePropertyOrientation = .up) -> Bool {
        let request = VNDetectFaceRectanglesRequest()
        let handler = VNImageRequestHandler(cgImage: cg, orientation: orientation, options: [:])
        do { try handler.perform([request]) } catch { return false }
        let faces = (request.results as? [VNFaceObservation]) ?? []
        // ignore tiny background faces (<0.4% of the frame)
        return faces.contains { $0.boundingBox.width * $0.boundingBox.height >= 0.004 }
    }
}

final class ContentClassifier {
    static let modelName = "MobileNet"
    static let shared: ContentClassifier? = ContentClassifier()

    /// A label only counts if the model is at least this confident.
    var minConfidence: Float = 0.30

    private let model: VNCoreMLModel
    private let gate = DispatchSemaphore(value: 3)

    /// ImageNet-style synonyms. Matched as WHOLE phrases (the old substring match
    /// made "id" hit "bridge", "bird", etc.).
    private static let unneededPhrases: Set<String> = [
        "laptop", "laptop computer", "notebook", "notebook computer",
        "monitor", "screen", "crt screen", "desktop computer", "television", "television receiver",
        "whiteboard", "chalkboard", "blackboard",
        "document", "paper", "receipt", "invoice", "envelope", "binder", "book jacket", "menu",
        "id", "passport", "driver license", "card", "business card",
        "keyboard", "computer keyboard", "mouse", "computer mouse", "printer", "web site",
        "desk", "office", "book", "magazine", "comic book"
    ]

    init?() {
        guard let m = MLModelLoader.loadVisionModel(named: ContentClassifier.modelName) else { return nil }
        model = m
    }

    func classify(_ cg: CGImage, orientation: CGImagePropertyOrientation = .up) -> ContentInfo? {
        gate.wait()
        defer { gate.signal() }

        let request = VNCoreMLRequest(model: model)
        request.imageCropAndScaleOption = .scaleFill
        let handler = VNImageRequestHandler(cgImage: cg, orientation: orientation, options: [:])
        do { try handler.perform([request]) } catch { return nil }

        guard let obs = request.results as? [VNClassificationObservation], let top = obs.first else { return nil }

        let unneeded = obs.prefix(3).contains { o in
            o.confidence >= minConfidence && ContentClassifier.matchesUnneeded(o.identifier)
        }
        return ContentInfo(topLabel: top.identifier, isUnneededObject: unneeded)
    }

    private static func matchesUnneeded(_ label: String) -> Bool {
        label.lowercased()
            .replacingOccurrences(of: "_", with: " ")
            .split(separator: ",")
            .contains { unneededPhrases.contains($0.trimmingCharacters(in: .whitespaces)) }
    }
}
