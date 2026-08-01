import { Image } from "expo-image";
import { useEffect } from "react";
import { StyleSheet, View, Text } from "react-native"; // Added Text import
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { GradientButton } from "@/components/ui/gradient-button";
import {
  Brand,
  FontSizes,
  FontWeights,
  Gradients,
  Radii,
  Spacing,
} from "@/constants/theme";
import { GradientText } from "@/components/ui/gradient-text";
import { useCredits } from "@/context/CreditsContext";

type DoneCleaningProps = {
  freedUpBytes?: number;
  itemsDeleted?: number;
  currentCredits?: number; // New Prop
  remainingItems?: number; // New Prop
  onViewLibrary?: () => void;
  onDone?: () => void;
  onUpgradePress?: () => void; // New Prop for opening paywall
};

// Small helper: fade + rise entrance, staggered by `delay`.
function useEntrance(delay: number) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }),
    );
    translateY.value = withDelay(
      delay,
      withSpring(0, { damping: 14, stiffness: 120 }),
    );
  }, []);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}

// Helper: format bytes to appropriate unit (KB, MB, GB)
function formatBytes(bytes: number): { value: number; unit: string } {
  if (bytes < 1024) {
    return { value: bytes, unit: "B" };
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return { value: kb, unit: "KB" };
  }
  const mb = kb / 1024;
  if (mb < 1024) {
    return { value: mb, unit: "MB" };
  }
  const gb = mb / 1024;
  return { value: gb, unit: "GB" };
}

const DoneCleaning = ({
  freedUpBytes = 0,
  itemsDeleted = 0,
  remainingItems = 0,
  onViewLibrary,
  onDone,
  onUpgradePress,
}: DoneCleaningProps) => {
  // pop in with a spring overshoot
  const badgeScale = useSharedValue(0.4);
  const badgeOpacity = useSharedValue(0);
  const { credits: currentCredits, isSubscribed } = useCredits();
  //  Ambient glow: fades in, then breathes gently forever
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.85);

  useEffect(() => {
    badgeOpacity.value = withTiming(1, {
      duration: 260,
      easing: Easing.out(Easing.ease),
    });
    badgeScale.value = withSequence(
      withTiming(1.12, { duration: 340, easing: Easing.out(Easing.cubic) }),
      withSpring(1, { damping: 8, stiffness: 160 }),
    );

    glowOpacity.value = withDelay(
      100,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }),
    );
    // Gentle continuous breathing glow — subtle, not distracting
    glowScale.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(1.08, {
            duration: 1600,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0.96, {
            duration: 1600,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
        true,
      ),
    );
  }, []);

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: badgeOpacity.value,
    transform: [{ scale: badgeScale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value * 0.05,
    transform: [{ scale: glowScale.value }],
  }));

  //  Staggered entrance for the text block + buttons
  const titleEntrance = useEntrance(220);
  const statLabelEntrance = useEntrance(300);
  const statValueEntrance = useEntrance(360);
  const statSubtitleEntrance = useEntrance(420);
  const buttonsEntrance = useEntrance(520);

  // Format the freed-up bytes to appropriate unit
  const { value: formattedValue, unit } = formatBytes(freedUpBytes);
  const displayValue = formattedValue.toFixed(1);
  const displayUnit = unit;

  // 🔥 New Logic: Determine if we should prompt the user to upgrade
  const shouldShowUpgrade = isSubscribed
    ? false
    : currentCredits === 0 && remainingItems > 0;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        {/*  Glowing done badge  */}
        <View style={styles.badgeWrap}>
          <Animated.View
            style={[styles.glow, glowStyle]}
            pointerEvents="none"
          />
          <Animated.View style={badgeStyle}>
            <Image
              source={require("@/assets/icons/done.png")}
              contentFit="contain"
              style={styles.doneImage}
            />
          </Animated.View>
        </View>

        <Animated.Text style={[styles.title, titleEntrance]}>
          All Done! 🎉
        </Animated.Text>
        <Animated.Text style={[styles.statLabel, statLabelEntrance]}>
          You freed up
        </Animated.Text>
        <Animated.Text style={[styles.statValue, statValueEntrance]}>
          {displayValue} {displayUnit}
        </Animated.Text>

        <Animated.Text style={[styles.statSubtitle, statSubtitleEntrance]}>
          {itemsDeleted.toLocaleString()} Items deleted
        </Animated.Text>
        {!isSubscribed && (
          <GradientText
            onPress={onUpgradePress}
            colors={Gradients.primaryButton}
            end={{ x: 0.2, y: 0.5 }}
            style={[
              {
                fontSize: FontSizes.body,
                fontWeight: 500,
              },
            ]}
          >
            {currentCredits.toLocaleString()} Credits Left
          </GradientText>
        )}
        {/* 🚀 New Clickable Upgrade Prompt - Enters with the subtitle timing */}
        {shouldShowUpgrade && (
          <Animated.View
            style={[statSubtitleEntrance, { marginTop: Spacing.three }]}
          >
            {/* <Text
              style={{
                color: Brand.primary,
                fontSize: FontSizes.body,
                fontWeight: FontWeights.medium as any,
                textDecorationLine: "underline",
                textAlign: "center",
              }}
              onPress={onUpgradePress}
            > */}
            <GradientText
              onPress={onUpgradePress}
              colors={Gradients.primaryButton}
              end={{ x: 0.5, y: 0.5 }}
              style={[
                {
                  fontSize: FontSizes.body,
                  fontWeight: 500,
                  textDecorationLine: "underline",
                },
              ]}
            >
              You still have{" "}
              <Text style={{ fontSize: 16, fontWeight: 700 }}>
                {remainingItems.toLocaleString()}
              </Text>{" "}
              items remaining.
              {"\n"}Tap to clear them all →
            </GradientText>
            {/* </Text> */}
          </Animated.View>
        )}
      </View>

      <Animated.View style={[styles.buttonGroup, buttonsEntrance]}>
        {/* Always safe, neutral button */}
        <GradientButton
          title="View Library"
          type={!shouldShowUpgrade ? "primary" : "secondary"}
          onPress={onViewLibrary}
        />

        {/* 🔥 Dynamic button based on credit state */}
        <GradientButton
          title={shouldShowUpgrade ? "Unlock Unlimited" : "Done"}
          type={shouldShowUpgrade ? "primary" : "secondary"}
          onPress={shouldShowUpgrade ? onUpgradePress : onDone}
        />
      </Animated.View>
    </SafeAreaView>
  );
};

export default DoneCleaning;

const BADGE_SIZE = 300;
const GLOW_SIZE = BADGE_SIZE * 1.05;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.appBackground,
    paddingHorizontal: Spacing.four,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  badgeWrap: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.four,
  },
  glow: {
    position: "absolute",
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: Radii.full,
    backgroundColor: Brand.primary,
    shadowColor: Brand.glow,
    shadowOpacity: 0.9,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 0 },
  },
  doneImage: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
  },

  title: {
    color: Brand.textPrimary,
    fontSize: FontSizes.title,
    fontWeight: FontWeights.semibold as any,
    marginBottom: Spacing.four,
  },
  statLabel: {
    color: Brand.textSecondary,
    fontSize: FontSizes.body,
    marginBottom: Spacing.one,
  },
  statValue: {
    color: Brand.textPrimary,
    fontSize: 40,
    fontWeight: FontWeights.bold as any,
    letterSpacing: -0.5,
    marginBottom: Spacing.one,
  },
  statSubtitle: {
    color: Brand.textSecondary,
    fontSize: FontSizes.body,
  },

  buttonGroup: {
    gap: Spacing.two + Spacing.half,
    marginBottom: Spacing.five,
  },
});
