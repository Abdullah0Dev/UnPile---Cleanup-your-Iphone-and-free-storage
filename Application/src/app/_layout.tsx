import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState, useRef } from "react";
import { useRouter, Stack } from "expo-router";
import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { AnalysisProvider, useAnalysis } from "@/context/AnalysisContext";
import { CreditsProvider } from "@/context/CreditsContext";

SplashScreen.preventAutoHideAsync();

function LayoutContent() {
  const router = useRouter();
  const { result, isLoadingCache } = useAnalysis();
  const [isReady, setIsReady] = useState(false);
  const hasInitialized = useRef(false); // 👈 Guard to run once

  useEffect(() => {
    if (!isLoadingCache && !hasInitialized.current) {
      hasInitialized.current = true;
      // Decide initial route only once
      if (result) {
        router.replace("/home-results");
      } else {
        router.replace("/");
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
