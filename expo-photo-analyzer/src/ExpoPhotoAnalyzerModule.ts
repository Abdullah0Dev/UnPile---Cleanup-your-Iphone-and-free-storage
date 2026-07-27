import { NativeModule, requireNativeModule } from 'expo';

declare class ExpoPhotoAnalyzerModule extends NativeModule<{}> {}

export default requireNativeModule<ExpoPhotoAnalyzerModule>('ExpoPhotoAnalyzer');
