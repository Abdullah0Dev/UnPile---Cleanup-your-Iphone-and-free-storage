import {
  Brand,
  FontSizes,
  FontWeights,
  Radii,
  Spacing,
} from "@/constants/theme";
import { useEntrance, useHeroEntrance } from "@/hooks/use-entrance";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Defs,
  Stop,
  LinearGradient as SvgLinearGradient,
} from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RING_SIZE = 210;
const STROKE = 10;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type ScanningProgressProps = {
  /** Dynamic progress 0–100, updated from native events */
  progress?: number;
  /** Total items being scanned (optional) */
  totalItems?: number;
  categoryProgress?: string;
};

const ScanningProgress = ({
  progress = 0,
  totalItems = 0,
  categoryProgress = "Scanning Library",
}: ScanningProgressProps) => {
  //  Screen entrance
  const headerEntrance = useEntrance(0);
  const titleEntrance = useEntrance(60);
  const ringEntrance = useHeroEntrance(140);
  const scanningLabelEntrance = useEntrance(360);
  const scanningSubtitleEntrance = useEntrance(420);
  const privacyCardEntrance = useEntrance(500);

  //  Comet sweep (always running)
  const sweepProgress = useSharedValue(0);

  useEffect(() => {
    sweepProgress.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  //  Animated progress (smoothly follows the `progress` prop)
  const animatedProgress = useSharedValue(0);
  const [displayPercent, setDisplayPercent] = useState(0);

  // React to prop changes: animate to new value smoothly
  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  // Mirror the rounded value to JS state for the <Text>
  useAnimatedReaction(
    () => Math.round(animatedProgress.value),
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setDisplayPercent)(current);
      }
    },
  );

  // Progress arc dash offset
  const progressDashOffset = useDerivedValue(
    () => CIRCUMFERENCE - (CIRCUMFERENCE * animatedProgress.value) / 100,
  );
  const progressArcProps = useAnimatedProps(() => ({
    strokeDashoffset: progressDashOffset.value,
  }));

  // Comet highlight
  const sweepDashOffset = useDerivedValue(
    () => -sweepProgress.value * CIRCUMFERENCE,
  );
  const sweepArcProps = useAnimatedProps(() => ({
    strokeDashoffset: sweepDashOffset.value,
  }));

  // Subtle pulse on the percent label
  const pulseStyle = useAnimatedStyle(() => {
    const isDone = animatedProgress.value >= 99.9;
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
      {/*  Header  */}
      <Animated.View style={[styles.header, headerEntrance]}>
        <Pressable onPress={handleGoBack}>
          <Image
            source={require("@/assets/icons/back-arrow.png")}
            alt="back arrow"
            style={{ width: 28, height: 28 }}
          />
        </Pressable>
      </Animated.View>

      <Animated.Text style={[styles.title, titleEntrance]}>
        Scanning Library
      </Animated.Text>

      {/*  Progress ring  */}
      <Animated.View style={[styles.ringWrap, ringEntrance]}>
        <View style={styles.glow} pointerEvents="none" />

        {/* Static track */}
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

          {/* Filled progress arc */}
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

          {/* Comet highlight */}
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

        {/* Center percent label */}
        <Animated.View style={pulseStyle}>
          <Text style={styles.percentText}>{displayPercent}%</Text>
        </Animated.View>
      </Animated.View>

      {/*  Status copy  */}
      <Animated.Text style={[styles.scanningLabel, scanningLabelEntrance]}>
        {totalItems > 0
          ? `Scanning ${totalItems.toLocaleString()} items...`
          : categoryProgress}
      </Animated.Text>
      <Animated.Text
        style={[styles.scanningSubtitle, scanningSubtitleEntrance]}
      >
        This may take a few moments.
      </Animated.Text>

      {/*  On-device privacy card  */}
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
    paddingHorizontal: Spacing.three,
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
