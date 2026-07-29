import { GradientButton } from "@/components/ui/gradient-button";
import {
  Brand,
  FontSizes,
  FontWeights,
  Radii,
  Spacing,
} from "@/constants/theme";
import {
  CategoryKey,
  formatBytes,
  useAnalysis,
} from "@/context/AnalysisContext";
import { useEntrance, useSheetEntrance } from "@/hooks/use-entrance";
import { FlashList, ListRenderItemInfo } from "@shopify/flash-list";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { Check } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

// Types
export type CategoryVariant = CategoryKey;

type PhotoItem = {
  id: string;
  image: any;
  selected: boolean;
  isBest?: boolean;
  groupId?: string;
};

type DuplicateGroup = {
  groupId: string;
  label: string;
  items: PhotoItem[];
};

// Screen
const CategoryDetails = () => {
  const { category: variant } = useLocalSearchParams<{
    category: CategoryVariant;
  }>();
  const {
    result,
    getCategoryItems,
    toggleSelection,
    setAllSelected,
    getSelectedSize,
  } = useAnalysis();

  //  Preview state
  const [previewImageId, setPreviewImageId] = useState<string | null>(null);

  // Guard: no result or invalid variant → redirect
  if (!result || !variant) {
    router.replace("/");
    return null;
  }

  const rawItems = getCategoryItems(variant);

  const duplicateGroups = useMemo(() => {
    if (variant !== "duplicates") return [];
    const groups: DuplicateGroup[] = [];
    let groupIndex = 0;
    let currentGroup: PhotoItem[] = [];
    for (const item of rawItems) {
      if (item.isBest) {
        if (currentGroup.length > 0) {
          groups.push({
            groupId: `group-${groupIndex}`,
            label: "Best Photo",
            items: currentGroup,
          });
          groupIndex++;
        }
        currentGroup = [item];
      } else {
        currentGroup.push(item);
      }
    }
    if (currentGroup.length > 0) {
      groups.push({
        groupId: `group-${groupIndex}`,
        label: "Best Photo",
        items: currentGroup,
      });
    }
    return groups;
  }, [rawItems, variant]);

  const meta = useMemo(() => {
    const titleMap: Record<CategoryVariant, string> = {
      screenshots: "Screenshots",
      duplicates: "Duplicates",
      clutter: "Clutter",
      blurry: "Blurry Photos",
      live: "Live Photos",
    };

    const totalItems = rawItems.length;
    const selectedCount = rawItems.filter((i) => i.selected).length;

    // Use context helper to get total size of selected items
    const selectedSizeBytes = getSelectedSize(variant);
    const selectedSizeFormatted = formatBytes(selectedSizeBytes);

    return {
      title: titleMap[variant] || variant,
      itemCount: totalItems,
      selectedCount,
      selectedSizeBytes,
      selectedSizeFormatted,
    };
  }, [variant, rawItems, getSelectedSize]);

  const {
    selectedCount,
    selectedSizeBytes,
    selectedSizeFormatted,
    itemCount,
    title,
  } = meta;
  const allSelected = itemCount > 0 && selectedCount === itemCount;

  const handleToggleSelectAll = () => {
    setAllSelected(variant, !allSelected);
  };

  const handleDeleteSelected = () => {
    router.push({
      pathname: "/delete-confirmation",
      params: {
        variant,
        label: title,
        itemCount: String(selectedCount),
        totalSize: selectedSizeFormatted,
        totalSizeBytes: String(selectedSizeBytes),
      },
    });
  };

  //  Entrance animations
  const headerEntrance = useEntrance(0);
  const subtitleEntrance = useEntrance(80);
  const footerEntrance = useSheetEntrance(420);

  const handleGoBack = () => router.back();

  const renderHeaderRight = () => (
    <Pressable hitSlop={8} onPress={handleToggleSelectAll}>
      <Text style={styles.headerAction}>
        {allSelected ? "Deselect All" : "Select All"}
      </Text>
    </Pressable>
  );

  const Footer = () => (
    <Animated.View
      style={[
        styles.footer,
        footerEntrance,
        {
          width: Dimensions.get("window").width * 0.95,
          alignSelf: "center",
          backgroundColor: "rgba(8, 7, 26, 0.8)",
          borderColor: "rgba(8, 7, 26, 0.4)",
        },
      ]}
    >
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.8 }}
        colors={[
          "rgba(108, 60, 224, 0)",
          "rgba(108, 60, 224, 0.05)",
          "rgba(108, 60, 224, 0.15)",
          "rgba(108, 60, 224, 0.05)",
          "rgba(108, 60, 224, 0)",
        ]}
        locations={[0, 0.3, 0.5, 0.7, 1]}
        style={styles.summaryGradient}
        pointerEvents="none"
      />
      <View style={styles.footerContent}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerCount}>{selectedCount} Selected</Text>
          <Text style={styles.footerSize}>{selectedSizeFormatted}</Text>
        </View>
        <View style={{ width: "50%" }}>
          <GradientButton
            title="Delete"
            onPress={handleDeleteSelected}
            disabled={selectedCount === 0}
          />
        </View>
      </View>
    </Animated.View>
  );

  //  Dimensions
  const SCREEN_WIDTH = Dimensions.get("window").width;
  const GRID_PADDING = Spacing.four;
  const GRID_GAP = Spacing.two;
  const COLUMNS = 4;
  const TILE_SIZE =
    (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * (COLUMNS - 1)) / COLUMNS;

  const DUPLICATE_COLUMNS = 3;
  const DUPLICATE_TILE_SIZE =
    (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * (DUPLICATE_COLUMNS - 1)) /
    DUPLICATE_COLUMNS;

  //  Render: Duplicates
  if (variant === "duplicates") {
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
          <Text style={styles.title}>{title}</Text>
          {renderHeaderRight()}
        </Animated.View>
        <Animated.Text style={[styles.subtitle, subtitleEntrance]}>
          {itemCount} items · {selectedCount} selected · {selectedSizeFormatted}
        </Animated.Text>

        <FlashList
          data={duplicateGroups}
          keyExtractor={(g) => g.groupId}
          contentContainerStyle={styles.duplicatesListContent}
          ListFooterComponent={<View style={{ height: 100 }} />}
          renderItem={({ item, index }: ListRenderItemInfo<DuplicateGroup>) => (
            <DuplicateGroupRow
              group={item}
              index={index}
              onToggle={toggleSelection}
              category={variant}
              tileSize={DUPLICATE_TILE_SIZE}
              onLongPress={setPreviewImageId}
            />
          )}
        />

        <Footer />

        {/*  Full‑screen image preview modal  */}
        <ImagePreviewModal
          imageId={previewImageId}
          onClose={() => setPreviewImageId(null)}
        />
      </SafeAreaView>
    );
  }

  //  Render: Other categories (grid)
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
        <Text style={styles.title}>{title}</Text>
        {renderHeaderRight()}
      </Animated.View>
      <Animated.Text style={[styles.subtitle, subtitleEntrance]}>
        {itemCount} items · {selectedCount} selected · {selectedSizeFormatted}
      </Animated.Text>

      <FlashList
        data={rawItems}
        keyExtractor={(i) => i.id}
        numColumns={COLUMNS}
        contentContainerStyle={{ paddingBottom: Spacing.four }}
        ListFooterComponent={<View style={{ height: 60 }} />}
        renderItem={({ item, index }: ListRenderItemInfo<PhotoItem>) => {
          const row = Math.floor(index / COLUMNS);
          const isLastInRow = (index + 1) % COLUMNS === 0;
          return (
            <View
              style={{
                marginRight: isLastInRow ? 0 : GRID_GAP,
                marginBottom: GRID_GAP,
              }}
            >
              <PhotoThumbnail
                item={item}
                variant={variant}
                size={TILE_SIZE}
                row={row}
                onToggle={toggleSelection}
                category={variant}
                onLongPress={setPreviewImageId}
              />
            </View>
          );
        }}
      />

      <Footer />

      {/*  Full‑screen image preview modal  */}
      <ImagePreviewModal
        imageId={previewImageId}
        onClose={() => setPreviewImageId(null)}
      />
    </SafeAreaView>
  );
};

export default CategoryDetails;


// Image Preview Modal
const ImagePreviewModal = ({
  imageId,
  onClose,
}: {
  imageId: string | null;
  onClose: () => void;
}) => {
  if (!imageId) return null;

  return (
    <Modal visible={!!imageId} transparent animationType="fade">
      <SafeAreaView style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.95)" }}>
        <TouchableOpacity
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          activeOpacity={1}
          onPress={onClose}
        >
          <Image
            source={{ uri: `ph://${imageId}` }}
            style={{ width: "100%", height: "85%" }}
            contentFit="contain"
            recyclingKey={imageId}
          />
          <Text style={{ color: "white", marginTop: 20, fontSize: 14 }}>
            Tap to close
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
};


// Selection badge
const SelectionBadge = ({ selected }: { selected: boolean }) => {
  if (selected) {
    return (
      <View style={styles.badgeSelected}>
        <Check size={12} strokeWidth={3} color={Brand.textOnPrimary} />
      </View>
    );
  }
  return <View style={styles.badgeUnselected} />;
};

// Photo thumbnail (grid)
const PhotoThumbnail = ({
  item,
  variant,
  size,
  row,
  onToggle,
  category,
  onLongPress,
}: {
  item: PhotoItem;
  variant: CategoryVariant;
  size: number;
  row: number;
  onToggle: (category: CategoryVariant, id: string) => void;
  category: CategoryVariant;
  onLongPress: (id: string) => void;
}) => {
  const isBlurry = variant === "blurry";
  const isLive = variant === "live";

  const shouldAnimate = row < 12;
  const entrance = useEntrance(
    shouldAnimate ? 260 + row * 55 : 0,
    shouldAnimate ? 10 : 0,
  );

  return (
    <Animated.View style={shouldAnimate ? entrance : undefined}>
      <Pressable
        onPress={() => onToggle(category, item.id)}
        onLongPress={() => onLongPress(item.id)}
        delayLongPress={500}
        style={[styles.thumbnail, { width: size, height: size }]}
      >
        <Image
          source={{ uri: item.image }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          recyclingKey={item.id}
        />

        {isBlurry && (
          <BlurView
            intensity={2}
            tint="dark"
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        )}

        {isLive && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
        )}

        {item.isBest && (
          <View style={styles.bestBadge}>
            <Text style={styles.bestBadgeText}>👑</Text>
          </View>
        )}

        <View style={styles.thumbnailBadgeWrap}>
          <SelectionBadge selected={item.selected} />
        </View>
      </Pressable>
    </Animated.View>
  );
};

// Duplicate group row
const DuplicateGroupRow = ({
  group,
  index,
  onToggle,
  category,
  tileSize,
  onLongPress,
}: {
  group: DuplicateGroup;
  index: number;
  onToggle: (category: CategoryVariant, id: string) => void;
  category: CategoryVariant;
  tileSize: number;
  onLongPress: (id: string) => void;
}) => {
  const shouldAnimate = index < 6;
  const entrance = useEntrance(
    shouldAnimate ? 260 + index * 90 : 0,
    shouldAnimate ? 12 : 0,
  );

  return (
    <Animated.View
      style={[styles.duplicateGroup, shouldAnimate ? entrance : undefined]}
    >
      <View style={styles.bestLabelRow}>
        <Text style={styles.bestLabelIcon}>👑</Text>
        <Text style={styles.bestLabelText}>{group.label}</Text>
      </View>
      <View style={styles.duplicateGroupRow}>
        {group.items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => onToggle(category, item.id)}
            onLongPress={() => onLongPress(item.id)}
            delayLongPress={500}
            style={[styles.thumbnail, { width: tileSize, height: tileSize }]}
          >
            <Image
              source={{ uri: item.image }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              recyclingKey={item.id}
            />
            {item.isBest && (
              <View style={styles.bestBadge}>
                <Text style={styles.bestBadgeText}>👑</Text>
              </View>
            )}
            <View style={styles.thumbnailBadgeWrap}>
              <SelectionBadge selected={item.selected} />
            </View>
          </Pressable>
        ))}
      </View>
    </Animated.View>
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
    justifyContent: "space-between",
    marginBottom: 2,
  },
  title: {
    color: Brand.textPrimary,
    fontSize: FontSizes.headline,
    fontWeight: FontWeights.semibold as any,
  },
  headerAction: {
    color: Brand.primaryLight,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.medium as any,
  },
  subtitle: {
    color: Brand.textSecondary,
    fontSize: FontSizes.caption,
    textAlign: "center",
    marginBottom: Spacing.three,
  },
  thumbnail: {
    borderRadius: Radii.small,
    overflow: "hidden",
    backgroundColor: Brand.cardBackground,
  },
  thumbnailBadgeWrap: {
    position: "absolute",
    bottom: 4,
    right: 4,
  },
  badgeSelected: {
    width: 18,
    height: 18,
    borderRadius: Radii.full,
    backgroundColor: Brand.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
  },
  badgeUnselected: {
    width: 18,
    height: 18,
    borderRadius: Radii.full,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.7)",
  },
  bestBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: Radii.small,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  bestBadgeText: {
    fontSize: 12,
  },
  liveBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: Radii.small,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Brand.textPrimary,
  },
  liveBadgeText: {
    color: Brand.textPrimary,
    fontSize: 9,
    fontWeight: FontWeights.semibold as any,
  },
  duplicatesListContent: {
    paddingBottom: Spacing.four,
  },
  duplicateGroup: {
    marginBottom: Spacing.three,
  },
  bestLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: Spacing.two,
  },
  bestLabelIcon: {
    fontSize: 11,
  },
  bestLabelText: {
    color: "#E8B84B",
    fontSize: FontSizes.caption,
    fontWeight: FontWeights.medium as any,
  },
  duplicateGroupRow: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    borderRadius: Radii.xlarge,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: Radii.xlarge,
  },
  footerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    zIndex: 2,
  },
  footerLeft: {
    flex: 1,
  },
  footerCount: {
    color: Brand.textPrimary,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.semibold,
  },
  footerSize: {
    color: Brand.textSecondary,
    fontSize: FontSizes.caption,
    marginTop: 2,
  },
});
