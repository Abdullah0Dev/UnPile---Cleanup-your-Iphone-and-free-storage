import React, { useEffect } from "react";
import {
  InteractionManager,
  StyleSheet,
  View,
} from "react-native";
import { router } from "expo-router";
import { ScanningProgress } from "@/screens";
import { useAnalysis } from "@/context/AnalysisContext";

const ScanningScreen = () => {
  const {
    progress,
    totalItems,
    processedItems,
    category,
    startAnalysis,
  } = useAnalysis();

  useEffect(() => {
    let cancelled = false;

    let navigationTimer:
      | ReturnType<typeof setTimeout>
      | undefined;

    const task =
      InteractionManager.runAfterInteractions(
        async () => {

          if (cancelled) {
            return;
          }

          const ok =
            await startAnalysis();

          if (cancelled) {
            return;
          }

          if (!ok) {
            router.back();
            return;
          }

          navigationTimer =
            setTimeout(() => {

              if (!cancelled) {
                router.replace(
                  "/home-results"
                );
              }

            }, 250);
        }
      );

    return () => {

      cancelled = true;

      task.cancel();

      if (navigationTimer) {
        clearTimeout(
          navigationTimer
        );
      }
    };

  }, [startAnalysis]);

  return (
    <View style={styles.container}>
      <ScanningProgress
        progress={Math.round(
          progress * 100
        )}
        categoryProgress={
          category || "preparing"
        }
        totalItems={totalItems}
        processedItems={
          processedItems
        }
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