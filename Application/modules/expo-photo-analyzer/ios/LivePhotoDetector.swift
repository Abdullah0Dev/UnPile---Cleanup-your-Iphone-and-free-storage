//
//  LivePhotoDetector.swift
//  UnpileTest
//
//  Created by Dev Minds on 7/26/26.
//

import Photos
import UIKit

class LivePhotoDetector {

    // MARK: - Configuration

    /// Days after creation – Live Photos older than this are candidates.
    var ageThresholdDays: Int = 60

    /// Quality threshold (1‑10) – Live Photos with score below this are low quality.
    var qualityThreshold: Float = 2.0

    /// If true, use ML quality assessment.
    var useQualityAssessment: Bool = true

    // MARK: - Private

    private let qualityAnalyzer = QualityAnalyzer()
    private let targetSize = CGSize(width: 300, height: 300)

    // MARK: - Public API

    /// Returns all assets that are Live Photos.
    func detectLivePhotos(from assets: [PHAsset]) -> [PHAsset] {
        return assets.filter { $0.mediaSubtypes.contains(.photoLive) }
    }

    /// From a list of Live Photos, returns those recommended for deletion.
    /// Uses heuristics: older than `ageThresholdDays` OR low quality OR not in album.
    func suggestCandidates(from livePhotoAssets: [PHAsset]) -> [PHAsset] {
        let cutoffDate = Date().addingTimeInterval(-Double(ageThresholdDays * 24 * 60 * 60))

        return livePhotoAssets.filter { asset in
            // Exclude favorites
            if asset.isFavorite { return false }

            // Check if in any custom album
            let collections = PHAssetCollection.fetchAssetCollectionsContaining(asset, with: .album, options: nil)
            if collections.count > 0 { return false }

            // 1. Age
            if let creationDate = asset.creationDate, creationDate < cutoffDate {
                return true
            }

            // 2. Quality (if enabled and model available)
            if useQualityAssessment, let analyzer = qualityAnalyzer {
                if let score = getQualityScore(for: asset, using: analyzer), score < qualityThreshold {
                    return true
                }
            }

            return false
        }
    }

    // MARK: - Private

    private func getQualityScore(for asset: PHAsset, using analyzer: QualityAnalyzer) -> Float? {
        let options = PHImageRequestOptions()
        options.isSynchronous = false
        options.deliveryMode = .highQualityFormat
        options.resizeMode = .exact
        options.isNetworkAccessAllowed = true

        var score: Float? = nil
        let semaphore = DispatchSemaphore(value: 0)

        PHImageManager.default().requestImage(
            for: asset,
            targetSize: targetSize,
            contentMode: .aspectFit,
            options: options
        ) { image, _ in
            guard let image = image else {
                semaphore.signal()
                return
            }
            analyzer.assessQuality(for: image) { result in
                score = result
                semaphore.signal()
            }
        }

        semaphore.wait()
        return score
    }
}
