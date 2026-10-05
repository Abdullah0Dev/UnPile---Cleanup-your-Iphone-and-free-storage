import CoreML
import Vision

enum MLModelLoader {
    /// Loads a compiled model from the module's resource bundle, pinned to CPU + Neural Engine.
    static func loadVisionModel(named name: String) -> VNCoreMLModel? {
        guard let bundleURL = Bundle.main.url(forResource: "ExpoPhotoAnalyzerResources", withExtension: "bundle"),
              let bundle = Bundle(url: bundleURL),
              let modelURL = bundle.url(forResource: name, withExtension: "mlmodelc") else {
            print("❌ Model \(name) not found in resource bundle")
            return nil
        }
        do {
            let config = MLModelConfiguration()
            config.computeUnits = .cpuAndNeuralEngine
            let ml = try MLModel(contentsOf: modelURL, configuration: config)
            return try VNCoreMLModel(for: ml)
        } catch {
            print("❌ Failed to load model \(name): \(error)")
            return nil
        }
    }
}
