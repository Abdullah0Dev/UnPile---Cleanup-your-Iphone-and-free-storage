import React, { useMemo } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Image, ImageSource } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles } from "lucide-react-native";
import Animated from "react-native-reanimated";

import { GradientButton } from "@/components/ui/gradient-button";
import {
  Brand,
  FontSizes,
  FontWeights,
  Radii,
  Spacing,
} from "@/constants/theme";
import { useEntrance } from "@/hooks/use-entrance";
import { router } from "expo-router";
import { useAnalysis } from "@/context/AnalysisContext";
import { CategoryVariant } from "./CategoryDetails";

// Category icons
const ScreenshotsIcon = require("@/assets/icons/screenshots.png");
const DuplicatesIcon = require("@/assets/icons/duplicates.png");
const BlurryPhotosIcon = require("@/assets/icons/blurry.png");
const LivePhotosIcon = require("@/assets/icons/live-photos.png");
const ClutterIcon = require("@/assets/icons/trash.png");

// Helper: format bytes
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

const TILE_STAGGER_MS = 80;
const GRID_BASE_DELAY = 140;

const AllCategories = () => {
  const headerEntrance = useEntrance(0);
  const { result } = useAnalysis();

  // If no result, redirect to get started
  if (!result) {
    router.replace("/");
    return null;
  }

  // ── Compute category data ──────────────────────────────────────────
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

    const rows = [
      {
        key: "screenshots" as CategoryVariant,
        label: "Screenshots",
        itemCount: screenshotCandidates.length,
        sizeBytes: categorySavings.screenshots || 0,
        image: ScreenshotsIcon,
      },
      {
        key: "clutter" as CategoryVariant,
        label: "Clutter",
        itemCount: clutterCount,
        sizeBytes: categorySavings.clutter || 0,
        image: ClutterIcon,
      },
      {
        key: "duplicates" as CategoryVariant,
        label: "Duplicates",
        itemCount: duplicateIds.length,
        sizeBytes: categorySavings.duplicates || 0,
        image: DuplicatesIcon,
      },
      {
        key: "blurry" as CategoryVariant,
        label: "Blurry Photos",
        itemCount: blurryCount,
        sizeBytes: categorySavings.blurry || 0,
        image: BlurryPhotosIcon,
      },
      {
        key: "live" as CategoryVariant,
        label: "Live Photos",
        itemCount: liveCandidateCount,
        sizeBytes: categorySavings.livePhotos || 0,
        image: LivePhotosIcon,
      },
    ];

    return { rows, totalFreeableItems, totalFreeableBytes };
  }, [result]);

  const { rows, totalFreeableItems, totalFreeableBytes } = categories;

  const summaryCardEntrance = useEntrance(
    GRID_BASE_DELAY + rows.length * TILE_STAGGER_MS + 120,
  );

  const handleGoBack = () => router.back();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={{ paddingHorizontal: Spacing.three }}>
        <Animated.View style={[styles.header, headerEntrance]}>
          <Pressable onPress={handleGoBack}>
            <Image
              source={require("@/assets/icons/back-arrow.png")}
              alt="back arrow"
              style={{ width: 28, height: 28 }}
            />
          </Pressable>
          <Text style={styles.title}>All Categories</Text>
          <View />
        </Animated.View>

        {/* ── 2x2 category grid ──────────────────────────────────── */}
        <View style={styles.grid}>
          {rows.map(({ key, label, itemCount, sizeBytes, image }, index) => (
            <CategoryTile
              key={key}
              id={key}
              label={label}
              itemCount={itemCount}
              size={formatBytes(sizeBytes)}
              image={image}
              delay={GRID_BASE_DELAY + index * TILE_STAGGER_MS}
            />
          ))}
        </View>
      </View>

      {/* ── Bottom summary card ──────────────────────────────────── */}
      <Animated.View style={[styles.summaryCard, summaryCardEntrance]}>
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
          style={styles.summaryGradient}
        />
        <Text style={styles.summaryValue}>
          {formatBytes(totalFreeableBytes)} can be freed up
        </Text>
        <Text style={styles.summarySubtitle}>
          {totalFreeableItems.toLocaleString()} items
        </Text>

        <View style={styles.smartDeleteWrap}>
          <GradientButton
            title="Smart Delete"
            icon={<Sparkles size={16} color={Brand.textOnPrimary} />}
            onPress={() => {}}
          />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

export default AllCategories;

// ── Subcomponent ──────────────────────────────────────────────────
const CategoryTile = ({
  id,
  label,
  itemCount,
  size,
  image,
  delay,
}: {
  id: CategoryVariant;
  label: string;
  itemCount: number;
  size: string;
  image: ImageSource;
  delay: number;
}) => {
  const tileEntrance = useEntrance(delay, 12);
  const handlePress = () => {
    router.navigate(`/category-details/${id}`);
  };
  return (
    <Animated.View style={[styles.tileWrap, tileEntrance]}>
      <Pressable onPress={handlePress}>
        <LinearGradient
          colors={["#120E38", Brand.appBackground]}
          style={styles.tile}
        >
          <View style={styles.tileIconWrap}>
            <Image style={styles.tileIconImage} source={image} />
          </View>
          <Text style={styles.tileLabel}>{label}</Text>
          <Text style={styles.tileCount}>{itemCount} items</Text>
          <Text style={styles.tileSize}>{size}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

// ── Styles (unchanged) ─────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.appBackground,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.four,
  },
  title: {
    color: Brand.textPrimary,
    fontSize: FontSizes.headline,
    fontWeight: FontWeights.semibold as any,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two + Spacing.half,
    marginBottom: Spacing.four,
  },
  tileWrap: {
    flexBasis: "48%",
    flexGrow: 1,
  },
  tile: {
    borderWidth: 1,
    borderColor: Brand.cardBorder,
    borderRadius: Radii.large,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    alignItems: "center",
  },
  tileIconWrap: {
    width: 50,
    height: 50,
    borderRadius: Radii.large,
    backgroundColor: Brand.tileBackgroundAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.three,
  },
  tileIconImage: {
    width: 46,
    height: 46,
  },
  tileLabel: {
    color: Brand.textPrimary,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.semibold as any,
    marginBottom: 2,
  },
  tileCount: {
    color: Brand.textSecondary,
    fontSize: FontSizes.caption,
    marginBottom: Spacing.two,
  },
  tileSize: {
    color: Brand.textPrimary,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.medium as any,
  },
  summaryCard: {
    marginTop: "auto",
    borderWidth: 1,
    borderColor: Brand.cardBorder,
    borderTopRightRadius: Radii.xlarge,
    borderTopLeftRadius: Radii.xlarge,
    paddingVertical: Spacing.four,
    alignItems: "center",
    overflow: "hidden",
  },
  summaryGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.9,
  },
  summaryValue: {
    color: Brand.textPrimary,
    fontSize: FontSizes.headline,
    fontWeight: FontWeights.semibold as any,
    marginBottom: 2,
  },
  summarySubtitle: {
    color: Brand.textSecondary,
    fontSize: FontSizes.caption,
    marginBottom: Spacing.four,
  },
  smartDeleteWrap: {
    width: "100%",
    paddingHorizontal: Spacing.three,
  },
});
