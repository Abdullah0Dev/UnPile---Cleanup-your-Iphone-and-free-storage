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
import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { useTranslation } from "react-i18next";

// Types
type CategoryRowData = {
  key: CategoryVariant;
  itemCount: number;
  sizeBytes: number;
  image: ImageSource;
};

const ROW_STAGGER_MS = 70;

export const CATEGORY_TRANSLATION_KEYS = {
  screenshots: "categories_overview_screen.categories.screenshots",
  duplicates: "categories_overview_screen.categories.duplicates",
  clutter: "categories_overview_screen.categories.clutter",
  blurry: "categories_overview_screen.categories.blurry_photos",
  live: "categories_overview_screen.categories.live_photos",
} as const satisfies Record<CategoryVariant, string>;

// Category List Component
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
      {categoryRows.map(({ key, itemCount, sizeBytes, image }, index) => (
        <CategoryRow
          id={key}
          key={key}
          itemCount={itemCount}
          sizeBytes={sizeBytes}
          image={image}
          delay={220 + index * ROW_STAGGER_MS}
        />
      ))}
    </Animated.ScrollView>
  );
}

// Empty State
const EmptyState = () => {
  const entrance = useEntrance(140);
  const { t } = useTranslation();

  return (
    <Animated.View style={[styles.emptyContainer, entrance]}>
      <Image
        source={require("@/assets/icons/done.png")}
        contentFit="contain"
        style={styles.emptyImage}
      />

      <Text style={styles.emptySubtitle}>
        {t("scan_complete_screen.empty_state.subtitle")}
      </Text>

      <Text style={styles.emptyHint}>
        {t("scan_complete_screen.empty_state.hint")}
      </Text>
    </Animated.View>
  );
};

// Home Screen
const Home = () => {
  const { t } = useTranslation();

  const headerEntrance = useEntrance(0);
  const titleEntrance = useEntrance(60);
  const statCardEntrance = useEntrance(140);
  const sectionHeaderEntrance = useEntrance(220);
  const ctaEntrance = useEntrance(
    140 + 5 * ROW_STAGGER_MS + 160,
  );

  const [showCreditsOnboarding, setShowCreditsOnboarding] =
    useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const { result, clearResult } = useAnalysis();
  const { credits: currentCredits, isSubscribed } = useCredits();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const checkOnboarding = async () => {
      if (result) {
        const hasSeenIntro = await AsyncStorage.getItem(
          "hasSeenCreditIntro",
        );

        if (!hasSeenIntro && currentCredits === 500) {
          timer = setTimeout(async () => {
            setShowCreditsOnboarding(true);

            await AsyncStorage.setItem(
              "hasSeenCreditIntro",
              "true",
            );
          }, 1500);
        }
      }
    };

    checkOnboarding();

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [result, currentCredits]);

  if (!result) {
    return <AnimatedSplashOverlay />;
  }

  const assetSizes = result.assetSizes || {};

  // Compute deletable items per category
  const categoryStats = useMemo(() => {
    const sumSizes = (ids: string[]) =>
      ids.reduce(
        (sum, id) => sum + (assetSizes[id] || 0),
        0,
      );

    // Screenshots
    const screenshotIds = result.screenshots || [];
    const screenshotSize = sumSizes(screenshotIds);
    const screenshotCount = screenshotIds.length;

    // Duplicates
    const duplicateIds = result.duplicateGroups.flatMap(
      (g) => g.duplicateAssetIds,
    );
    const duplicateSize = sumSizes(duplicateIds);
    const duplicateCount = duplicateIds.length;

    // Clutter
    const clutterIds = result.clutter || [];
    const clutterSize = sumSizes(clutterIds);
    const clutterCount = clutterIds.length;

    // Blurry
    const blurryIds = result.blurry || [];
    const blurrySize = sumSizes(blurryIds);
    const blurryCount = blurryIds.length;

    // Live Photos
    const liveIds = result.livePhotoCandidates || [];
    const liveSize = sumSizes(liveIds);
    const liveCount = liveIds.length;

    const totalFreeableBytes =
      screenshotSize +
      duplicateSize +
      clutterSize +
      blurrySize +
      liveSize;

    const totalFreeableItems =
      screenshotCount +
      duplicateCount +
      clutterCount +
      blurryCount +
      liveCount;

    const allRows: CategoryRowData[] = [
      {
        key: "screenshots",
        itemCount: screenshotCount,
        sizeBytes: screenshotSize,
        image: ScreenshotsIcon,
      },
      {
        key: "duplicates",
        itemCount: duplicateCount,
        sizeBytes: duplicateSize,
        image: DuplicatesIcon,
      },
      {
        key: "clutter",
        itemCount: clutterCount,
        sizeBytes: clutterSize,
        image: ClutterIcon,
      },
      {
        key: "blurry",
        itemCount: blurryCount,
        sizeBytes: blurrySize,
        image: BlurryPhotosIcon,
      },
      {
        key: "live",
        itemCount: liveCount,
        sizeBytes: liveSize,
        image: LivePhotosIcon,
      },
    ];

    const rows = allRows.filter(
      (row) => row.itemCount > 0,
    );

    return {
      rows,
      totalFreeableBytes,
      totalFreeableItems,
    };
  }, [result, assetSizes]);

  const {
    rows,
    totalFreeableBytes,
    totalFreeableItems,
  } = categoryStats;

  const handleGoBack = async () => {
    await clearResult();
    router.dismissAll();
    router.replace("/");
  };

  const handleReviewItems = () =>
    router.push("/delete-confirmation");

  const handleSeeAllCategories = () =>
    router.push("/all-categories");

  const handleUpgrade = () => {
    setShowCreditsOnboarding(false);
    setShowPaywall(true);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <Animated.View
        style={[styles.header, headerEntrance]}
      >
        <Pressable onPress={handleGoBack}>
          <Image
            source={require("@/assets/icons/back-arrow.png")}
            alt="back arrow"
            style={{ width: 28, height: 28 }}
          />
        </Pressable>
      </Animated.View>

      <Animated.Text
        style={[styles.title, titleEntrance]}
      >
        {t("scan_complete_screen.title")}
      </Animated.Text>

      <Animated.View
        style={[styles.statCard, statCardEntrance]}
      >
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

        <Text style={styles.statLabel}>
          {t("scan_complete_screen.summary.subtitle")}
        </Text>

        <Text style={styles.statValue}>
          {formatBytes(totalFreeableBytes)}
        </Text>

        <Text style={styles.statSubtitle}>
          {t("scan_complete_screen.summary.item_count", {
            count: totalFreeableItems,
          })}
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.sectionHeader,
          sectionHeaderEntrance,
        ]}
      >
        <Text style={styles.sectionTitle}>
          {t("scan_complete_screen.categories_section.title")}
        </Text>

        <Pressable onPress={handleSeeAllCategories}>
          <Text style={styles.seeAllButton}>
            {t(
              "scan_complete_screen.categories_section.see_all",
            )}
          </Text>
        </Pressable>
      </Animated.View>

      <CategoriesList categoryRows={rows} />

      <Animated.View style={[styles.ctaWrap, ctaEntrance]}>
        <GradientButton
          title={
            totalFreeableItems === 0
              ? t("scan_complete_screen.buttons.rescan_photos")
              : t("scan_complete_screen.buttons.review_items")
          }
          onPress={
            totalFreeableItems === 0
              ? handleGoBack
              : handleReviewItems
          }
        />

        {!isSubscribed && (
          <GradientText
            end={{ x: 0.5, y: 0.5 }}
            colors={Gradients.primaryButton}
            style={[
              styles.statSubtitle,
              {
                textAlign: "center",
                marginTop: 4,
                fontSize: 14,
              },
            ]}
          >
            {t("scan_complete_screen.footer.credits_remaining", {
              count: currentCredits,
            })}
          </GradientText>
        )}
      </Animated.View>

      <OnboardingCredits
        isPresented={showCreditsOnboarding}
        onDismiss={() =>
          setShowCreditsOnboarding(false)
        }
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

// Category Row Component
export const CategoryRow = ({
  id,
  itemCount,
  sizeBytes,
  image,
  delay,
}: {
  id: CategoryVariant;
  itemCount: number;
  sizeBytes: number;
  image: ImageSource;
  delay: number;
}) => {
  const rowEntrance = useEntrance(delay, 10);
  const { t } = useTranslation();

  const handlePress = () => {
    router.navigate(`/category-details/${id}`);
  };

  const translationKey = CATEGORY_TRANSLATION_KEYS[id];

  return (
    <Pressable onPress={handlePress}>
      <Animated.View
        style={[styles.categoryRow, rowEntrance]}
      >
        <View style={styles.categoryIconWrap}>
          <Image
            style={{ width: 32, height: 32 }}
            source={image}
          />
        </View>

        <View style={styles.categoryTextWrap}>
          <Text style={styles.categoryLabel}>
            {t(`${translationKey}.title`)}
          </Text>

          <Text style={styles.categoryCount}>
            {t(`${translationKey}.item_count`, {
              count: itemCount,
            })}
          </Text>
        </View>

        <Text style={styles.categorySize}>
          {formatBytes(sizeBytes)}
        </Text>
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
    backgroundColor: "#12112860",
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
