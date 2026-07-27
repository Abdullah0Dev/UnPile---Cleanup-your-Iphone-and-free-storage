// Reexport the native module. On web, it will be resolved to ExpoPhotoAnalyzerModule.web.ts
// and on native platforms to ExpoPhotoAnalyzerModule.ts
export { default } from './ExpoPhotoAnalyzerModule';
export * from './ExpoPhotoAnalyzer.types';
