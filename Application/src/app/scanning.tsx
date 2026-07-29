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
    if (!analysisStarted) {
      // some delay to ensure the page loaded
      const timer = setTimeout(() => {
        startAnalysis();
        setAnalysisStarted(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []);

  // nav to results when analysis completes
  useEffect(() => {
    if (!isLoading && result) {
      router.replace("/home-results");
    }
  }, [isLoading, result]);

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
