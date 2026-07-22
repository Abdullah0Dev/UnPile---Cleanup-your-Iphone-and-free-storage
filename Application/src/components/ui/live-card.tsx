import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, {
  Circle,
  Defs,
  Filter,
  FeGaussianBlur,
  LinearGradient as SvgLinearGradient,
  Path,
  Stop,
} from "react-native-svg";
import Animated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RING_SIZE = 148;
const STROKE = 12;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const ACTIVE_A = "#22d3ee";
const ACTIVE_B = "#3b82f6";
const INACTIVE_A = "#4b5563";
const INACTIVE_B = "#374151";

// ── The dynamic protection ring with rich animations ─────────────────────
function ProtectionRing({ isActive }: { isActive: boolean }) {
  // --- Continuous animations (always running) ---
  const spin = useSharedValue(0); // main ring rotation
  const highlightProgress = useSharedValue(0); // for dash offset movement

  useEffect(() => {
    spin.value = withRepeat(
      withTiming(360, { duration: 6000, easing: Easing.linear }),
      -1,
      false,
    );
    // The highlight moves along the dash pattern (a seamless sweep)
    highlightProgress.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  // Spring‑based reactive values (triggered by isActive)
  const ringScale = useSharedValue(1);
  const rippleScale = useSharedValue(1);
  const rippleOpacity = useSharedValue(0);
  const shieldScale = useSharedValue(1);
  const shieldRotate = useSharedValue(0);
  const glowRadius = useSharedValue(RING_SIZE * 0.42);
  const glowPulse = useSharedValue(0);

  useEffect(() => {
    // Pop the whole ring on state change
    ringScale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withSpring(1, { damping: 8, stiffness: 150 }),
    );
    // Expanding ripple
    rippleScale.value = withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(2.5, { duration: 700, easing: Easing.out(Easing.ease) }),
      withTiming(2.5, { duration: 0 }),
    );
    rippleOpacity.value = withSequence(
      withTiming(0.5, { duration: 200 }),
      withTiming(0, { duration: 700 }),
    );
    // Shield springs to life
    shieldScale.value = withSpring(isActive ? 1.15 : 1, {
      damping: 6,
      stiffness: 200,
    });
    shieldRotate.value = withSpring(isActive ? 0 : 25, {
      damping: 6,
      stiffness: 200,
    });
    // Glow expands when active
    glowRadius.value = withSpring(
      isActive ? RING_SIZE * 0.5 : RING_SIZE * 0.42,
      { damping: 10, stiffness: 120 },
    );
    // Subtle continuous glow pulse while active
    if (isActive) {
      glowPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    } else {
      glowPulse.value = 0;
    }
  }, [isActive]);

  // --- Derived animated styles & props ---
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }, { scale: ringScale.value }],
  }));

  // Ripple ring (expands outward from center)
  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }));

  // Shield pop & slight rotation
  const shieldStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: shieldScale.value },
      { rotate: `${shieldRotate.value}deg` },
    ],
    opacity: 0.5 + (isActive ? 0.5 : 0.3), // dimmer when inactive
  }));

  // Highlight moving dash offset
  const highlightDashOffset = useDerivedValue(() =>
    interpolate(highlightProgress.value, [0, 1], [0, -CIRCUMFERENCE]),
  );
  const highlightArcProps = useAnimatedProps(() => ({
    strokeDashoffset: highlightDashOffset.value,
  }));

  // Animated blur glow
  const glowProps = useAnimatedProps(() => ({
    r: glowRadius.value,
    opacity: 0.3 + glowPulse.value * 0.2 * (isActive ? 1 : 0.3),
  }));

  const colorA = isActive ? ACTIVE_A : INACTIVE_A;
  const colorB = isActive ? ACTIVE_B : INACTIVE_B;

  return (
    <Animated.View style={styles.ringWrap}>
      {/* ── Expanding ripple (behind everything) ── */}
      <Animated.View style={[styles.rippleContainer, rippleStyle]}>
        <Svg
          width={RING_SIZE}
          height={RING_SIZE}
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        >
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke={colorA}
            strokeWidth={STROKE * 0.4}
            fill="none"
            opacity={0.3}
          />
        </Svg>
      </Animated.View>

      {/* ── Soft blur glow ── */}
      <Svg width={RING_SIZE * 2.2} height={RING_SIZE * 2.2}>
        <Defs>
          <Filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
            <FeGaussianBlur in="SourceGraphic" stdDeviation="16" />
          </Filter>
          <SvgLinearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colorA} stopOpacity={0.9} />
            <Stop offset="100%" stopColor={colorB} stopOpacity={0.9} />
          </SvgLinearGradient>
        </Defs>
        <AnimatedCircle
          cx={RING_SIZE * 1.1}
          cy={RING_SIZE * 1.1}
          fill="url(#glowGrad)"
          filter="url(#blur)"
          animatedProps={glowProps}
        />
      </Svg>

      {/* ── Base thick ring (rotates slowly) ── */}
      <Animated.View style={[styles.ringLayer, ringStyle]}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Defs>
            <SvgLinearGradient
              id="baseGrad"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <Stop offset="0%" stopColor={colorA} stopOpacity={0.35} />
              <Stop offset="100%" stopColor={colorB} stopOpacity={0.35} />
            </SvgLinearGradient>
          </Defs>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke="url(#baseGrad)"
            strokeWidth={STROKE}
            fill="none"
          />
        </Svg>
      </Animated.View>

      {/* ── Bright comet arc (rotates + dash moves) ── */}
      <Animated.View style={[styles.ringLayer, ringStyle]}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Defs>
            <SvgLinearGradient
              id="highlightGrad"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <Stop offset="0%" stopColor={colorB} stopOpacity={0} />
              <Stop offset="70%" stopColor={colorA} stopOpacity={0.9} />
              <Stop offset="100%" stopColor="#ffffff" stopOpacity={1} />
            </SvgLinearGradient>
          </Defs>
          <AnimatedCircle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke="url(#highlightGrad)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${CIRCUMFERENCE * 0.22}, ${CIRCUMFERENCE}`}
            animatedProps={highlightArcProps}
          />
        </Svg>
      </Animated.View>

      {/* ── Shield with metallic gradient + spring pop ── */}
      <Animated.View style={[styles.shieldCenter, shieldStyle]}>
        <Svg width={46} height={52} viewBox="0 0 46 52">
          <Defs>
            <SvgLinearGradient
              id="shieldGrad"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <Stop offset="0%" stopColor="#f4f4f5" />
              <Stop offset="45%" stopColor="#a1a1aa" />
              <Stop offset="100%" stopColor="#52525b" />
            </SvgLinearGradient>
          </Defs>
          <Path
            d="M23 2 L42 9 V24 C42 36 34 45 23 50 C12 45 4 36 4 24 V9 Z"
            fill="url(#shieldGrad)"
            stroke="#d4d4d8"
            strokeWidth={0.5}
          />
          <Path
            d="M15 25.5 L20.5 31 L31.5 19"
            stroke="#1f2937"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={isActive ? 1 : 0.35}
          />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}
const LiveProtectionCard = () => {
  const [isActive, setIsActive] = useState(true);

  const buttonScale = useSharedValue(1);
  const buttonRippleScale = useSharedValue(0);
  const buttonRippleOpacity = useSharedValue(0);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  // Button ripple (expanding circle)
  const buttonRippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonRippleScale.value }],
    opacity: buttonRippleOpacity.value,
  }));

  const handleToggle = () => {
    // Button press bounce
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 90 }),
      withSpring(1, { damping: 6, stiffness: 200 }),
    );
    // Ripple from center of button
    buttonRippleScale.value = withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(5, { duration: 500, easing: Easing.out(Easing.ease) }),
      withTiming(5, { duration: 0 }),
    );
    buttonRippleOpacity.value = withSequence(
      withTiming(0.4, { duration: 150 }),
      withTiming(0, { duration: 500 }),
    );
    setIsActive((prev) => !prev);
    // funcionlity goes here
    
  };

  return (
    <Animated.View style={styles.card}>
      <Animated.Text style={styles.cardTitle}>Live Protection</Animated.Text>

      <ProtectionRing isActive={isActive} />

      <Animated.Text
        style={[styles.percent, { transform: [{ scale: isActive ? 1 : 0.8 }] }]}
      >
        {isActive ? "100%" : "0%"}
      </Animated.Text>
      <Animated.Text style={styles.subtitle}>
        {isActive
          ? "On‑device · nothing leaves your phone"
          : "Protection is currently paused"}
      </Animated.Text>

      <Pressable onPress={handleToggle}>
        <Animated.View style={buttonAnimatedStyle}>
          {/* Ripple behind the button */}
          <Animated.View style={[styles.buttonRipple, buttonRippleStyle]} />
          <LinearGradient
            colors={isActive ? ["#3b82f6", "#22d3ee"] : ["#3f3f46", "#52525b"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Animated.Text style={styles.buttonText}>
              {isActive ? "Protection Active" : "Activate Protection"}
            </Animated.Text>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

export default LiveProtectionCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#151824",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.4,
    shadowRadius: 26,
    elevation: 10,
  },
  cardTitle: {
    color: "#a1a1aa",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 18,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  rippleContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  ringLayer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  shieldCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  percent: {
    color: "#ffffff",
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "#a1a1aa",
    fontSize: 16,
    marginTop: 4,
    marginBottom: 22,
    maxWidth: 252,
    textAlign: "center",
  },
  button: {
    borderRadius: 999,
    paddingVertical: 13,
    paddingHorizontal: 40,
    alignItems: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
    overflow: "hidden", // so the ripple stays inside
  },
  buttonRipple: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    transform: [{ translateX: -10 }, { translateY: -10 }],
    zIndex: 0,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    zIndex: 1,
  },
  sectionLabel: {
    color: "#71717a",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
  },
});
