import React from "react";
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
import { ChevronLeft } from "lucide-react-native";
import Animated from "react-native-reanimated";

import { useEntrance } from "@/hooks/use-entrance";
import { router } from "expo-router";
import { CategoryVariant } from "./CategoryDetails";

const ScreenshotsIcon = require("@/assets/icons/screenshots.png");
const DuplicatesIcon = require("@/assets/icons/duplicates.png");
const BlurryPhotosIcon = require("@/assets/icons/blurry.png");
const LivePhotosIcon = require("@/assets/icons/live-photos.png");

type CategoryRowData = {
  key: CategoryVariant;
  label: string;
  itemCount: number;
  size: string;
  image: ImageSource;
};

export const CATEGORIES: CategoryRowData[] = [
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

// One row's worth of stagger delay, applied on top of the list's base delay.
const ROW_STAGGER_MS = 70;

export const CategoriesList = ({
  marginTop = false,
}: {
  marginTop?: boolean;
}) => {
  return (
    <View
      style={[styles.categoryList, marginTop && { marginTop: Spacing.five }]}
    >
      {CATEGORIES.map(({ key, label, itemCount, size, image }, index) => (
        <CategoryRow
          id={key}
          key={key}
          label={label}
          itemCount={itemCount}
          size={size}
          image={image}
          delay={220 + index * ROW_STAGGER_MS}
        />
      ))}
    </View>
  );
};
const Home = () => {
  const headerEntrance = useEntrance(0);
  const titleEntrance = useEntrance(60);
  const statCardEntrance = useEntrance(140);
  const sectionHeaderEntrance = useEntrance(220); // same as first row

  const ctaEntrance = useEntrance(
    140 + CATEGORIES.length * ROW_STAGGER_MS + 160,
  );

  const handleGoBack = () => {
    router.back();
  };
  const handleReviewItems = () => {
    router.push("/delete-confirmation"); //all-categories
  };
  const handleSeeAllCategories = () => router.push("/all-categories");

  return (
    <SafeAreaView style={styles.screen}>
      {/* ── Header ───────────────────────────────────────────────── */}
      <Animated.View style={[styles.header, headerEntrance]}>
        <Pressable onPress={handleGoBack}>
          {/* <ChevronLeft strokeWidth={2} color={Brand.textPrimary} /> */}
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

      {/* ── Highlighted stat card ────────────────────────────────── */}
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
        <Text style={styles.statValue}>{TOTAL_FREEABLE_GB}</Text>
        <Text style={styles.statSubtitle}>
          {TOTAL_ITEMS.toLocaleString()} items
        </Text>
      </Animated.View>
      <Animated.View style={[styles.sectionHeader, sectionHeaderEntrance]}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <Pressable onPress={handleSeeAllCategories}>
          <Text style={styles.seeAllButton}>See All</Text>
        </Pressable>
      </Animated.View>
      {/* ── Category list — each row cascades in ─────────────────── */}
      <CategoriesList />

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <Animated.View style={[styles.ctaWrap, ctaEntrance]}>
        <GradientButton title="Review Items" onPress={handleReviewItems} />
      </Animated.View>
    </SafeAreaView>
  );
};

export default Home;

// Small subcomponent so each row can own its own animated hook instance.
export const CategoryRow = ({
  label,
  id,
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
  const rowEntrance = useEntrance(delay, 10);
  const handleReviewACategory = (category: CategoryVariant) => {
    console.log("pressed: ", id);

    router.navigate(`/category-details/${category}`);
  };
  return (
    <Pressable onPress={() => handleReviewACategory(id)}>
      <Animated.View style={[styles.categoryRow, rowEntrance]}>
        <View style={styles.categoryIconWrap}>
          <Image style={{ width: 32, height: 32 }} source={image} />
        </View>
        <View style={styles.categoryTextWrap}>
          <Text style={styles.categoryLabel}>{label}</Text>
          <Text style={styles.categoryCount}>{itemCount} items</Text>
        </View>
        <Text style={styles.categorySize}>{size}</Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.appBackground,
    paddingHorizontal: Spacing.four,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.four,
  },
  backChevron: {
    color: Brand.textPrimary,
    fontSize: 26,
    fontWeight: FontWeights.regular as any,
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
    height: "100%",
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
    paddingHorizontal: Spacing.one, // subtle alignment with rows
    marginBottom: Spacing.three,
    marginTop: Spacing.three,
  },
  sectionTitle: {
    color: Brand.textPrimary,
    fontSize: FontSizes.title, // or a bit smaller if you prefer
    fontWeight: FontWeights.semibold as any,
  },
  seeAllButton: {
    color: Brand.primary, // or Brand.textSecondary with a tint
    fontSize: FontSizes.body,
    fontWeight: FontWeights.medium as any,
    paddingVertical: 4,
    paddingHorizontal: 8,
    // optional: add a subtle underline or background on press
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
  categoryRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.divider,
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
