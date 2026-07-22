import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
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

import { GradientButton } from "@/components/ui/gradient-button";
import {
  Brand,
  FontSizes,
  FontWeights,
  Radii,
  Spacing,
} from "@/constants/theme";

type DoneCleaningProps = {
  freedUpGb?: number;
  itemsDeleted?: number;
  onViewLibrary?: () => void;
  onDone?: () => void;
};

// Small helper: fade + rise entrance, staggered by `delay`.
function useEntrance(delay: number) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
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

const DoneCleaning = ({
  freedUpGb = 23.6,
  itemsDeleted = 1654,
  onViewLibrary,
  onDone,
}: DoneCleaningProps) => {
  // ── Badge entrance: pop in with a spring overshoot ───────────────────
  const badgeScale = useSharedValue(0.4);
  const badgeOpacity = useSharedValue(0);

  // ── Ambient glow: fades in, then breathes gently forever ─────────────
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.85);

  useEffect(() => {
    badgeOpacity.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.ease) });
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
          withTiming(1.08, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.96, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
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

  // ── Staggered entrance for the text block + buttons ──────────────────
  const titleEntrance = useEntrance(220);
  const statLabelEntrance = useEntrance(300);
  const statValueEntrance = useEntrance(360);
  const statSubtitleEntrance = useEntrance(420);
  const buttonsEntrance = useEntrance(520);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        {/* ── Glowing done badge ──────────────────────────────────── */}
        <View style={styles.badgeWrap}>
          <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none" />
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
          {freedUpGb.toFixed(1)} GB
        </Animated.Text>
        <Animated.Text style={[styles.statSubtitle, statSubtitleEntrance]}>
          {itemsDeleted.toLocaleString()} items deleted
        </Animated.Text>
      </View>

      <Animated.View style={[styles.buttonGroup, buttonsEntrance]}>
        <GradientButton title="View Library" onPress={onViewLibrary} />
        <GradientButton title="Done" type="secondary" onPress={onDone} />
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