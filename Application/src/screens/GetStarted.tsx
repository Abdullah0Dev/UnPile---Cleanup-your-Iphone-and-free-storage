import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import Animated from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";

import { Brand, FontSizes, FontWeights, Gradients } from "@/constants/theme";
import { GradientText } from "@/components/ui/gradient-text";
import { GradientButton } from "@/components/ui/gradient-button";
import { useEntrance, useHeroEntrance } from "@/hooks/use-entrance";
import { useAnalysis } from "@/context/AnalysisContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
const GetStarted = () => {
  const logoEntrance = useHeroEntrance(0);
  const wordmarkEntrance = useEntrance(160);
  const subtitleEntrance = useEntrance(240);
  const buttonEntrance = useEntrance(360);

  const { startAnalysis, isLoading, clearResult } = useAnalysis();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(false);

  // Check permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      setPermissionGranted(status === "granted");
    };
    checkPermission();
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    setIsCheckingPermission(true);
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      const granted = status === "granted";
      setPermissionGranted(granted);
      if (!granted) {
        Alert.alert(
          "Permission Required",
          "Please grant photo library access in Settings to scan your photos.",
          [{ text: "OK", style: "default" }],
        );
      }
      return granted;
    } catch (error) {
      console.error("Permission error:", error);
      return false;
    } finally {
      setIsCheckingPermission(false);
    }
  };
  const handleStartScanning = async () => {
    if (!permissionGranted) {
      const granted = await requestPermission();
      if (!granted) return;
    }
    // Just navigate – analysis starts on the scanning screen
    router.push("/scanning");
  };
  const isButtonDisabled = isLoading || isCheckingPermission;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <Animated.View style={logoEntrance}>
          <Image
            source={require("@/assets/images/logo2.png")}
            contentFit="contain"
            style={styles.logoImage}
          />
        </Animated.View>

        <Animated.View style={[styles.logoTextContainer, wordmarkEntrance]}>
          <Text style={styles.logoText}>Un</Text>
          <GradientText
            colors={Gradients.primaryButton}
            style={styles.logoText}
          >
            Pile
          </GradientText>
        </Animated.View>

        <Animated.View
          style={[
            styles.subtitleContainer,
            { gap: 4, marginTop: 10 },
            subtitleEntrance,
          ]}
        >
          <Text style={styles.logoSubtitle}>Clean your camera roll.</Text>
          <Text style={styles.logoSubtitle}>Free up space in seconds.</Text>
        </Animated.View>
      </View>

      <Animated.View style={buttonEntrance}>
        <GradientButton
          onPress={handleStartScanning}
          title={isCheckingPermission ? "Checking..." : "Start Scanning"}
          disabled={isButtonDisabled}
        />
      </Animated.View> 
    </SafeAreaView>
  );
};

export default GetStarted;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: `#060423`,
    paddingHorizontal: 18,
    paddingBottom: 25,
  },
  logoImage: {
    width: 300,
    height: 300,
  },
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    display: "flex",
  },
  subtitleContainer: {
    alignItems: "center",
  },
  logoTextContainer: {
    alignItems: "center",
    justifyContent: "center",
    display: "flex",
    flexDirection: "row",
  },
  logoText: {
    color: Brand.textPrimary,
    fontSize: FontSizes.largeTitle,
    fontWeight: "800",
  },
  logoSubtitle: {
    color: Brand.textPrimary,
    fontSize: 18,
    fontWeight: FontWeights.regular,
    opacity: 0.8,
  },
});
