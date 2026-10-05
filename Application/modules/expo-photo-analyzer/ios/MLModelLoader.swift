import CoreML
import Vision

enum MLModelLoader {
    static func loadVisionModel(named name: String) -> VNCoreMLModel? {
        guard
            let bundleURL = Bundle.main.url(
                forResource: "ExpoPhotoAnalyzerResources",
                withExtension: "bundle"
            ),
            let bundle = Bundle(url: bundleURL),
            let modelURL = bundle.url(
                forResource: name,
                withExtension: "mlmodelc"
            )
        else {
            print("❌ Model \(name) not found in resource bundle")
            return nil
        }

        do {
            let config = MLModelConfiguration()

            // Allow Core ML to select the best available hardware path.
            config.computeUnits = .all

            let model = try MLModel(
                contentsOf: modelURL,
                configuration: config
            )

            return try VNCoreMLModel(for: model)
        } catch {
            print("❌ Failed to load model \(name): \(error)")
            return nil
        }
    }
}
