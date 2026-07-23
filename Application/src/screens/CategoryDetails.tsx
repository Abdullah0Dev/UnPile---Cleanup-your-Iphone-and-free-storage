import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View, Dimensions } from "react-native";
import { FlashList, ListRenderItemInfo } from "@shopify/flash-list";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { ChevronLeft, Check } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Animated from "react-native-reanimated";
import { useColorScheme } from "react-native";
import { GradientButton } from "@/components/ui/gradient-button";
import {
  Brand,
  FontSizes,
  FontWeights,
  Radii,
  Spacing,
} from "@/constants/theme";
import { useEntrance, useSheetEntrance } from "@/hooks/use-entrance";

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

export type CategoryVariant = "screenshots" | "duplicates" | "blurry" | "live";

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

type CategoryDetailsProps = {
  variant: CategoryVariant;
};

// ─────────────────────────────────────────────────────────────────────────
// Variant metadata
// ─────────────────────────────────────────────────────────────────────────

const VARIANT_META: Record<
  CategoryVariant,
  { title: string; itemCount: number; totalSize: string }
> = {
  screenshots: { title: "Screenshots", itemCount: 874, totalSize: "4.2 GB" },
  duplicates: { title: "Duplicates", itemCount: 342, totalSize: "8.7 GB" },
  blurry: { title: "Blurry Photos", itemCount: 218, totalSize: "2.1 GB" },
  live: { title: "Live Photos", itemCount: 220, totalSize: "8.6 GB" },
};

// ─────────────────────────────────────────────────────────────────────────
// Placeholder data generation — replace with real asset/URI data later.
// ─────────────────────────────────────────────────────────────────────────

function buildGridItems(
  count: number,
  autoSelectPattern: (i: number) => boolean,
): PhotoItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i}`,
    image: { uri: `https://picsum.photos/seed/unpile-${i}/300/300` },
    selected: autoSelectPattern(i),
  }));
}

function buildDuplicateGroups(groupCount: number): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  for (let g = 0; g < groupCount; g++) {
    const groupId = `group-${g}`;
    groups.push({
      groupId,
      label: g === 0 ? "Best Photo" : "Best",
      items: [
        {
          id: `${groupId}-best`,
          image: { uri: `https://picsum.photos/seed/dup-${g}-0/300/300` },
          selected: false,
          isBest: true,
          groupId,
        },
        {
          id: `${groupId}-1`,
          image: { uri: `https://picsum.photos/seed/dup-${g}-1/300/300` },
          selected: true,
          groupId,
        },
        {
          id: `${groupId}-2`,
          image: { uri: `https://picsum.photos/seed/dup-${g}-2/300/300` },
          selected: true,
          groupId,
        },
      ],
    });
  }
  return groups;
}

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

// Stagger is keyed by ROW, not raw index — every cell in the same row
// animates together, and only the first few rows animate at all (cells
// reached by scrolling render instantly; FlashList recycles views, so
// animating recycled cells on every scroll would look broken, which is
// exactly the "half animate, half don't" bug this replaces).
const MAX_STAGGERED_ROWS = 5;
const ROW_STAGGER_MS = 55;
const GRID_BASE_DELAY = 260;

// ─────────────────────────────────────────────────────────────────────────
// Selection indicator
// ─────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────
// Thumbnail cell — row-based stagger, not per-cell index
// ─────────────────────────────────────────────────────────────────────────

const PhotoThumbnail = ({
  item,
  variant,
  size,
  row,
  onToggle,
}: {
  item: PhotoItem;
  variant: CategoryVariant;
  size: number;
  row: number;
  onToggle: (id: string) => void;
}) => {
  const isBlurry = variant === "blurry";
  const isLive = variant === "live";

  const shouldAnimate = row < MAX_STAGGERED_ROWS;
  const entrance = useEntrance(
    shouldAnimate ? GRID_BASE_DELAY + row * ROW_STAGGER_MS : 0,
    shouldAnimate ? 10 : 0,
  );

  return (
    <Animated.View style={shouldAnimate ? entrance : undefined}>
      <Pressable
        onPress={() => onToggle(item.id)}
        style={[styles.thumbnail, { width: size, height: size }]}
      >
        <Image
          source={item.image}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          recyclingKey={item.id}
        />

        {isBlurry && (
          <BlurView
            intensity={35}
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

        <View style={styles.thumbnailBadgeWrap}>
          <SelectionBadge selected={item.selected} />
        </View>
      </Pressable>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Duplicate group row
// ─────────────────────────────────────────────────────────────────────────

const DuplicateGroupRow = ({
  group,
  index,
  onToggle,
}: {
  group: DuplicateGroup;
  index: number;
  onToggle: (id: string) => void;
}) => {
  const shouldAnimate = index < 6;
  const entrance = useEntrance(
    shouldAnimate ? GRID_BASE_DELAY + index * 90 : 0,
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
            onPress={() => onToggle(item.id)}
            style={[
              styles.thumbnail,
              { width: DUPLICATE_TILE_SIZE, height: DUPLICATE_TILE_SIZE },
            ]}
          >
            <Image
              source={item.image}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              recyclingKey={item.id}
            />
            <View style={styles.thumbnailBadgeWrap}>
              <SelectionBadge selected={item.selected} />
            </View>
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────

const CategoryDetails = ({ variant }: CategoryDetailsProps) => {
  const meta = VARIANT_META[variant];

  const [gridItems, setGridItems] = useState<PhotoItem[]>(() => {
    switch (variant) {
      case "screenshots":
        return buildGridItems(40, (i) => ![2, 9].includes(i));
      case "blurry":
        return buildGridItems(40, (i) =>
          [0, 2, 5, 7, 9, 12, 15, 16, 19].includes(i),
        );
      case "live":
        return buildGridItems(40, (i) => ![2, 6, 10, 13, 17].includes(i));
      default:
        return [];
    }
  });

  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>(
    () => (variant === "duplicates" ? buildDuplicateGroups(6) : []),
  );

  const toggleGridItem = (id: string) => {
    setGridItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, selected: !it.selected } : it)),
    );
  };

  const toggleDuplicateItem = (id: string) => {
    setDuplicateGroups((prev) =>
      prev.map((group) => ({
        ...group,
        items: group.items.map((it) =>
          it.id === id ? { ...it, selected: !it.selected } : it,
        ),
      })),
    );
  };

  const totalItemCount =
    variant === "duplicates"
      ? duplicateGroups.reduce((sum, g) => sum + g.items.length, 0)
      : gridItems.length;

  const selectedCount =
    variant === "duplicates"
      ? duplicateGroups.reduce(
          (sum, g) => sum + g.items.filter((i) => i.selected).length,
          0,
        )
      : gridItems.filter((i) => i.selected).length;

  const allSelected = totalItemCount > 0 && selectedCount === totalItemCount;

  // ── "Select" header action → real select-all / deselect-all toggle ──
  const handleToggleSelectAll = () => {
    if (variant === "duplicates") {
      setDuplicateGroups((prev) =>
        prev.map((group) => ({
          ...group,
          items: group.items.map((it) => ({ ...it, selected: !allSelected })),
        })),
      );
    } else {
      setGridItems((prev) =>
        prev.map((it) => ({ ...it, selected: !allSelected })),
      );
    }
  };

  // ── Navigate to Delete Confirmation, carrying this category's context ──
  const handleDeleteSelectedCategory = () => {
    router.push({
      pathname: "/delete-confirmation",
      params: {
        variant,
        label: meta.title,
        itemCount: String(selectedCount),
        totalSize: meta.totalSize,
      },
    });
  };

  // ── Shared entrance timings ──────────────────────────────────────────
  const headerEntrance = useEntrance(0);
  const subtitleEntrance = useEntrance(80);
  // Footer slides up like a sheet, independent of grid row count so it
  // doesn't wait on scrollable content that may never fully render.
  const footerEntrance = useSheetEntrance(420);

  const handleGoBack = () => router.back();

  const renderHeaderRight = () => (
    <Pressable hitSlop={8} onPress={handleToggleSelectAll}>
      <Text style={styles.headerAction}>
        {allSelected ? "Deselect All" : "Select All"}
      </Text>
    </Pressable>
  );
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const Footer = () => (
    <Animated.View
      style={[
        styles.footer,
        footerEntrance,
        {
          width: SCREEN_WIDTH * 0.92,
          alignSelf: "center",
          backgroundColor: !isDark
            ? 'rgba(8, 7, 26, 0.8)'   // matches your background
            : 'rgba(255, 255, 255, 0.2)',
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
        },
      ]}
    >
      {/* Glass background */}
      <BlurView
          intensity={isDark ? 30 : 60}  // higher for light mode
        tint={isDark ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />
      {/* Optional subtle gradient overlay (for colour accent) */}
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
        pointerEvents="none" // let touches pass through to buttons
      />
      {/* Content */}
      <View style={styles.footerContent}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerCount}>{selectedCount} Selected</Text>
          <Text style={styles.footerSize}>{meta.totalSize}</Text>
        </View>
        <View style={{ width: "50%" }}>
          <GradientButton
            title="Delete"
            onPress={handleDeleteSelectedCategory}
            disabled={selectedCount === 0}
          />
        </View>
      </View>
    </Animated.View>
  );

  // ── Duplicates: grouped-by-3 layout with "Best Photo" label ──────────
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
          <Text style={styles.title}>{meta.title}</Text>
          {renderHeaderRight()}
        </Animated.View>
        <Animated.Text style={[styles.subtitle, subtitleEntrance]}>
          {meta.itemCount} items · {meta.totalSize}
        </Animated.Text>

        <FlashList
          data={duplicateGroups}
          keyExtractor={(g) => g.groupId}
          // estimatedItemSize={DUPLICATE_TILE_SIZE + 40}
          contentContainerStyle={styles.duplicatesListContent}
          renderItem={({ item, index }: ListRenderItemInfo<DuplicateGroup>) => (
            <DuplicateGroupRow
              group={item}
              index={index}
              onToggle={toggleDuplicateItem}
            />
          )}
        />

        <Footer />
      </SafeAreaView>
    );
  }

  // ── Screenshots / Blurry / Live: uniform grid ────────────────────────
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
        <Text style={styles.title}>{meta.title}</Text>
        {renderHeaderRight()}
      </Animated.View>
      <Animated.Text style={[styles.subtitle, subtitleEntrance]}>
        {meta.itemCount} items · {meta.totalSize}
      </Animated.Text>

      <FlashList
        data={gridItems}
        keyExtractor={(i) => i.id}
        numColumns={COLUMNS}
        // estimatedItemSize={TILE_SIZE}
        contentContainerStyle={{ paddingBottom: Spacing.four }}
        // Gap is handled purely by margin on each cell wrapper (below) —
        // no ItemSeparatorComponent + manual paddingRight math, which was
        // the source of uneven-looking rows before.
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
                onToggle={toggleGridItem}
              />
            </View>
          );
        }}
      />

      <Footer />
    </SafeAreaView>
  );
};

export default CategoryDetails;

// ─────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.appBackground,
    paddingHorizontal: Spacing.four,
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
    gap: GRID_GAP,
  },

  footer: {
    position: "absolute",
    bottom: 20, // or use safe area insets
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
