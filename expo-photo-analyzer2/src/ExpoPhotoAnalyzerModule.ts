import { requireNativeModule } from 'expo-modules-core';

import type { AnalysisResult, ProgressEvent } from './ExpoPhotoAnalyzer.types';

const NativeModule = requireNativeModule('ExpoPhotoAnalyzer');

export default {
  analyzePhotos(): Promise<AnalysisResult> {
    return NativeModule.analyzePhotos();
  },
  addListener(eventName: 'onProgress', listener: (event: ProgressEvent) => void) {
    return NativeModule.addListener(eventName, listener);
  },
  removeListeners(count: number) {
    NativeModule.removeListeners(count);
  },
};
