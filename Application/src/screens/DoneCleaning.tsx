import { Image } from "expo-image";
import { useEffect } from "react";
import { StyleSheet, View, Text } from "react-native";
import { Trans, useTranslation } from "react-i18next";
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
  currentCredits?: number;
  remainingItems?: number;
  onViewLibrary?: () => void;
  onDone?: () => void;
  onUpgradePress?: () => void;
};

// Small helper: fade + rise entrance, staggered by `delay`.
function useEntrance(delay: number) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration: 420,
        easing: Easing.out(Easing.cubic),
      }),
    );

    translateY.value = withDelay(
      delay,
      withSpring(0, {
        damping: 14,
        stiffness: 120,
      }),
    );
  }, []);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}

// Helper: format bytes to appropriate unit
function formatBytes(bytes: number): {
  value: number;
  unit: string;
} {
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
  const { t } = useTranslation();

  // Pop in with a spring overshoot
  const badgeScale = useSharedValue(0.4);
  const badgeOpacity = useSharedValue(0);

  const { credits: currentCredits, isSubscribed } = useCredits();

  // Ambient glow
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.85);

  useEffect(() => {
    badgeOpacity.value = withTiming(1, {
      duration: 260,
      easing: Easing.out(Easing.ease),
    });

    badgeScale.value = withSequence(
      withTiming(1.12, {
        duration: 340,
        easing: Easing.out(Easing.cubic),
      }),
      withSpring(1, {
        damping: 8,
        stiffness: 160,
      }),
    );

    glowOpacity.value = withDelay(
      100,
      withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.ease),
      }),
    );

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

  // Staggered entrance
  const titleEntrance = useEntrance(220);
  const statLabelEntrance = useEntrance(300);
  const statValueEntrance = useEntrance(360);
  const statSubtitleEntrance = useEntrance(420);
  const buttonsEntrance = useEntrance(520);

  // Format freed-up bytes
  const { value: formattedValue, unit } = formatBytes(freedUpBytes);

  const displayValue = formattedValue.toFixed(1);
  const displayUnit = unit;

  // Show upgrade prompt when credits are exhausted
  const shouldShowUpgrade = isSubscribed
    ? false
    : currentCredits === 0 && remainingItems > 0;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        {/* Glowing done badge */}
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
          {t("success_screen.title")}
        </Animated.Text>

        <Animated.Text style={[styles.statLabel, statLabelEntrance]}>
          {t("success_screen.subtitle")}
        </Animated.Text>

        <Animated.Text style={[styles.statValue, statValueEntrance]}>
          {displayValue} {displayUnit}
        </Animated.Text>

        <Animated.Text style={[styles.statSubtitle, statSubtitleEntrance]}>
          {t("success_screen.details.items_deleted", {
            count: itemsDeleted.toLocaleString(),
          })}
        </Animated.Text>

        {!isSubscribed && (
          <GradientText
            onPress={onUpgradePress}
            colors={Gradients.primaryButton}
            end={{ x: 0.2, y: 0.5 }}
            style={{
              fontSize: FontSizes.body,
              fontWeight: 500,
            }}
          >
            {t("success_screen.details.credits_left", {
              count: currentCredits.toLocaleString(),
            })}
          </GradientText>
        )}

        {shouldShowUpgrade && (
          <Animated.View
            style={[
              statSubtitleEntrance,
              {
                marginTop: Spacing.three,
              },
            ]}
          >
            <GradientText
              onPress={onUpgradePress}
              colors={Gradients.primaryButton}
              end={{ x: 0.5, y: 0.5 }}
              style={{
                fontSize: FontSizes.body,
                fontWeight: 500,
                textDecorationLine: "underline",
                textAlign: "center",
              }}
            >
              <Trans
                i18nKey="success_screen.upgrade_prompt"
                values={{
                  count: remainingItems.toLocaleString(),
                }}
                components={{
                  count: (
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "700",
                      }}
                    />
                  ),
                }}
              />
            </GradientText>
          </Animated.View>
        )}
      </View>

      <Animated.View style={[styles.buttonGroup, buttonsEntrance]}>
        <GradientButton
          title={
            shouldShowUpgrade
              ? t("delete_confirmation_dialog.buttons.unlock_unlimited")
              : t("success_screen.buttons.view_library")
          }
          type={"primary"}
          onPress={shouldShowUpgrade ? onUpgradePress : onViewLibrary}
        />
        <GradientButton
          title={t("success_screen.buttons.done")}
          type={"secondary"}
          onPress={onDone}
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
    shadowOffset: {
      width: 0,
      height: 0,
    },
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
