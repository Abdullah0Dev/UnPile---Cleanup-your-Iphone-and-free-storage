import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { Text, StyleSheet, Pressable, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next"; // use the same import you already use
import { Brand, FontSizes } from "@/constants/theme";
import { X } from "lucide-react-native";

const HIDDEN_Y = -140;
const TOP_OFFSET = 52;

export const TipToast = memo(
  ({
    visible,
    onHide,
    duration = 6500,
    delay = 3000,
  }: {
    visible: boolean;
    onHide: () => void;
    duration?: number;
    delay?: number;
  }) => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const translateY = useSharedValue(HIDDEN_Y);
    const opacity = useSharedValue(0);

    // Always call the latest onHide without making `hide` change identity
    const onHideRef = useRef(onHide);
    useEffect(() => {
      onHideRef.current = onHide;
    }, [onHide]);

    const notifyHidden = useCallback(() => {
      onHideRef.current();
    }, []);

    const hide = useCallback(() => {
      translateY.value = withTiming(HIDDEN_Y, { duration: 250 });
      opacity.value = withTiming(0, { duration: 250 }, (finished) => {
        if (finished) runOnJS(notifyHidden)();
      });
    }, [notifyHidden, opacity, translateY]);

    useEffect(() => {
      if (!visible) return;

      let hideTimer: ReturnType<typeof setTimeout> | undefined;

      const showTimer = setTimeout(() => {
        translateY.value = withSpring(0, { damping: 14, stiffness: 140 });
        opacity.value = withTiming(1, { duration: 200 });

        // the visible time starts after the delay
        hideTimer = setTimeout(hide, duration);
      }, delay);

      return () => {
        clearTimeout(showTimer);
        if (hideTimer) clearTimeout(hideTimer);
      };
    }, [visible, duration, delay, hide, opacity, translateY]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    }));

    // Stable style array, only rebuilt when the inset changes
    const wrapStyle = useMemo(
      () => [styles.wrap, { top: insets.top + TOP_OFFSET }],
      [insets.top],
    );

    if (!visible) return null;

    return (
      <Animated.View
        style={[wrapStyle, animatedStyle]}
        pointerEvents="box-none"
      >
        <Pressable onPress={hide} style={styles.toast}>
          <Text style={styles.emoji}>💡</Text>
          <View style={styles.textWrap}>
            <Text style={styles.title}>{t("review_screen.tip.title")}</Text>
            <Text style={styles.message}>
              {t("review_screen.tip.long_press")}
            </Text>
          </View>
          <X size={18} color={Brand.textPrimary} />
        </Pressable>
      </Animated.View>
    );
  },
);

TipToast.displayName = "TipToast";

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 100,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: Brand.primary, // swap for your card/surface colour
    borderWidth: 1,
    borderColor: Brand.cardBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  emoji: { fontSize: 20 },
  textWrap: { flex: 1 },
  title: {
    color: Brand.textPrimary,
    fontSize: FontSizes.headline,
    fontWeight: "700",
  },
  message: {
    color: Brand.textPrimary,
    fontSize: FontSizes.body,
    marginTop: 2,
  },
});
