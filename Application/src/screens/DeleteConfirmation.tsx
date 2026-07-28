import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image, ImageSource } from "expo-image";
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
import { useEntrance, useHeroEntrance } from "@/hooks/use-entrance";
import { CategoryVariant } from "./CategoryDetails";
import { useAnalysis } from "@/context/AnalysisContext";
import ExpoPhotoAnalyzerModule from "../../modules/expo-photo-analyzer/src/ExpoPhotoAnalyzerModule";
import { CategoriesList } from "./Home";

// ── Icons (reuse from Home) ──────────────────────────────────────────
const ScreenshotsIcon = require("@/assets/icons/screenshots.png");
const DuplicatesIcon = require("@/assets/icons/duplicates.png");
const BlurryPhotosIcon = require("@/assets/icons/blurry.png");
const LivePhotosIcon = require("@/assets/icons/live-photos.png");
const ClutterIcon = require("@/assets/icons/trash.png");

// ── Types ──────────────────────────────────────────────────────────────
type CategoryRowData = {
  key: CategoryVariant;
  label: string;
  itemCount: number;
  sizeBytes: number;
  image: ImageSource;
};

const ROW_STAGGER_MS = 70;

// ── Helper: format bytes ──────────────────────────────────────────────
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

  
// ─────────────────────────────────────────────────────────────────────────
// Main Delete Confirmation Screen
// ─────────────────────────────────────────────────────────────────────────

const DeleteConfirmation = () => {
  const params = useLocalSearchParams<{
    variant?: CategoryVariant;
    label?: string;
    itemCount?: string;
    totalSize?: string;
  }>();

  const { result, getCategoryItems, getSelectedItems, removeItems } =
    useAnalysis();

  // ── Determine if single category or everything ──────────────────
  const isSingleCategory = Boolean(params.variant);
  const variant = params.variant as CategoryVariant | undefined;

  // ── Compute selected items, counts, and sizes ──────────────────
  const selectedData = useMemo(() => {
    if (!result) {
      return {
        selectedIds: [],
        totalItems: 0,
        totalSizeBytes: 0,
        totalSizeFormatted: "0 B",
        categoryRows: [] as CategoryRowData[],
      };
    }

    const allCategories: CategoryVariant[] = [
      "screenshots",
      "duplicates",
      "clutter",
      "blurry",
      "live",
    ];

    const categorySavings = result.categorySavings || {};
    const rows: CategoryRowData[] = [];
    let totalItems = 0;
    let totalSizeBytes = 0;
    let selectedIds: string[] = [];

    if (isSingleCategory && variant) {
      // Single category: use selected items from that category
      const items = getCategoryItems(variant);
      const selected = items.filter((item) => item.selected);
      selectedIds = selected.map((item) => item.id);
      totalItems = selected.length;
      totalSizeBytes = categorySavings[variant] || 0;

      // Build a single row for this category
      rows.push({
        key: variant,
        label: params.label || variant,
        itemCount: totalItems,
        sizeBytes: totalSizeBytes,
        image: getCategoryIcon(variant),
      });
    } else {
      // All categories: sum selected from each
      for (const cat of allCategories) {
        const ids = getSelectedItems(cat);
        const size = categorySavings[cat] || 0;
        if (ids.length > 0) {
          rows.push({
            key: cat,
            label: getCategoryLabel(cat),
            itemCount: ids.length,
            sizeBytes: size,
            image: getCategoryIcon(cat),
          });
          selectedIds = selectedIds.concat(ids);
          totalItems += ids.length;
          totalSizeBytes += size;
        }
      }
    }

    const totalSizeFormatted = formatBytes(totalSizeBytes);

    return {
      selectedIds,
      totalItems,
      totalSizeBytes,
      totalSizeFormatted,
      categoryRows: rows,
    };
  }, [
    result,
    isSingleCategory,
    variant,
    getCategoryItems,
    getSelectedItems,
    params.label,
  ]);

  const {
    selectedIds,
    totalItems,
    totalSizeBytes,
    totalSizeFormatted,
    categoryRows,
  } = selectedData;

  // ── Entrances ──────────────────────────────────────────────────────────
  const iconEntrance = useHeroEntrance(0);
  const titleEntrance = useEntrance(160);
  const subtitleEntrance = useEntrance(220);
  const listBaseDelay = 320;

  const buttonsEntrance = useEntrance(
    isSingleCategory
      ? 320
      : listBaseDelay + categoryRows.length * ROW_STAGGER_MS + 140,
  );

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      const result = await ExpoPhotoAnalyzerModule.deletePhotos(selectedIds);
      if (result.success) {
        // Update context & storage by removing these IDs
        removeItems(selectedIds);

        router.push({
          pathname: "/done",
          params: {
            freedUpBytes: String(totalSizeBytes),
            itemsDeleted: String(totalItems),
          },
        });
      } else {
        console.error("Delete errors:", result.errors);
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  // ── Render ────────────────────────────────────────────────────────────
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
            Delete {totalItems.toLocaleString()} item
            {totalItems === 1 ? "" : "s"}?
          </Text>
        </Animated.View>

        <Animated.View style={[styles.subtitleContainer, subtitleEntrance]}>
          <Text style={styles.logoSubtitle}>This action cannot be undone.</Text>
        </Animated.View>

        {/* ── Category breakdown ────────────────────────────────────── */}
        {categoryRows.length > 0 && (
          <CategoriesList categoryRows={categoryRows} marginTop />
        )}
      </View>

      {/* ── Buttons ─────────────────────────────────────────────────── */}
      <Animated.View style={[styles.buttonGroup, buttonsEntrance]}>
        <GradientButton
          title={isSingleCategory ? "Delete" : "Delete Everything"}
          onPress={handleDelete}
          disabled={totalItems === 0}
        />
        <GradientButton
          title="Cancel"
          type="secondary"
          onPress={handleCancel}
        />
      </Animated.View>
    </SafeAreaView>
  );
};

export default DeleteConfirmation;

// ── Helper: get category label and icon ──────────────────────────────
function getCategoryLabel(category: CategoryVariant): string {
  const map: Record<CategoryVariant, string> = {
    screenshots: "Screenshots",
    duplicates: "Duplicates",
    clutter: "Clutter",
    blurry: "Blurry Photos",
    live: "Live Photos",
  };
  return map[category] || category;
}

function getCategoryIcon(category: CategoryVariant): ImageSource {
  const map: Record<CategoryVariant, ImageSource> = {
    screenshots: ScreenshotsIcon,
    duplicates: DuplicatesIcon,
    clutter: ClutterIcon,
    blurry: BlurryPhotosIcon,
    live: LivePhotosIcon,
  };
  return map[category];
}

// ── Styles (unchanged) ────────────────────────────────────────────────
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
    gap: 4,
    marginTop: 10,
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
  buttonGroup: {
    gap: Spacing.two + Spacing.half,
    marginBottom: Spacing.two,
  },
});
