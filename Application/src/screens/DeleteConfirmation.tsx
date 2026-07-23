import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import Animated from "react-native-reanimated";
import { router, useLocalSearchParams } from "expo-router";

import {
  Brand,
  FontSizes,
  FontWeights,
  Radii,
  Spacing,
} from "@/constants/theme";
import { GradientButton } from "@/components/ui/gradient-button";
import { CATEGORIES, CategoriesList } from "./Home";
import { useEntrance, useHeroEntrance } from "@/hooks/use-entrance";
import { CategoryVariant } from "./CategoryDetails";

// ─────────────────────────────────────────────────────────────────────────
// Params contract for this screen. All optional/string because router
// params always arrive as strings — coerce on read, never assume shape.
//
// Two call sites:
//   1. From a single CategoryDetails screen ("Delete" on Screenshots, etc.)
//      → variant, label, itemCount, totalSize are all provided.
//   2. From "Smart Delete" / "Delete Everything" on Home or AllCategories
//      → no params at all, falls back to the full multi-category breakdown.
// ─────────────────────────────────────────────────────────────────────────

type DeleteConfirmationParams = {
  variant?: CategoryVariant;
  label?: string;
  itemCount?: string;
  totalSize?: string;
};

const ROW_STAGGER_MS = 70;

const DeleteConfirmation = () => {
  const params = useLocalSearchParams<DeleteConfirmationParams>();

  // A single-category delete is any navigation that included a `variant`.
  const isSingleCategory = Boolean(params.variant);

  const resolvedLabel = params.label ?? "everything";
  const resolvedItemCount = params.itemCount
    ? Number(params.itemCount)
    : CATEGORIES.reduce((sum, c) => sum + c.itemCount, 0);
  const resolvedTotalSize = params.totalSize;

  const iconEntrance = useHeroEntrance(0);
  const titleEntrance = useEntrance(160);
  const subtitleEntrance = useEntrance(220);
  const listBaseDelay = 320;

  // When showing the full list, the button group waits for every row to
  // stagger in first. Single-category mode has no row list, so it can
  // arrive right after the subtitle.
  const buttonsEntrance = useEntrance(
    isSingleCategory
      ? 320
      : listBaseDelay + CATEGORIES.length * ROW_STAGGER_MS + 140,
  );

  const handleDelete = () => {
    // TODO: wire up real deletion logic per variant vs. full library.
    router.push("/done");
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <Animated.View style={iconEntrance}>
          <Image
            source={require("@/assets/icons/trash.png")}
            contentFit="contain"
            style={styles.logoImage}
          />
        </Animated.View>

        <Animated.View style={[styles.logoTextContainer, titleEntrance]}>
          <Text style={styles.logoText}>
            Delete {resolvedItemCount.toLocaleString()} item
            {resolvedItemCount === 1 ? "" : "s"}?
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.subtitleContainer,
            { gap: 4, marginTop: 10 },
            subtitleEntrance,
          ]}
        >
          <Text style={styles.logoSubtitle}>
            This action cannot be undone.
          </Text>
        </Animated.View>

        {/* ── Single category: one focused summary row ──────────────── */}
        {isSingleCategory ? (
          <Animated.View
            style={[styles.singleCategoryCard, useEntrance(listBaseDelay, 10)]}
          >
            <Text style={styles.singleCategoryLabel}>{resolvedLabel}</Text>
            <View style={styles.singleCategoryStatsRow}>
              <Text style={styles.singleCategoryCount}>
                {resolvedItemCount.toLocaleString()} items
              </Text>
              {resolvedTotalSize ? (
                <Text style={styles.singleCategorySize}>
                  {resolvedTotalSize}
                </Text>
              ) : null}
            </View>
          </Animated.View>
        ) : (
          /* ── Full library delete: every category breaks down ────────
             Assumes `CategoriesList` accepts `marginTop`; adjust the prop
             name here if your actual component signature differs. */
          <CategoriesList marginTop />
        )}
      </View>

      <Animated.View style={[styles.buttonGroup, buttonsEntrance]}>
        <GradientButton
          title={isSingleCategory ? "Delete" : "Delete Everything"}
          onPress={handleDelete}
        />
        <GradientButton title="Cancel" type="secondary" onPress={handleCancel} />
      </Animated.View>
    </SafeAreaView>
  );
};

export default DeleteConfirmation;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.appBackground,
    paddingHorizontal: Spacing.four,
  },
  logoImage: {
    width: 200,
    height: 200,
    alignSelf: "center",
  },
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    display: "flex",
  },
  subtitleContainer: {
    alignItems: "center",
  },
  logoTextContainer: {
    alignItems: "center",
    justifyContent: "center",
    display: "flex",
    flexDirection: "row",
  },
  logoText: {
    marginTop: Spacing.two,
    color: Brand.textPrimary,
    fontSize: FontSizes.title,
    fontWeight: "800",
  },
  logoSubtitle: {
    color: Brand.textPrimary,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.regular,
    opacity: 0.8,
  },

  // Single-category summary card
  singleCategoryCard: {
    width: "100%",
    marginTop: Spacing.five,
    backgroundColor: `#12112860`,
    borderWidth: 1,
    borderColor: Brand.cardBorder,
    borderRadius: Radii.large,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  singleCategoryLabel: {
    color: Brand.textPrimary,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.semibold as any,
    marginBottom: Spacing.one,
  },
  singleCategoryStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  singleCategoryCount: {
    color: Brand.textSecondary,
    fontSize: FontSizes.caption,
  },
  singleCategorySize: {
    color: Brand.textPrimary,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.medium as any,
  },

  buttonGroup: {
    gap: Spacing.two + Spacing.half,
    marginBottom: Spacing.five,
  },
});