import { Image, ImageSource } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useCredits } from "@/context/CreditsContext";
import { GradientButton } from "@/components/ui/gradient-button";
import { GradientText } from "@/components/ui/gradient-text";
import {
  Brand,
  FontSizes,
  FontWeights,
  Gradients,
  Radii,
  Spacing,
} from "@/constants/theme";
import { formatBytes, useAnalysis } from "@/context/AnalysisContext";
import { useEntrance, useHeroEntrance } from "@/hooks/use-entrance";
import ExpoPhotoAnalyzerModule from "../../modules/expo-photo-analyzer/src/ExpoPhotoAnalyzerModule";
import { CategoryVariant } from "./CategoryDetails";
import { CategoriesList } from "./Home";
import {
  ScreenshotsIcon,
  BlurryPhotosIcon,
  ClutterIcon,
  DuplicatesIcon,
  LivePhotosIcon,
} from "@/constants";
import Paywall from "@/components/ui/paywall";

// Types
type CategoryRowData = {
  key: CategoryVariant;
  itemCount: number;
  sizeBytes: number;
  image: ImageSource;
};

const ROW_STAGGER_MS = 70;

// Main Delete Confirmation Screen
const DeleteConfirmation = () => {
  const { t } = useTranslation();

  const params = useLocalSearchParams<{
    variant?: CategoryVariant;
    label?: string;
    itemCount?: string;
    totalSize?: string;
  }>();

  const {
    result,
    getCategoryItems,
    getSelectedItems,
    removeItems,
  } = useAnalysis();

  // Determine if single category or everything
  const isSingleCategory = Boolean(params.variant);
  const variant = params.variant as CategoryVariant | undefined;

  const [showPaywall, setShowPaywall] = useState(false);

  const {
    credits: currentCredits,
    consumeCredits,
    isSubscribed,
    isLoadingSubscription,
  } = useCredits();

  // Compute selected items, counts, and sizes
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

    const assetSizes = result.assetSizes || {};

    const allCategories: CategoryVariant[] = [
      "screenshots",
      "duplicates",
      "clutter",
      "blurry",
      "live",
    ];

    const rows: CategoryRowData[] = [];
    let totalItems = 0;
    let totalSizeBytes = 0;
    let selectedIds: string[] = [];

    const getSize = (id: string) => assetSizes[id] || 0;

    if (isSingleCategory && variant) {
      const items = getCategoryItems(variant);
      const selected = items.filter((item) => item.selected);

      selectedIds = selected.map((item) => item.id);
      totalItems = selected.length;

      totalSizeBytes = selectedIds.reduce(
        (sum, id) => sum + getSize(id),
        0,
      );

      rows.push({
        key: variant,
        itemCount: totalItems,
        sizeBytes: totalSizeBytes,
        image: getCategoryIcon(variant),
      });
    } else {
      for (const cat of allCategories) {
        const ids = getSelectedItems(cat);

        if (ids.length > 0) {
          const size = ids.reduce(
            (sum, id) => sum + getSize(id),
            0,
          );

          rows.push({
            key: cat,
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
  ]);

  const {
    selectedIds,
    totalItems,
    totalSizeBytes,
    categoryRows,
  } = selectedData;

  const isLimitReached =
    isSubscribed && !isLoadingSubscription
      ? false
      : currentCredits === 0 ||
        totalItems > currentCredits;

  // Entrances
  const iconEntrance = useHeroEntrance(0);
  const titleEntrance = useEntrance(160);
  const subtitleEntrance = useEntrance(220);
  const listBaseDelay = 320;

  const buttonsEntrance = useEntrance(
    isSingleCategory
      ? 320
      : listBaseDelay +
          categoryRows.length * ROW_STAGGER_MS +
          140,
  );

  // Handlers
  const handleDelete = async () => {
    try {
      const result =
        await ExpoPhotoAnalyzerModule.deletePhotos(
          selectedIds,
        );

      if (result.success) {
        removeItems(selectedIds);
        await consumeCredits(totalItems);

        router.dismissAll();

        router.replace({
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

  const handleUpgradePress = () => {
    setShowPaywall(true);
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

        <Animated.View
          style={[
            styles.logoTextContainer,
            titleEntrance,
          ]}
        >
          <Text style={styles.logoText}>
            {t(
              totalItems === 1
                ? "delete_confirmation_dialog.title_singular"
                : "delete_confirmation_dialog.title_plural",
              {
                count: totalItems.toLocaleString(),
              },
            )}
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.subtitleContainer,
            subtitleEntrance,
          ]}
        >
          <Text
            style={[
              styles.logoSubtitle,
              {
                maxWidth: 260,
                textAlign: "center",
              },
            ]}
          >
            {t("delete_confirmation_dialog.subtitle")}
          </Text>
        </Animated.View>

        {!isSubscribed && (
          <Animated.View
            style={[
              subtitleEntrance,
              {
                marginTop: Spacing.one,
                alignItems: "center",
              },
            ]}
          >
            <GradientText
              colors={Gradients.primaryButton}
              end={{ x: 0.2, y: 0.5 }}
              style={{
                fontSize: FontSizes.body,
                fontWeight: "500",
              }}
            >
              {t(
                "delete_confirmation_dialog.credits_available",
                {
                  count: currentCredits.toLocaleString(),
                },
              )}
            </GradientText>

            {isLimitReached && (
              <Text
                style={{
                  color: Brand.textSecondary,
                  fontSize: FontSizes.caption,
                  marginTop: 2,
                  textAlign: "center",
                }}
              >
                {t(
                  "delete_confirmation_dialog.premium_required",
                )}
              </Text>
            )}
          </Animated.View>
        )}

        {categoryRows.length > 0 && (
          <CategoriesList
            categoryRows={categoryRows}
            marginTop
          />
        )}
      </View>

      <Animated.View
        style={[
          styles.buttonGroup,
          buttonsEntrance,
        ]}
      >
        <GradientButton
          title={
            isLimitReached
              ? t(
                  "delete_confirmation_dialog.buttons.unlock_unlimited",
                )
              : isSingleCategory
                ? t(
                    "delete_confirmation_dialog.buttons.delete",
                  )
                : t(
                    "delete_confirmation_dialog.buttons.delete_everything",
                  )
          }
          onPress={
            isLimitReached
              ? handleUpgradePress
              : handleDelete
          }
          disabled={totalItems === 0}
        />

        <GradientButton
          title={t(
            "delete_confirmation_dialog.buttons.cancel",
          )}
          type="secondary"
          onPress={handleCancel}
        />
      </Animated.View>

      <Paywall
        isPresented={showPaywall}
        onDismiss={() => setShowPaywall(false)}
      />
    </SafeAreaView>
  );
};

export default DeleteConfirmation;

// Get category icon
function getCategoryIcon(
  category: CategoryVariant,
): ImageSource {
  const map: Record<CategoryVariant, ImageSource> = {
    screenshots: ScreenshotsIcon,
    duplicates: DuplicatesIcon,
    clutter: ClutterIcon,
    blurry: BlurryPhotosIcon,
    live: LivePhotosIcon,
  };

  return map[category];
}

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
    textAlign: "center",
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
  buttonGroup: {
    gap: Spacing.two + Spacing.half,
    marginBottom: Spacing.two,
  },
});