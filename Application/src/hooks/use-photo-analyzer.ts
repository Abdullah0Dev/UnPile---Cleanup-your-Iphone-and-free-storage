import { useState, useEffect, useCallback } from 'react';
import ExpoPhotoAnalyzer from 'expo-photo-analyzer';
import * as MediaLibrary from 'expo-media-library';

type AnalysisResult = {
  screenshots: string[];
  duplicates: string[][];
  blurry: string[];
  livePhotos: string[];
  totalSavingsBytes: number;
};

export function usePhotoAnalyzer() {
  const [progress, setProgress] = useState(0);
  const [category, setCategory] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startAnalysis = useCallback(async (useAI: boolean = true) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission not granted');
        return;
      }

      setIsAnalyzing(true);
      setError(null);

      // Listen to progress events
      const subscription = ExpoPhotoAnalyzer.addListener('onProgress', (e: any) => {
        setProgress(e.progress);
        setCategory(e.category);
      });

      const res = await ExpoPhotoAnalyzer.analyzePhotos(useAI);
      setResult(res as AnalysisResult);
      subscription.remove();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return { progress, category, result, isAnalyzing, error, startAnalysis };
}
export async function deleteAssetsByIds(ids: string[]) {
  await MediaLibrary.deleteAssetsAsync(ids);
}