import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { GradientButton } from "@/components/ui/gradient-button";
import {
  Brand,
  FontSizes,
  FontWeights,
  Radii,
  Spacing,
} from "@/constants/theme";
import { Image, ImageSource } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated from "react-native-reanimated";
import { router } from "expo-router";

import { useEntrance } from "@/hooks/use-entrance";
import { useAnalysis } from "@/context/AnalysisContext";
import { CategoryVariant } from "./CategoryDetails";

// ── Icons ──────────────────────────────────────────────────────────────
const ScreenshotsIcon = require("@/assets/icons/screenshots.png");
const DuplicatesIcon = require("@/assets/icons/duplicates.png");
const BlurryPhotosIcon = require("@/assets/icons/blurry.png");
const LivePhotosIcon = require("@/assets/icons/live-photos.png");
const ClutterIcon = require("@/assets/icons/trash.png"); // ← add this asset

// ── Types ──────────────────────────────────────────────────────────────
type CategoryRowData = {
  key: CategoryVariant;
  label: string;
  itemCount: number;
  sizeBytes: number;
  image: ImageSource;
};

const ROW_STAGGER_MS = 70;

// ── Helper: format bytes ──────────────────────────────────────────
function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
export function CategoriesList({
  categoryRows,
  marginTop = false,
}: {
  categoryRows: CategoryRowData[];
  marginTop?: boolean;
}) {
  const [containerHeight, setContainerHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  // Enable scrolling only if content overflows
  const isScrollable = contentHeight > containerHeight;
  return (
    <Animated.ScrollView
      contentContainerStyle={[styles.categoryList, marginTop && { marginTop: Spacing.three}]}
      style={marginTop ?{ width: "100%" }: {}}
      scrollEnabled={isScrollable} // disable when not needed
      bounces={false} // no bounce on iOS
      showsVerticalScrollIndicator={false} // cleaner UI
      onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
      onContentSizeChange={(w, h) => setContentHeight(h)}
    >
      {categoryRows.map(
        ({ key, label, itemCount, sizeBytes, image }, index) => (
          <CategoryRow
            id={key}
            key={key}
            label={label}
            itemCount={itemCount}
            sizeBytes={sizeBytes}
            image={image}
            delay={220 + index * ROW_STAGGER_MS}
          />
        ),
      )}
    </Animated.ScrollView>
  );
}
// ── Home Screen ──────────────────────────────────────────────────────
const Home = () => {
  const headerEntrance = useEntrance(0);
  const titleEntrance = useEntrance(60);
  const statCardEntrance = useEntrance(140);
  const sectionHeaderEntrance = useEntrance(220);
  const ctaEntrance = useEntrance(140 + 5 * ROW_STAGGER_MS + 160);

  const { result, clearResult } = useAnalysis();

  // If no result, redirect to get started
  if (!result) {
    router.replace("/");
    return null;
  }

  // ── Compute category stats ──────────────────────────────────────────
  const categories = useMemo(() => {
    const screenshotCandidates = result.screenshotCandidates || [];
    const duplicateIds = result.duplicateGroups.flatMap(
      (g) => g.duplicateAssetIds,
    );
    const blurryCount = result.blurry?.length || 0;
    const liveCandidateCount = result.livePhotoCandidates?.length || 0;
    const clutterCount = result.clutter?.length || 0;

    const totalFreeableItems =
      screenshotCandidates.length +
      duplicateIds.length +
      blurryCount +
      liveCandidateCount +
      clutterCount;

    const totalFreeableBytes = result.totalSavingsBytes || 0;
    const categorySavings = result.categorySavings || {};

    return {
      screenshotCandidates: screenshotCandidates.length,
      duplicateCount: duplicateIds.length,
      blurryCount,
      liveCandidateCount,
      clutterCount,
      totalFreeableItems,
      totalFreeableBytes,
      categorySavings,
    };
  }, [result]);

  const {
    screenshotCandidates,
    duplicateCount,
    blurryCount,
    liveCandidateCount,
    clutterCount,
    totalFreeableItems,
    totalFreeableBytes,
    categorySavings,
  } = categories;

  // Category rows (including Clutter)
  const mainCategoryRows: CategoryRowData[] = [
    {
      key: "screenshots",
      label: "Screenshots",
      itemCount: screenshotCandidates,
      sizeBytes: categorySavings.screenshots || 0,
      image: ScreenshotsIcon,
    },
    {
      key: "clutter",
      label: "Clutter",
      itemCount: clutterCount,
      sizeBytes: categorySavings.clutter || 0,
      image: ClutterIcon,
    },
    {
      key: "duplicates",
      label: "Duplicates",
      itemCount: duplicateCount,
      sizeBytes: categorySavings.duplicates || 0,
      image: DuplicatesIcon,
    },
    {
      key: "blurry",
      label: "Blurry Photos",
      itemCount: blurryCount,
      sizeBytes: categorySavings.blurry || 0,
      image: BlurryPhotosIcon,
    },
    {
      key: "live",
      label: "Live Photos",
      itemCount: liveCandidateCount,
      sizeBytes: categorySavings.livePhotos || 0,
      image: LivePhotosIcon,
    },
  ];
  const categoryRows = mainCategoryRows.filter(
    (category) => category.itemCount > 0,
  );

  const handleGoBack = async () => {
    await clearResult();
    router.dismissAll();
    router.replace("/");
  };
  const handleReviewItems = () => router.push("/delete-confirmation");
  const handleSeeAllCategories = () => router.push("/all-categories");

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
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
        Scan Complete ✨
      </Animated.Text>

      {/* Stat Card */}
      <Animated.View style={[styles.statCard, statCardEntrance]}>
        <LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.8 }}
          colors={[
            "rgba(108, 60, 224, 0)",
            "rgba(108, 60, 224, 0.08)",
            "rgba(108, 60, 224, 0.25)",
            "rgba(108, 60, 224, 0.08)",
            "rgba(108, 60, 224, 0)",
          ]}
          locations={[0, 0.3, 0.5, 0.7, 1]}
          style={styles.statCardGradient}
        />
        <Text style={styles.statLabel}>You can free up</Text>
        <Text style={styles.statValue}>{formatBytes(totalFreeableBytes)}</Text>
        <Text style={styles.statSubtitle}>
          {totalFreeableItems.toLocaleString()} items
        </Text>
      </Animated.View>

      {/* Categories Header */}
      <Animated.View style={[styles.sectionHeader, sectionHeaderEntrance]}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <Pressable onPress={handleSeeAllCategories}>
          <Text style={styles.seeAllButton}>See All</Text>
        </Pressable>
      </Animated.View>

      {/* Category List */}
      <CategoriesList categoryRows={categoryRows} />

      {/* CTA */}
      <Animated.View style={[styles.ctaWrap, ctaEntrance]}>
        <GradientButton title="Review Items" onPress={handleReviewItems} />
      </Animated.View>
    </SafeAreaView>
  );
};

export default Home;

// ── Category Row Component ─────────────────────────────────────────
export const CategoryRow = ({
  id,
  label,
  itemCount,
  sizeBytes,
  image,
  delay,
}: {
  id: CategoryVariant;
  label: string;
  itemCount: number;
  sizeBytes: number;
  image: ImageSource;
  delay: number;
}) => {
  const rowEntrance = useEntrance(delay, 10);

  const handlePress = () => {
    //     console.log(`/category-details/${id}`);

    // return;
    router.navigate(`/category-details/${id}`);
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[styles.categoryRow, rowEntrance]}>
        <View style={styles.categoryIconWrap}>
          <Image style={{ width: 32, height: 32 }} source={image} />
        </View>
        <View style={styles.categoryTextWrap}>
          <Text style={styles.categoryLabel}>{label}</Text>
          <Text style={styles.categoryCount}>{itemCount} items</Text>
        </View>
        <Text style={styles.categorySize}>{formatBytes(sizeBytes)}</Text>
      </Animated.View>
    </Pressable>
  );
};

// ── Styles (unchanged) ─────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.appBackground,
    paddingHorizontal: Spacing.three,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.four,
  },
  title: {
    color: Brand.textPrimary,
    fontSize: FontSizes.title,
    fontWeight: FontWeights.semibold as any,
    marginBottom: Spacing.four,
    alignSelf: "center",
  },
  statCard: {
    borderWidth: 1,
    borderColor: Brand.cardBorder,
    borderRadius: Radii.xlarge,
    paddingVertical: Spacing.four,
    alignItems: "center",
    marginBottom: Spacing.four,
    overflow: "hidden",
  },
  statCardGradient: {
    height: "160%",
    width: "100%",
    borderBottomEndRadius: 50,
    borderBottomStartRadius: 50,
    position: "absolute",
    top: 0,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: "hidden",
    opacity: 0.9,
  },
  statLabel: {
    color: Brand.textSecondary,
    fontSize: FontSizes.caption,
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
    fontSize: FontSizes.caption,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.one,
    marginBottom: Spacing.three,
    marginTop: Spacing.three,
  },
  sectionTitle: {
    color: Brand.textPrimary,
    fontSize: FontSizes.title,
    fontWeight: FontWeights.semibold as any,
  },
  seeAllButton: {
    color: Brand.primary,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.medium as any,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  categoryList: {
    marginBottom: Spacing.five,
    overflow: "hidden",
    gap: 6,
    width: "100%",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    backgroundColor: `#12112860`,
    borderWidth: 1,
    borderColor: Brand.cardBorder,
    borderRadius: Radii.large,
  },
  categoryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radii.medium,
    backgroundColor: Brand.tileBackgroundAlt,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.three,
  },
  categoryTextWrap: {
    flex: 1,
  },
  categoryLabel: {
    color: Brand.textPrimary,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.medium as any,
    marginBottom: 2,
  },
  categoryCount: {
    color: Brand.textSecondary,
    fontSize: FontSizes.caption,
  },
  categorySize: {
    color: Brand.textPrimary,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.medium as any,
  },
  ctaWrap: {
    marginTop: "auto",
    marginBottom: Spacing.five,
  },
});
