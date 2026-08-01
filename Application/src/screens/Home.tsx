import { GradientButton } from "@/components/ui/gradient-button";
import {
  Brand,
  FontSizes,
  FontWeights,
  Gradients,
  Radii,
  Spacing,
} from "@/constants/theme";
import { Image, ImageSource } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import OnboardingCredits from "@/components/ui/onboarding-credits";
import Paywall from "@/components/ui/paywall";
import { formatBytes, useAnalysis } from "@/context/AnalysisContext";
import { useEntrance } from "@/hooks/use-entrance";
import { CategoryVariant } from "./CategoryDetails";
import {
  ScreenshotsIcon,
  BlurryPhotosIcon,
  ClutterIcon,
  DuplicatesIcon,
  LivePhotosIcon,
} from "@/constants";
import { GradientText } from "@/components/ui/gradient-text";
import { useCredits } from "@/context/CreditsContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

//  Types
type CategoryRowData = {
  key: CategoryVariant;
  label: string;
  itemCount: number;
  sizeBytes: number;
  image: ImageSource;
};

const ROW_STAGGER_MS = 70;

//  Category List Component
export function CategoriesList({
  categoryRows,
  marginTop = false,
}: {
  categoryRows: CategoryRowData[];
  marginTop?: boolean;
}) {
  const [containerHeight, setContainerHeight] = React.useState(0);
  const [contentHeight, setContentHeight] = React.useState(0);

  const isScrollable = contentHeight > containerHeight;
  if (categoryRows.length === 0) {
    return <EmptyState />;
  }
  console.log("categoryRows.length: ", categoryRows.length);

  return (
    <Animated.ScrollView
      contentContainerStyle={[
        styles.categoryList,
        marginTop && { marginTop: Spacing.three },
      ]}
      style={marginTop ? { width: "100%" } : {}}
      scrollEnabled={isScrollable}
      bounces={false}
      showsVerticalScrollIndicator={false}
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

//  Empty State
const EmptyState = () => {
  const entrance = useEntrance(140);

  return (
    <Animated.View style={[styles.emptyContainer, entrance]}>
      <Image
        source={require("@/assets/icons/done.png")}
        contentFit="contain"
        style={styles.emptyImage}
      />
      <Text style={styles.emptySubtitle}>You have no nothing to delete.</Text>
      <Text style={styles.emptyHint}>You're mostly done.</Text>
    </Animated.View>
  );
};

//  Home Screen
const Home = () => {
  const headerEntrance = useEntrance(0);
  const titleEntrance = useEntrance(60);
  const statCardEntrance = useEntrance(140);
  const sectionHeaderEntrance = useEntrance(220);
  const ctaEntrance = useEntrance(140 + 5 * ROW_STAGGER_MS + 160);
  const [showCreditsOnboarding, setShowCreditsOnboarding] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const { result, clearResult } = useAnalysis();
  const { credits: currentCredits, isSubscribed } = useCredits();
  if (!result) {
    router.replace("/");
    return null;
  }

  const assetSizes = result.assetSizes || {};

  //  Compute deletable items per category
  const categoryStats = useMemo(() => {
    // Helper to sum sizes of an ID array
    const sumSizes = (ids: string[]) =>
      ids.reduce((sum, id) => sum + (assetSizes[id] || 0), 0);

    // 1. Screenshots: all screenshots are deletable
    const screenshotIds = result.screenshots || [];
    const screenshotSize = sumSizes(screenshotIds);
    const screenshotCount = screenshotIds.length;

    // 2. Duplicates: duplicateAssetIds from all groups
    const duplicateIds = result.duplicateGroups.flatMap(
      (g) => g.duplicateAssetIds,
    );
    const duplicateSize = sumSizes(duplicateIds);
    const duplicateCount = duplicateIds.length;

    // 3. Clutter: all clutter are deletable
    const clutterIds = result.clutter || [];
    const clutterSize = sumSizes(clutterIds);
    const clutterCount = clutterIds.length;

    // 4. Blurry: all blurry are deletable
    const blurryIds = result.blurry || [];
    const blurrySize = sumSizes(blurryIds);
    const blurryCount = blurryIds.length;

    // 5. Live Photos: livePhotoCandidates are deletable
    const liveIds = result.livePhotoCandidates || [];
    const liveSize = sumSizes(liveIds);
    const liveCount = liveIds.length;

    const totalFreeableBytes =
      screenshotSize + duplicateSize + clutterSize + blurrySize + liveSize;
    const totalFreeableItems =
      screenshotCount + duplicateCount + clutterCount + blurryCount + liveCount;

    // Build rows for all categories that have items
    const allRows: CategoryRowData[] = [
      {
        key: "screenshots",
        label: "Screenshots",
        itemCount: screenshotCount,
        sizeBytes: screenshotSize,
        image: ScreenshotsIcon,
      },
      {
        key: "duplicates",
        label: "Duplicates",
        itemCount: duplicateCount,
        sizeBytes: duplicateSize,
        image: DuplicatesIcon,
      },
      {
        key: "clutter",
        label: "Clutter",
        itemCount: clutterCount,
        sizeBytes: clutterSize,
        image: ClutterIcon,
      },
      {
        key: "blurry",
        label: "Blurry Photos",
        itemCount: blurryCount,
        sizeBytes: blurrySize,
        image: BlurryPhotosIcon,
      },
      {
        key: "live",
        label: "Live Photos",
        itemCount: liveCount,
        sizeBytes: liveSize,
        image: LivePhotosIcon,
      },
    ];

    // ✅ Only show categories that have at least one deletable item
    const rows = allRows.filter((row) => row.itemCount > 0);

    return {
      rows,
      totalFreeableBytes,
      totalFreeableItems,
    };
  }, [result, assetSizes]);

  const { rows, totalFreeableBytes, totalFreeableItems } = categoryStats;
  useEffect(() => {
    let timer: number | null = null;

    const checkOnboarding = async () => {
      // 1. Only trigger if the user has a valid scan result
      if (result) {
        const hasSeenIntro = await AsyncStorage.getItem("hasSeenCreditIntro");
        
        // 2. Check if they haven't seen it, and they still have the 500 credits
        if (!hasSeenIntro && currentCredits === 500) {
          
          // Start a 1.5-second delay so the page loads smoothly first
          timer = setTimeout(async () => {
            // Show the bottom sheet
            setShowCreditsOnboarding(true);
            
            // Mark as seen NOW, right when it shows up
            await AsyncStorage.setItem("hasSeenCreditIntro", "true");
          }, 1500); // 1500ms = 1.5 seconds
          
        }
      }
    };

    checkOnboarding();

    // 🧹 Cleanup function: Clears the timeout if the user navigates away 
    // before the 1.5 seconds are up. Prevents memory leaks and React warnings.
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [result, currentCredits]);
  const handleGoBack = async () => {
    await clearResult();
    router.dismissAll();
    router.replace("/");
  };

  const handleReviewItems = () => router.push("/delete-confirmation");
  const handleSeeAllCategories = () => router.push("/all-categories");
  const handleUpgrade = () => {
    setShowCreditsOnboarding(false);
    setShowPaywall(true); // Opens the real Paywall immediately
  };


  return (
    <SafeAreaView style={styles.screen}>
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

      <Animated.View style={[styles.sectionHeader, sectionHeaderEntrance]}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <Pressable onPress={handleSeeAllCategories}>
          <Text style={styles.seeAllButton}>See All</Text>
        </Pressable>
      </Animated.View>

      <CategoriesList categoryRows={rows} />

      <Animated.View style={[styles.ctaWrap, ctaEntrance]}>
        <GradientButton
          title={totalFreeableItems === 0 ? "Re-Scan Photos" : "Review Items"}
          onPress={totalFreeableItems === 0 ? handleGoBack : handleReviewItems}
        />
        {!isSubscribed && (
          <GradientText
            end={{ x: 0.5, y: 0.5 }}
            colors={Gradients.primaryButton}
            style={[
              styles.statSubtitle,
              { textAlign: "center", marginTop: 4, fontSize: 14 },
            ]}
          >
            {currentCredits.toLocaleString()} Credits Remaining
          </GradientText>
        )}
      </Animated.View>
      <OnboardingCredits
        isPresented={showCreditsOnboarding}
        onDismiss={() => setShowCreditsOnboarding(false)}
        onUpgrade={handleUpgrade}
      />

      <Paywall
        isPresented={showPaywall}
        onDismiss={() => setShowPaywall(false)}
      />
    </SafeAreaView>
  );
};

export default Home;

//  Category Row Component
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
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
  },
  emptyImage: {
    width: 180,
    height: 180,
  },
  emptyTitle: {
    color: Brand.textPrimary,
    fontSize: FontSizes.title,
    fontWeight: FontWeights.semibold as any,
    marginBottom: Spacing.two,
  },
  emptySubtitle: {
    color: Brand.textSecondary,
    fontSize: FontSizes.body,
    textAlign: "center",
    marginBottom: Spacing.one,
  },
  emptyHint: {
    color: Brand.textSecondary,
    fontSize: FontSizes.caption,
    marginBottom: Spacing.four,
    opacity: 0.7,
  },
  emptyButtonWrap: {
    width: "100%",
    paddingHorizontal: Spacing.three,
  },
});
