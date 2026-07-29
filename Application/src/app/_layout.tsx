import * as SplashScreen from "expo-splash-screen";
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
      // Cache loaded => decide where to goo
      if (result) {
        router.replace("/home-results");
      } else {
        router.replace("/");
      }
      setIsReady(true);
    }
  }, [isLoadingCache, result]);

  return (
    <>
      {!isReady && <AnimatedSplashOverlay onComplete={() => {}} />}
      {isReady && <Slot />}
    </>
  );
}

export default function TabLayout() {
  return (
    <AnalysisProvider>
      <LayoutContent />
    </AnalysisProvider>
  );
}
