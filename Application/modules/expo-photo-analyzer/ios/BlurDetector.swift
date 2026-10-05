import Foundation

/// Decision logic only. Pixels are analysed once in ImageAnalysis; NIMA runs lazily
/// and ONLY for ambiguous photos, so ~90% of the library never touches the model.
final class BlurDetector {
    var useMLAssessment = true
    var mlQualityThreshold: Float = 4.0

    /// Tile-sharpness (85th percentile Laplacian variance, 512px). TUNE on your own photos:
    /// below `strictSharpness` = blurry; between strict and soft = ask NIMA; above soft = sharp.
    var strictSharpness: Float = 30
    var softSharpness: Float = 150

    /// Photos this flat (sky, wall, dark) naturally have low Laplacian variance.
    var minContrastStd: Float = 12

    func isBlurry(stats: ImageStats, quality: () -> Float?) -> Bool {
        if stats.sharpness >= softSharpness { return false }

        let lowContrast = stats.contrastStd < minContrastStd
        if stats.sharpness < strictSharpness && !lowContrast { return true }

        // Ambiguous zone (or flat image): let the model decide.
        guard useMLAssessment, let q = quality() else {
            return stats.sharpness < strictSharpness && !lowContrast
        }
        return q < mlQualityThreshold
    }
}
