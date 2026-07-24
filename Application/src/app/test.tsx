import React, { useState } from "react";
import { Button, Text, View, StyleSheet, Alert } from "react-native";
import * as MediaLibrary from "expo-media-library";
import ExpoPhotoAnalyzer from "expo-photo-analyzer";

export default function TestAnalyzerScreen() {
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [category, setCategory] = useState("");

  const startTest = async () => {
    try {
      // 1. Request photo library permission (only read)
      const { granted } = await MediaLibrary.requestPermissionsAsync();
      if (!granted) {
        Alert.alert(
          "Permission required",
          "Please grant photo access to test the analyzer.",
        );
        return;
      }

      setStatus("Scanning...");
      setProgress(0);

      // 2. Listen to progress events
      const subscription = ExpoPhotoAnalyzer.addListener(
        "onProgress",
        (event: any) => {
          setProgress(event.progress);
          setCategory(event.category);
        },
      );

      // 3. Start analysis (useAI = true)
      const result = await ExpoPhotoAnalyzer.analyzePhotos(true);

      // 4. Log the result and display summary
      console.log("Analysis result:", JSON.stringify(result, null, 2));
      setStatus("Done ✅");
      Alert.alert(
        "Analysis complete",
        `Screenshots: ${result.screenshots.length}\n` +
          `Duplicates: ${result.duplicates.length} groups\n` +
          `Blurry: ${result.blurry.length}\n` +
          `Live Photos: ${result.livePhotos.length}\n` +
          `Potential savings: ${(result.totalSavingsBytes / 1e9).toFixed(2)} GB`,
      );

      subscription.remove();
    } catch (error: any) {
      console.error(error);
      setStatus("Error");
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ExpoPhotoAnalyzer Test</Text>
      <Button title="Start Analysis" onPress={startTest} />
      <Text style={styles.info}>Status: {status}</Text>
      <Text style={styles.info}>Progress: {(progress * 100).toFixed(0)}%</Text>
      <Text style={styles.info}>Category: {category}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: { fontSize: 20, marginBottom: 20 },
  info: { marginTop: 10, fontSize: 16 },
});
