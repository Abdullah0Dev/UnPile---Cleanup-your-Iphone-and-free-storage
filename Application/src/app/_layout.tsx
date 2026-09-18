import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState, useRef } from "react";
import { useRouter, Stack, usePathname } from "expo-router";
import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { AnalysisProvider, useAnalysis } from "@/context/AnalysisContext";
import { CreditsProvider } from "@/context/CreditsContext";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import { Platform } from "react-native";

SplashScreen.preventAutoHideAsync();

Purchases.configure({
  apiKey: Platform.select({
    ios: process.env.EXPO_PUBLIC_RC_IOS_KEY!,
    android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY!,
  })!,
});
function LayoutContent() {
  const router = useRouter();
  const { result, isLoadingCache } = useAnalysis();
  const currentRoute = usePathname();
  console.log("RC iOS Key:", process.env.EXPO_PUBLIC_RC_IOS_KEY);
  const [isReady, setIsReady] = useState(false);
  const hasInitialized = useRef(false); // 👈 Guard to run once
  useEffect(() => {
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }, []);
  useEffect(() => {
    if (!isLoadingCache && !hasInitialized.current) {
      hasInitialized.current = true;
      const initialRoute = result ? "/home-results" : "/";
      // Decide initial route only once
      if (result) {
        router.replace("/home-results");
      } else {
        if (currentRoute !== "/") {
          router.replace("/");
        }
      }
      setIsReady(true);
    }
  }, [isLoadingCache, result]); // Still depends on result, but guard prevents re-run

  return (
    <>
      {!isReady && <AnimatedSplashOverlay onComplete={() => {}} />}
      {isReady && (
        <Stack
          screenOptions={{
            gestureEnabled: true,
            fullScreenGestureEnabled: true,
            headerShown: false,
          }}
        />
      )}
    </>
  );
}

export default function TabLayout() {
  return (
    <AnalysisProvider>
      <CreditsProvider>
        <LayoutContent />
      </CreditsProvider>
    </AnalysisProvider>
  );
}
