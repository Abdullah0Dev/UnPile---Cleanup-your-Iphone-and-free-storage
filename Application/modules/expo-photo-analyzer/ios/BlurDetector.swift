import Foundation

final class BlurDetector {
    var useMLAssessment = true
    var mlQualityThreshold: Float = 4.0

    // Whole-image metric: preserves the old detector's strong recall.
    var lapBlurThreshold: Float = 200
    var lapSharpThreshold: Float = 400

    // Tile metric: catches cases where the subject is sharp but the background is soft.
    var strictSharpness: Float = 30
    var softSharpness: Float = 150

    // Prevent flat scenes from being automatically called blurry.
    var minContrastStd: Float = 12

    func isBlurry(
        stats: ImageStats,
        quality: () -> Float?
    ) -> Bool {
        let lowContrast = stats.contrastStd < minContrastStd

        // Clearly blurry: both metrics agree.
        if !lowContrast,
           stats.lapVariance < lapBlurThreshold,
           stats.sharpness < softSharpness {
            return true
        }

        // Clearly sharp: both metrics agree. No NIMA needed.
        if stats.lapVariance >= lapSharpThreshold,
           stats.sharpness >= softSharpness {
            return false
        }

        // Only the ambiguous band reaches NIMA.
        guard useMLAssessment, let q = quality() else {
            return !lowContrast && stats.lapVariance < lapBlurThreshold
        }

        return q < mlQualityThreshold
    }
}
