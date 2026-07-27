import { NativeModule, requireNativeModule } from 'expo';

// MARK: - Result Types

export interface DuplicateGroup {
  /** The best (highest quality) photo in the group */
  bestAssetId: string;
  /** Photo IDs that are duplicates of the best one, recommended for deletion */
  duplicateAssetIds: string[];
}

export interface AnalysisResult {
  /** All screenshot IDs found */
  screenshots: string[];
  /** Screenshot IDs recommended for deletion (old, low‑quality, etc.) */
  screenshotCandidates: string[];
  /** Duplicate groups with best and duplicate IDs */
  duplicateGroups: DuplicateGroup[];
  /** Clutter IDs (forgotten downloads, caches, etc.) */
  clutter: string[];
  /** Blurry or low‑quality photo IDs */
  blurry: string[];
  /** All Live Photo IDs */
  livePhotos: string[];
  /** Live Photo IDs recommended for deletion */
  livePhotoCandidates: string[];
  /** Total storage that can be saved (in bytes) */
  totalSavingsBytes: number;
}
 