import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { Slot } from "expo-router";
import { AnalysisProvider, useAnalysis } from "@/context/AnalysisContext";

SplashScreen.preventAutoHideAsync();

function LayoutContent() {
  const router = useRouter();
  const { result, isLoadingCache } = useAnalysis();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isLoadingCache) {
      // Cache loaded – decide where to go
      if (result) {
        router.replace("/home-results");
      } else {
        router.replace("/");
      }
      // Mark as ready after navigation
      setIsReady(true);
    }
  }, [isLoadingCache, result]);

  const handleSplashComplete = () => {
    // Splash animation finished, but we still wait for cache and navigation.
    // This is just a signal; the real decision happens in useEffect above.
    // We don't need to do anything here because the useEffect will handle it.
  };

  return (
    <>
      {/* Show splash until app is ready */}
      {!isReady && <AnimatedSplashOverlay onComplete={handleSplashComplete} />}
      {/* Show main app only after ready */}
      {isReady && <Slot />}
    </>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnalysisProvider>
        <LayoutContent />
      </AnalysisProvider>
    </ThemeProvider>
  );
}