import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ScanningProgress } from "@/screens";
import { useAnalysis } from "@/context/AnalysisContext";

const ScanningScreen = () => {
  const { progress, category, isLoading, result, startAnalysis } =
    useAnalysis();
  const [analysisStarted, setAnalysisStarted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let navTimer: ReturnType<typeof setTimeout>;

    const startTimer = setTimeout(async () => {
      const t0 = Date.now();
      const ok = await startAnalysis();
      if (cancelled) return;
      if (!ok) {
        router.back();
        return;
      } // failed or busy: don't hang here
      const wait = Math.max(0, 1500 - (Date.now() - t0)); // scan is fast now, so avoid a flash
      navTimer = setTimeout(() => {
        if (!cancelled) router.replace("/home-results");
      }, wait);
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(startTimer);
      clearTimeout(navTimer);
    };
  }, []);

  return (
    <View style={styles.container}>
      <ScanningProgress
        progress={Math.round(progress * 100)}
        categoryProgress={category}
        totalItems={0}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#060423",
  },
});

export default ScanningScreen;
