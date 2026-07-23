import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Image, ImageSource } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, Sparkles } from "lucide-react-native";
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
import { CategoryVariant } from "./CategoryDetails";

// Category icons — same assets used on the Home / Scan Complete screen.
const ScreenshotsIcon = require("@/assets/icons/screenshots.png");
const DuplicatesIcon = require("@/assets/icons/duplicates.png");
const BlurryPhotosIcon = require("@/assets/icons/blurry.png");
const LivePhotosIcon = require("@/assets/icons/live-photos.png");

type CategoryTileData = {
  key: CategoryVariant;
  label: string;
  itemCount: number;
  size: string;
  image: ImageSource;
};
const CATEGORIES: CategoryTileData[] = [
  {
    key: "screenshots",
    label: "Screenshots",
    itemCount: 874,
    size: "4.2 GB",
    image: ScreenshotsIcon,
  },
  {
    key: "duplicates",
    label: "Duplicates",
    itemCount: 342,
    size: "8.7 GB",
    image: DuplicatesIcon,
  },
  {
    key: "blurry",
    label: "Blurry Photos",
    itemCount: 218,
    size: "2.1 GB",
    image: BlurryPhotosIcon,
  },
  {
    key: "live",
    label: "Live Photos",
    itemCount: 220,
    size: "8.6 GB",
    image: LivePhotosIcon,
  },
];

const TOTAL_FREEABLE_GB = "23.6 GB";
const TOTAL_ITEMS = 1654;

// One tile's worth of stagger delay, applied on top of the grid's base delay.
const TILE_STAGGER_MS = 80;
const GRID_BASE_DELAY = 140;

const AllCategories = () => {
  const headerEntrance = useEntrance(0);
  const summaryCardEntrance = useEntrance(
    GRID_BASE_DELAY + CATEGORIES.length * TILE_STAGGER_MS + 120,
  );
  const handleGoBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* ── Header ───────────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: Spacing.four }}>
        <Animated.View style={[styles.header, headerEntrance]}>
          <Pressable onPress={handleGoBack}>
              <Image
                        source={require("@/assets/icons/back-arrow.png")}
                        alt="back arrow"
                        style={{ width: 28, height: 28 }}
                      />
          </Pressable>
          <Text style={styles.title}>All Categories</Text>
          {/* <Pressable hitSlop={8}>
            <Text style={styles.selectLink}>Select</Text>
          </Pressable> */}
          <View />
        </Animated.View>

        {/* ── 2x2 category grid — each tile cascades in ─────────────── */}
        <View style={styles.grid}>
          {CATEGORIES.map(({ key, label, itemCount, size, image }, index) => (
            <CategoryTile
              key={key}
              id={key}
              label={label}
              itemCount={itemCount}
              size={size}
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
          {TOTAL_FREEABLE_GB} can be freed up
        </Text>
        <Text style={styles.summarySubtitle}>
          {TOTAL_ITEMS.toLocaleString()} items
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

// Small subcomponent so each tile can own its own animated hook instance.
const CategoryTile = ({
  id,
  label,
  itemCount,
  size,
  image,
  delay,
}: {
  label: string;
  id: CategoryVariant;
  itemCount: number;
  size: string;
  image: ImageSource;
  delay: number;
}) => {
  const tileEntrance = useEntrance(delay, 12);
  const handleReviewACategory = (category: CategoryVariant) => {
    console.log("pressed: ", id);

    router.navigate(`/category-details/${category}`);
  };
  return (
    <Animated.View style={[styles.tileWrap, tileEntrance]}>
      <Pressable onPress={() => handleReviewACategory(id)}>
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
  selectLink: {
    color: Brand.primaryLight,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.medium as any,
  },

  // 2x2 grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two + Spacing.half, // ~10
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

  // Bottom summary card
  summaryCard: {
    marginTop: "auto",
    // marginBottom: Spacing.five,
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
