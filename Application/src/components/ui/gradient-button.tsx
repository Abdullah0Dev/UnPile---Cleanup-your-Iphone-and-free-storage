import React from "react";
import {
  Text,
  StyleSheet,
  Pressable,
  PressableProps,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Brand, Gradients } from "@/constants/theme";

interface GradientButtonProps extends PressableProps {
  title: string;
  type?: "primary" | "secondary";
  onPress?: () => void;
}

export const GradientButton = ({
  title,
  type = "primary",
  onPress,
  ...rest
}: GradientButtonProps) => {
  // --- Animation values ---
  const scale = useSharedValue(1);
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);

  const handlePress = () => {
    // 1. Bounce scale: quick shrink → spring back
    scale.value = withSequence(
      withTiming(0.94, { duration: 80 }),
      withSpring(1, { damping: 8, stiffness: 180 })
    );

    // 2. Ripple: expand outward and fade
    rippleScale.value = withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(5, { duration: 550, easing: Easing.out(Easing.quad) }),
      withTiming(5, { duration: 0 }) // hold for a frame (clean reset)
    );
    rippleOpacity.value = withSequence(
      withTiming(0.35, { duration: 120 }),
      withTiming(0, { duration: 500 })
    );

    // 3. Call the original press handler
    if (onPress) onPress();
  };

  // --- Animated styles ---
  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }));

  return (
    <Pressable onPress={handlePress} {...rest}>
      <Animated.View style={[styles.buttonContainer, animatedContainerStyle]}>
        <LinearGradient
          colors={
            type === "primary"
              ? Gradients.buttonGradient
              : Gradients.buttonGradientOFF
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.8 }}
          style={styles.gradient}
        >
          {/* Ripple layer (behind text) */}
          <Animated.View style={[styles.ripple, rippleStyle]} />
          <Text style={styles.buttonText}>{title}</Text>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    borderRadius: 20,
    overflow: "hidden", // clips the ripple
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.4,
    shadowRadius: 26,
    elevation: 10,
  },
  gradient: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Brand.cardBorder + "80",
    borderRadius: 20,
    overflow: "hidden", // ensures ripple stays inside
  },
  buttonText: {
    color: Brand.textPrimary,
    fontSize: 17,
    fontWeight: "600",
    zIndex: 2, // above ripple
  },
  ripple: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 20,
    height: 20,
    borderRadius: 10,
    marginLeft: -10,
    marginTop: -10,
    backgroundColor: "#ffffff",
    zIndex: 1,
  },
});