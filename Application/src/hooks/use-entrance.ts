import { useEffect } from "react";
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

/**
 * Shared fade + rise entrance animation, used across every screen for a
 * consistent "cascading" feel. Stagger elements by passing increasing
 * `delay` values (in ms) — e.g. 0, 80, 160, 240...
 */
export function useEntrance(delay: number = 0, distance: number = 14) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(distance);

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

/**
 * Slide-up-as-a-sheet entrance — for bottom bars / footers that should feel
 * like a layer sliding into place from below, not a hero pop or a text rise.
 * Distance defaults large enough to clear typical footer heights.
 */
export function useSheetEntrance(delay: number = 0, distance: number = 60) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(distance);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 320, easing: Easing.out(Easing.ease) }),
    );
    translateY.value = withDelay(
      delay,
      withSpring(0, { damping: 18, stiffness: 160 }),
    );
  }, []);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}

/**
 * Pop-in entrance with a spring overshoot — reserved for the single
 * "hero" element on a screen (logo, badge, icon), not for text rows.
 */
export function useHeroEntrance(delay: number = 0) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.6);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) }),
    );
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 9, stiffness: 140 }),
    );
  }, []);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
}