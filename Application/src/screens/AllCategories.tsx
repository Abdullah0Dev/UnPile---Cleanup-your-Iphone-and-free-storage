import { Image, ImageSource } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles } from "lucide-react-native";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { GradientButton } from "@/components/ui/gradient-button";
import {
  Brand,
  FontSizes,
  FontWeights,
  Radii,
  Spacing,
} from "@/constants/theme";
import { formatBytes, useAnalysis } from "@/context/AnalysisContext";
import { useEntrance } from "@/hooks/use-entrance";
import { router } from "expo-router";
import { CategoryVariant } from "./CategoryDetails";
import { ScreenshotsIcon, BlurryPhotosIcon, ClutterIcon, DuplicatesIcon, LivePhotosIcon } from "@/constants";

const TILE_STAGGER_MS = 80;
const GRID_BASE_DELAY = 140;

const AllCategories = () => {
  const headerEntrance = useEntrance(0);
  const { result } = useAnalysis();

  if (!result) {
    router.replace("/");
    return null;
  }

  const assetSizes = result.assetSizes || {};

  // Compute deletable items per category
  const categoryData = useMemo(() => {
    //  sum sizes of an ID array
    const sumSizes = (ids: string[]) =>
      ids.reduce((sum, id) => sum + (assetSizes[id] || 0), 0);

    const screenshotIds = result.screenshots || [];
    const screenshotSize = sumSizes(screenshotIds);
    const screenshotCount = screenshotIds.length;

    const duplicateIds = result.duplicateGroups.flatMap(
      (g) => g.duplicateAssetIds,
    );
    const duplicateSize = sumSizes(duplicateIds);
    const duplicateCount = duplicateIds.length;

    const clutterIds = result.clutter || [];
    const clutterSize = sumSizes(clutterIds);
    const clutterCount = clutterIds.length;

    const blurryIds = result.blurry || [];
    const blurrySize = sumSizes(blurryIds);
    const blurryCount = blurryIds.length;

    const liveIds = result.livePhotoCandidates || [];
    const liveSize = sumSizes(liveIds);
    const liveCount = liveIds.length;

    const totalFreeableBytes =
      screenshotSize + duplicateSize + clutterSize + blurrySize + liveSize;
    const totalFreeableItems =
      screenshotCount + duplicateCount + clutterCount + blurryCount + liveCount;

    // All categories
    const allRows = [
      {
        key: "screenshots" as CategoryVariant,
        label: "Screenshots",
        itemCount: screenshotCount,
        sizeBytes: screenshotSize,
        image: ScreenshotsIcon,
      },
      {
        key: "clutter" as CategoryVariant,
        label: "Clutter",
        itemCount: clutterCount,
        sizeBytes: clutterSize,
        image: ClutterIcon,
      },
      {
        key: "duplicates" as CategoryVariant,
        label: "Duplicates",
        itemCount: duplicateCount,
        sizeBytes: duplicateSize,
        image: DuplicatesIcon,
      },
      {
        key: "blurry" as CategoryVariant,
        label: "Blurry Photos",
        itemCount: blurryCount,
        sizeBytes: blurrySize,
        image: BlurryPhotosIcon,
      },
      {
        key: "live" as CategoryVariant,
        label: "Live Photos",
        itemCount: liveCount,
        sizeBytes: liveSize,
        image: LivePhotosIcon,
      },
    ];

    return {
      rows: allRows,
      totalFreeableBytes,
      totalFreeableItems,
    };
  }, [result, assetSizes]);

  const { rows, totalFreeableBytes, totalFreeableItems } = categoryData;

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

      {/*  Bottom summary card  */}
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
            onPress={() => {
              router.push("/delete-confirmation");
            }}
          />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

export default AllCategories;

//  Subcomponent
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
