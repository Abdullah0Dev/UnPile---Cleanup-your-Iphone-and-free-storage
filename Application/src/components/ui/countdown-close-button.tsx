// CountdownCloseButton.tsx
import React, { useEffect } from "react";
import { StyleSheet, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import Svg, { Circle, Line, G } from "react-native-svg";
import { Brand } from "@/constants/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedG = Animated.createAnimatedComponent(G);

interface CountdownCloseButtonProps {
  /** total time in ms before the X becomes tappable */
  duration?: number;
  active: boolean; // pass isPresented
  onPress: () => void;
  onComplete: () => void;
}

const SIZE = 32;
const STROKE = 3;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = RADIUS * 2 * Math.PI;
const CENTER = SIZE / 2;

export const CountdownCloseButton: React.FC<CountdownCloseButtonProps> = ({
  duration = 3000,
  active,
  onPress,
  onComplete,
}) => {
  const progress = useSharedValue(0);
  const morph = useSharedValue(0);
  const readyScale = useSharedValue(1);
  const readyRef = useSharedValue(0);
  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    if (!active) return;

    progress.value = 0;
    morph.value = 0;
    readyScale.value = 1;
    readyRef.value = 0;
    setIsReady(false);

    progress.value = withTiming(
      1,
      { duration, easing: Easing.out(Easing.linear) },
      (finished) => {
        if (!finished) return;
        if (onComplete) {
          runOnJS(onComplete)();
        }
        morph.value = withSequence(
          withTiming(1, {
            duration: 320,
            easing: Easing.out(Easing.back(1.4)),
          }),
        );
        readyScale.value = withSequence(
          withTiming(1.18, { duration: 160, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 220, easing: Easing.out(Easing.back(2)) }),
        );
        readyRef.value = withDelay(
          260,
          withTiming(1, { duration: 0 }, (done) => {
            if (done) runOnJS(setIsReady)(true);
          }),
        );
      },
    );
  }, [active, duration, onComplete]);

  const ringProps = useAnimatedProps(() => {
    const offset = CIRCUMFERENCE * (1 - progress.value);
    return {
      strokeDashoffset: offset,
      strokeOpacity: 1 - morph.value,
    };
  });

  const trackProps = useAnimatedProps(() => ({
    strokeOpacity: (1 - morph.value) * 0.35,
  }));

  // NOTE: no more glow blob behind the button — removed entirely

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${-90 + morph.value * 90}deg` },
      { scale: readyScale.value },
    ],
  }));

  // Bigger X — was 0.34 * SIZE, now ~0.55 * SIZE so it reads clearly with no bg
  const xLineLength = SIZE * 0.55;
  const xProps1 = useAnimatedProps(() => {
    const drawn = Math.min(morph.value * 1.6, 1);
    return {
      strokeDasharray: [xLineLength * 2, xLineLength * 2],
      strokeDashoffset: xLineLength * 2 * (1 - drawn),
      opacity: morph.value,
    };
  });
  const xProps2 = useAnimatedProps(() => {
    const drawn = Math.min(Math.max(morph.value - 0.15, 0) * 1.9, 1);
    return {
      strokeDasharray: [xLineLength * 2, xLineLength * 2],
      strokeDashoffset: xLineLength * 2 * (1 - drawn),
      opacity: morph.value,
    };
  });

  const handlePress = () => {
    if (isReady) onPress();
  };

  return (
    <Pressable onPress={handlePress} hitSlop={12} style={styles.wrap}>
      <Animated.View style={containerStyle}>
        <Svg width={SIZE} height={SIZE}>
          <AnimatedCircle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={STROKE}
            fill="none"
            animatedProps={trackProps}
          />
          <AnimatedCircle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            stroke={Brand.primaryLight}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeLinecap="round"
            animatedProps={ringProps}
          />
          <AnimatedG rotation={90} origin={`${CENTER}, ${CENTER}`}>
            <AnimatedLine
              x1={CENTER - xLineLength / 2}
              y1={CENTER - xLineLength / 2}
              x2={CENTER + xLineLength / 2}
              y2={CENTER + xLineLength / 2}
              stroke={Brand.textPrimary}
              strokeWidth={STROKE}
              strokeLinecap="round"
              animatedProps={xProps1}
            />
            <AnimatedLine
              x1={CENTER + xLineLength / 2}
              y1={CENTER - xLineLength / 2}
              x2={CENTER - xLineLength / 2}
              y2={CENTER + xLineLength / 2}
              stroke={Brand.textPrimary}
              strokeWidth={STROKE}
              strokeLinecap="round"
              animatedProps={xProps2}
            />
          </AnimatedG>
        </Svg>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: SIZE + 8,
    height: SIZE + 8,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default CountdownCloseButton;
