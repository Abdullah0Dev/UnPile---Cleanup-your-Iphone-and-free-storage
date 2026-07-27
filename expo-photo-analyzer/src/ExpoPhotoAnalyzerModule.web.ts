import { registerWebModule, NativeModule } from 'expo';

// ExpoPhotoAnalyzerModule is not available on the web platform.
class ExpoPhotoAnalyzerModule extends NativeModule<{}> {}

export default registerWebModule(ExpoPhotoAnalyzerModule, 'ExpoPhotoAnalyzerModule');
