import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from "react-native-svg";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { ChevronLeft } from "lucide-react-native";
import {
  Brand,
  FontSizes,
  FontWeights,
  Radii,
  Spacing,
} from "@/constants/theme";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";

import { useEntrance, useHeroEntrance } from "@/hooks/use-entrance";
import { router } from "expo-router";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ── Ring geometry — matches the ring proportions in the reference design ──
const RING_SIZE = 210;
const STROKE = 10;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type ScanningProgressProps = {
  /** 0–100 target progress. Wire up to real scan progress later. */
  progress?: number;
  /** Total item count being scanned. */
  totalItems?: number;
  /** Duration of the count-up animation in ms. */
  durationMs?: number;
};

const ScanningProgress = ({
  progress = 80,
  totalItems = 12345,
  durationMs = 2600,
}: ScanningProgressProps) => {
  // ── Screen entrance — same cascade rhythm as every other screen ──────
  const headerEntrance = useEntrance(0);
  const titleEntrance = useEntrance(60);
  const ringEntrance = useHeroEntrance(140);
  const scanningLabelEntrance = useEntrance(360);
  const scanningSubtitleEntrance = useEntrance(420);
  const privacyCardEntrance = useEntrance(500);

  // --- Continuous "alive" comet sweep (always running, independent of progress) ---
  const sweepProgress = useSharedValue(0);

  useEffect(() => {
    sweepProgress.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  // --- Reactive progress fill, animated 0 → target on the UI thread ---
  // Delayed to start just after the ring itself has popped in.
  const animatedProgress = useSharedValue(0);

  // JS-side mirror of the number, updated from the UI thread so the
  // <Text> actually counts up frame by frame instead of just re-rendering once.
  const [displayPercent, setDisplayPercent] = useState(0);

  useEffect(() => {
    animatedProgress.value = 0;
    animatedProgress.value = withDelay(
      140,
      withTiming(progress, {
        duration: durationMs,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [progress, durationMs]);

  useAnimatedReaction(
    () => Math.round(animatedProgress.value),
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setDisplayPercent)(current);
      }
    },
  );

  // Progress arc dash offset (fills clockwise from top, 12 o'clock start)
  const progressDashOffset = useDerivedValue(
    () => CIRCUMFERENCE - (CIRCUMFERENCE * animatedProgress.value) / 100,
  );
  const progressArcProps = useAnimatedProps(() => ({
    strokeDashoffset: progressDashOffset.value,
  }));

  // Comet highlight continuously chasing around the track
  const sweepDashOffset = useDerivedValue(
    () => -sweepProgress.value * CIRCUMFERENCE,
  );
  const sweepArcProps = useAnimatedProps(() => ({
    strokeDashoffset: sweepDashOffset.value,
  }));

  // Subtle pulsing scale on the percent label while counting, settles at rest
  const pulseStyle = useAnimatedStyle(() => {
    const isDone = animatedProgress.value >= progress - 0.1;
    return {
      transform: [
        {
          scale: isDone
            ? 1
            : 1 + Math.sin(animatedProgress.value * 0.3) * 0.003,
        },
      ],
    };
  });

  const handleGoBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* ── Header ───────────────────────────────────────────────── */}
      <Animated.View style={[styles.header, headerEntrance]}>
        <Pressable onPress={handleGoBack}>
          <ChevronLeft strokeWidth={2} color={Brand.textPrimary} />
        </Pressable>
      </Animated.View>

      <Animated.Text style={[styles.title, titleEntrance]}>
        Scanning Library
      </Animated.Text>

      {/* ── Progress ring ────────────────────────────────────────── */}
      <Animated.View style={[styles.ringWrap, ringEntrance]}>
        <View style={styles.glow} pointerEvents="none" />

        {/* Static track (unfilled base circle) */}
        <Svg
          width={RING_SIZE}
          height={RING_SIZE}
          style={StyleSheet.absoluteFill}
        >
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke={Brand.cardBorder}
            strokeWidth={STROKE}
            fill="none"
            opacity={0.45}
          />
        </Svg>

        <Svg
          width={RING_SIZE}
          height={RING_SIZE}
          style={StyleSheet.absoluteFill}
        >
          <Defs>
            <SvgLinearGradient
              id="progressGrad"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <Stop offset="0%" stopColor={Brand.primaryLight} />
              <Stop offset="100%" stopColor={Brand.primaryDark} />
            </SvgLinearGradient>
            <SvgLinearGradient id="sweepGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={Brand.primary} stopOpacity={0} />
              <Stop offset="75%" stopColor={Brand.glow} stopOpacity={0.95} />
              <Stop offset="100%" stopColor="#ffffff" stopOpacity={1} />
            </SvgLinearGradient>
          </Defs>

          {/* Filled progress arc, starts at 12 o'clock, grows clockwise */}
          <AnimatedCircle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke="url(#progressGrad)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${CIRCUMFERENCE}, ${CIRCUMFERENCE}`}
            animatedProps={progressArcProps}
            rotation={-90}
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          />

          {/* Comet highlight riding along the already-filled portion */}
          <AnimatedCircle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke="url(#sweepGrad)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${CIRCUMFERENCE * 0.12}, ${CIRCUMFERENCE}`}
            animatedProps={sweepArcProps}
            rotation={-90}
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          />
        </Svg>

        {/* Center percent label — counts up 0 → target in real time */}
        <Animated.View style={pulseStyle}>
          <Text style={styles.percentText}>{displayPercent}%</Text>
        </Animated.View>
      </Animated.View>

      {/* ── Status copy ──────────────────────────────────────────── */}
      <Animated.Text style={[styles.scanningLabel, scanningLabelEntrance]}>
        Scanning {totalItems.toLocaleString()} items...
      </Animated.Text>
      <Animated.Text
        style={[styles.scanningSubtitle, scanningSubtitleEntrance]}
      >
        This may take a few moments.
      </Animated.Text>

      {/* ── On-device privacy card ───────────────────────────────── */}
      <Animated.View style={[styles.privacyCard, privacyCardEntrance]}>
        <View style={styles.privacyIconWrap}>
          <Image
            source={require("@/assets/icons/shield.png")}
            style={styles.privacyIconImage}
          />
        </View>
        <View style={styles.privacyTextWrap}>
          <Text style={styles.privacyTitle}>100% On-Device</Text>
          <Text style={styles.privacySubtitle}>
            Your photos never leave your iPhone.
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

export default ScanningProgress;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.appBackground,
    paddingHorizontal: Spacing.four,
    alignItems: "center",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.five,
  },
  backChevron: {
    color: Brand.textPrimary,
  },
  title: {
    color: Brand.textPrimary,
    fontSize: FontSizes.title,
    fontWeight: FontWeights.semibold as any,
    marginBottom: Spacing.six,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.five,
  },
  glow: {
    position: "absolute",
    width: RING_SIZE * 1.05,
    height: RING_SIZE * 1.05,
    borderRadius: Radii.full,
    backgroundColor: Brand.primary,
    opacity: 0.16,
    shadowColor: Brand.glow,
    shadowOpacity: 0.6,
    shadowRadius: 36,
    shadowOffset: { width: 0, height: 0 },
  },
  percentText: {
    color: Brand.textPrimary,
    fontSize: 40,
    fontWeight: FontWeights.bold as any,
    letterSpacing: -0.5,
  },
  scanningLabel: {
    color: Brand.textPrimary,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.medium as any,
    marginBottom: Spacing.one,
    textAlign: "center",
  },
  scanningSubtitle: {
    color: Brand.textSecondary,
    fontSize: FontSizes.caption,
    marginBottom: Spacing.six,
    textAlign: "center",
  },
  privacyCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Brand.cardBackground + "20",
    borderWidth: 1,
    borderColor: Brand.cardBorder,
    borderRadius: Radii.xlarge,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    marginTop: "auto",
    marginBottom: Spacing.five,
  },
  privacyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radii.medium,
    backgroundColor: Brand.tileBackground,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.three,
  },
  privacyIcon: {
    fontSize: 18,
  },
  privacyIconImage: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
  privacyTextWrap: {
    flex: 1,
  },
  privacyTitle: {
    color: Brand.textPrimary,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.semibold as any,
    marginBottom: 2,
  },
  privacySubtitle: {
    color: Brand.textSecondary,
    fontSize: FontSizes.caption,
  },
});
