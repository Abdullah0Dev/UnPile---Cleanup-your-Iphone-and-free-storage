import CoreML
import Vision
import UIKit

struct ContentInfo {
    let topLabel: String?
    let isUnneededObject: Bool
    let isPersonLike: Bool
}

// MARK: - Face detection

enum FaceDetector {
    static func containsFace(
        _ cg: CGImage,
        orientation: CGImagePropertyOrientation = .up
    ) -> Bool {
        ScanProfiler.shared.measure(.face) {
            let request = VNDetectFaceRectanglesRequest()
            let handler = VNImageRequestHandler(
                cgImage: cg,
                orientation: orientation,
                options: [:]
            )

            do {
                try handler.perform([request])
            } catch {
                return false
            }

            let faces = (request.results as? [VNFaceObservation]) ?? []

            // Ignore tiny distant/background faces.
            return faces.contains {
                $0.boundingBox.width * $0.boundingBox.height >= 0.004
            }
        }
    }
}

// MARK: - MobileNet

final class ContentClassifier {
    static let modelName = "MobileNet"
    static let shared: ContentClassifier? = ContentClassifier()

    var minConfidence: Float = 0.30
    var personConfidence: Float = 0.15

    private let model: VNCoreMLModel

    // More concurrency is not necessarily more throughput with Core ML.
    private let gate = DispatchSemaphore(value: 2)

    private static let unneededPhrases: Set<String> = [
        "laptop", "laptop computer", "notebook", "notebook computer",
        "monitor", "screen", "crt screen",
        "desktop computer", "television", "television receiver",
        "whiteboard", "chalkboard", "blackboard",
        "document", "paper", "receipt", "invoice", "envelope", "binder",
        "book jacket", "menu",
        "id", "passport", "driver license", "card", "business card",
        "keyboard", "computer keyboard", "mouse", "computer mouse",
        "printer", "web site", "desk", "office", "book", "magazine", "comic book"
    ]

    private static let personPhrases: Set<String> = [
        "person", "people", "man", "woman", "boy", "girl", "child", "baby",
        "bride", "groom", "bridegroom",
        "baseball player", "basketball player", "soccer player", "football player",
        "swimmer", "runner", "skier", "surfer"
    ]

    init?() {
        guard let model = MLModelLoader.loadVisionModel(named: Self.modelName) else {
            return nil
        }

        self.model = model
    }

    func classify(
        _ cg: CGImage,
        orientation: CGImagePropertyOrientation = .up
    ) -> ContentInfo? {
        ScanProfiler.shared.measure(.content) {
            gate.wait()
            defer { gate.signal() }

            let request = VNCoreMLRequest(model: model)
            request.imageCropAndScaleOption = .scaleFill

            let handler = VNImageRequestHandler(
                cgImage: cg,
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
                let top = observations.first
            else {
                return nil
            }

            let topFive = observations.prefix(5)

            let isPersonLike = topFive.contains {
                $0.confidence >= personConfidence &&
                Self.matchesPerson($0.identifier)
            }

            let isUnneededObject = observations.prefix(3).contains {
                $0.confidence >= minConfidence &&
                Self.matchesUnneeded($0.identifier)
            }

            return ContentInfo(
                topLabel: top.identifier,
                isUnneededObject: isUnneededObject,
                isPersonLike: isPersonLike
            )
        }
    }

    private static func normalizedPieces(_ label: String) -> [String] {
        label
            .lowercased()
            .replacingOccurrences(of: "_", with: " ")
            .split(separator: ",")
            .map {
                $0.trimmingCharacters(in: .whitespacesAndNewlines)
            }
    }

    private static func matchesUnneeded(_ label: String) -> Bool {
        normalizedPieces(label).contains {
            unneededPhrases.contains($0)
        }
    }

    private static func matchesPerson(_ label: String) -> Bool {
        let pieces = normalizedPieces(label)

        if pieces.contains(where: { personPhrases.contains($0) }) {
            return true
        }

        let tokens = Set(
            pieces
                .joined(separator: " ")
                .split(separator: " ")
                .map(String.init)
        )

        let personTokens: Set<String> = [
            "person", "people", "man", "woman", "boy", "girl", "child", "baby"
        ]

        return !tokens.isDisjoint(with: personTokens)
    }
}
