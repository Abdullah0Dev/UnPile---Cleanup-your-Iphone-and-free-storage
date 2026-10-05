import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import React, { useRef, useEffect, useCallback } from "react";
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomSheet, { BottomSheetView } from "@expo/ui/community/bottom-sheet";
import { useTranslation } from "react-i18next";

import { GradientButton } from "./gradient-button";
import CountdownCloseButton from "./countdown-close-button";
import { Brand } from "@/constants/theme";
import {
  DAILY_REFILL_CREDITS,
  WELCOME_BONUS_CREDITS,
} from "@/context/CreditsContext";

type OnboardingCreditsProps = {
  isPresented: boolean;
  onDismiss: () => void;
  onUpgrade: () => void;
};

const OnboardingCredits = ({
  isPresented,
  onDismiss,
  onUpgrade,
}: OnboardingCreditsProps) => {
  const { t } = useTranslation();

  // Bottom Sheet Ref
  const sheetRef = useRef<BottomSheet>(null);

  // Shared values for animations
  const shakeDegrees = useSharedValue(0);
  const shakeZoom = useSharedValue(0.9);

  // Control bottom sheet visibility
  useEffect(() => {
    if (isPresented) {
      sheetRef.current?.snapToIndex(0);
    } else {
      sheetRef.current?.close();
    }
  }, [isPresented]);

  // Start shake animation after 1 second
  useEffect(() => {
    if (isPresented) {
      const startShake = () => {
        shakeZoom.value = withRepeat(
          withSequence(
            withTiming(1.06, { duration: 200 }),
            withDelay(100, withTiming(1.06, { duration: 0 })),
            withTiming(0.94, { duration: 300 }),
            withTiming(1, { duration: 0 }),
            withDelay(1400, withTiming(1, { duration: 0 })),
          ),
          2,
          false,
        );

        shakeDegrees.value = withRepeat(
          withSequence(
            withTiming(6, { duration: 50 }),
            withTiming(-6, { duration: 100 }),
            withTiming(6, { duration: 50 }),
            withTiming(-6, { duration: 100 }),
            withTiming(6, { duration: 50 }),
            withTiming(-6, { duration: 100 }),
            withTiming(6, { duration: 50 }),
            withTiming(-6, { duration: 100 }),
            withTiming(0, { duration: 0 }),
            withDelay(1400, withTiming(0, { duration: 0 })),
          ),
          2,
          false,
        );
      };

      const delayTimer = setTimeout(() => {
        startShake();
      }, 1000);

      return () => {
        clearTimeout(delayTimer);
        shakeDegrees.value = 0;
        shakeZoom.value = 0.9;
      };
    }
  }, [isPresented, shakeDegrees, shakeZoom]);

  const heroAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${shakeDegrees.value}deg` },
      { scale: shakeZoom.value },
    ],
  }));

  const handleCountdownComplete = useCallback(() => {
    console.log("Countdown finished");
  }, []);

  const handleDismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={["80%"]}
      index={-1}
      onClose={handleDismiss}
      enablePanDownToClose={true}
      backgroundStyle={{ backgroundColor: "#08071A" }}
      handleIndicatorStyle={{
        backgroundColor: Brand.textSecondary,
      }}
    >
      <BottomSheetView style={styles.bottomSheetContent}>
        <SafeAreaView style={styles.container}>
          {/* Close Button */}
          <View style={styles.closeContainer}>
            <CountdownCloseButton
              duration={5000}
              active={isPresented}
              onComplete={handleCountdownComplete}
              onPress={handleDismiss}
            />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Hero Image */}
            <View style={styles.heroWrapper}>
              <Animated.Image
                source={require("@/assets/icons/gift2.png")}
                style={[styles.heroImage, heroAnimatedStyle]}
                resizeMode="contain"
              />
            </View>

            {/* Title & Body */}
            <View style={{ alignItems: "center" }}>
              <Text style={styles.title}>
                {t("credits_popup.title")}
              </Text>

              <Text style={styles.bodyText}>
                {t("credits_popup.subtitle.part_1")}{" "}
                <Text style={styles.highlight}>
                  {WELCOME_BONUS_CREDITS}{" "}
                  {t("credits_popup.subtitle.part_2")}
                </Text>{" "}
                {t("credits_popup.subtitle.part_3")}{" "}
                <Text style={styles.highlight}>
                  {DAILY_REFILL_CREDITS}{" "}
                  {t("credits_popup.subtitle.part_4")}
                </Text>{" "}
                {t("credits_popup.subtitle.part_5")}
              </Text>
            </View>

            <View style={styles.spacer} />

            {/* Buttons */}
            <View style={styles.buttonGroup}>
              <GradientButton
                textStyle={{
                  fontSize: 19,
                  fontWeight: "700",
                }}
                title={t("credits_popup.buttons.primary")}
                onPress={onUpgrade}
              />

              <TouchableOpacity
                onPress={handleDismiss}
                style={styles.ghostButton}
              >
                <Text style={styles.ghostText}>
                  {t("credits_popup.buttons.secondary")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default OnboardingCredits;

const styles = StyleSheet.create({
  bottomSheetContent: {
    flex: 1,
  },
  container: {
    backgroundColor: "#08071A",
    flex: 1,
    paddingHorizontal: 20,
  },
  closeContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 10,
    height: 30,
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  heroWrapper: {
    alignItems: "center",
    marginVertical: 10,
  },
  heroImage: {
    width: 160,
    height: 160,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 15,
    color: "#FFFFFF",
  },
  bodyText: {
    fontSize: 17,
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  highlight: {
    color: Brand.primary,
    fontWeight: "700",
  },
  spacer: {
    flex: 1,
    minHeight: 20,
  },
  buttonGroup: {
    width: "100%",
    gap: 10,
  },
  ghostButton: {
    alignItems: "center",
    paddingVertical: 16,
  },
  ghostText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 15,
    textDecorationLine: "underline",
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 15,
  },
  footerLink: {
    marginHorizontal: 10,
    marginVertical: 4,
    alignItems: "center",
  },
  footerLinkText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.4)",
  },
  underline: {
    height: 1,
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    marginTop: 1,
  },
});