import React, { useCallback, useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { ScanningProgress } from "@/screens";
import { useAnalysis } from "@/context/AnalysisContext";

const ScanningScreen = () => {
  const { progress, category, isLoading, result, startAnalysis } =
    useAnalysis();
  const [analysisStarted, setAnalysisStarted] = useState(false);

  // Start analysis once when the screen mounts
  //  useFocusEffect(() => {
  //   useCallback(() => {
  //     // 1. Set up the delayed execution
  //     const timer = setTimeout(() => {
  //       console.log("This runs after 2 seconds of screen focus");
  //       if (!analysisStarted) {
  //         startAnalysis();
  //         setAnalysisStarted(true);
  //       }
  //     }, 500); // Delay in milliseconds

  //     // 2. Clear the timer if the user leaves the screen before 2 seconds
  //     return () => {
  //       clearTimeout(timer);
  //       console.log("Screen unfocused; timer cleared");
  //     };
  //   }, []); // Add dependencies here if your inner logic relies on state/pr
  // });
  useEffect(() => {
    if (!analysisStarted) {
      // Small delay to ensure navigation is complete before heavy work starts
      const timer = setTimeout(() => {
        startAnalysis();
        setAnalysisStarted(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []);
  
  // useEffect(() => {
  //   if (!analysisStarted) {
  //     startAnalysis();
  //     setAnalysisStarted(true);
  //   }
  // }, [500]);

  // Log progress (optional)
  useEffect(() => {
    console.log(`📊 Progress: ${(progress * 100).toFixed(1)}% – ${category}`);
  }, [progress, category]);

  // Navigate to results when analysis completes
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
