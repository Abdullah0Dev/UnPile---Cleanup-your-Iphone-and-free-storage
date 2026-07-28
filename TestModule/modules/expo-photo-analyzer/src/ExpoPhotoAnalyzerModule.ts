import { NativeModule, requireNativeModule } from "expo-modules-core";

export type OnProgressEventPayload = {
  progress: number;
  category: string;
};

export type ExpoPhotoAnalyzerModuleEvents = {
  onProgress: (params: OnProgressEventPayload) => void;
};

declare class ExpoPhotoAnalyzerModule extends NativeModule<ExpoPhotoAnalyzerModuleEvents> {
  hello(): string;
  analyzePhotos(): Promise<any>;
}

export default requireNativeModule<ExpoPhotoAnalyzerModule>(
  "ExpoPhotoAnalyzer",
);
