import { NativeModule, requireNativeModule } from 'expo';
import { AnalysisResult } from './ExpoPhotoAnalyzer.types';


export interface ExpoPhotoAnalyzerModule extends NativeModule {
  /**
   * Starts the photo analysis process.
   * @returns A promise that resolves with the analysis result.
   * @throws {Error} if permissions are not granted or analysis fails.
   */
  analyzePhotos(): Promise<AnalysisResult>;

  /**
   * Simple test function.
   * @returns A greeting string.
   */
  hello(): string;
}

// MARK: - Export

export default requireNativeModule<ExpoPhotoAnalyzerModule>('ExpoPhotoAnalyzer');