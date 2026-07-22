import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View, Dimensions } from "react-native";
import { FlashList, ListRenderItemInfo } from "@shopify/flash-list";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { ChevronLeft, Check } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Animated from "react-native-reanimated";

import { GradientButton } from "@/components/ui/gradient-button";
import {
  Brand,
  FontSizes,
  FontWeights,
  Radii,
  Spacing,
} from "@/constants/theme";
import { useEntrance, useHeroEntrance } from "@/hooks/use-entrance";

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

export type CategoryVariant = "screenshots" | "duplicates" | "blurry" | "live";

type PhotoItem = {
  id: string;
  /** Placeholder image source — swap for real asset/uri later. */
  image: any;
  /** Pre-selected for deletion by the "smart" auto-select logic. */
  selected: boolean;
  /** Only relevant for the "duplicates" variant: marks the kept/best photo in a group. */
  isBest?: boolean;
  /** Only relevant for "duplicates": groups photos into visual clusters. */
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
// Variant metadata (title, subtitle counts, header label style)
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
// Placeholder data generation
// Replace image sources with real asset/URI data when wiring up.
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

// Only the first N cells get a staggered mount-in animation. Cells beyond
// this (reached by scrolling) render immediately at full opacity — this
// avoids FlashList's cell-recycling replaying the animation on every scroll,
// which would look janky rather than smooth.
const MAX_STAGGERED_CELLS = 16;
const CELL_STAGGER_MS = 28;
const GRID_BASE_DELAY = 260;

// ─────────────────────────────────────────────────────────────────────────
// Selection indicator (filled checkmark vs. empty ring)
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
// Thumbnail cell — renders differently per variant, staggers in on first mount
// ─────────────────────────────────────────────────────────────────────────

const PhotoThumbnail = ({
  item,
  variant,
  size,
  index,
  onToggle,
}: {
  item: PhotoItem;
  variant: CategoryVariant;
  size: number;
  index: number;
  onToggle: (id: string) => void;
}) => {
  const isBlurry = variant === "blurry";
  const isLive = variant === "live";

  const shouldAnimate = index < MAX_STAGGERED_CELLS;
  const entrance = useEntrance(
    shouldAnimate ? GRID_BASE_DELAY + index * CELL_STAGGER_MS : 0,
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
          // Recycled FlashList cells reuse this component instance; a stable
          // cache key keyed on the item id (not array index) keeps the right
          // image bound to the right cell as rows recycle.
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
// Duplicate group row — its own staggered entrance, rendered as a FlashList item
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
  const shouldAnimate = index < 6; // duplicate groups are few; animate them all reasonably
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

  const selectedCount =
    variant === "duplicates"
      ? duplicateGroups.reduce(
          (sum, g) => sum + g.items.filter((i) => i.selected).length,
          0,
        )
      : gridItems.filter((i) => i.selected).length;

  // ── Shared entrance timings ──────────────────────────────────────────
  const headerEntrance = useEntrance(0);
  const subtitleEntrance = useEntrance(80);
  const footerEntrance = useHeroEntrance(GRID_BASE_DELAY + 500);

  const handleGoBack = () => router.back();

  const renderHeaderRight = () => (
    <Pressable hitSlop={8}>
      <Text style={styles.headerAction}>Select</Text>
    </Pressable>
  );

  const Footer = () => (
    <Animated.View style={[styles.footer, footerEntrance]}>
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
      <View style={styles.footerLeft}>
        <Text style={styles.footerCount}>{selectedCount} Selected</Text>
        <Text style={styles.footerSize}>{meta.totalSize}</Text>
      </View>
      <View style={{ width: "50%" }}>
        <GradientButton title="Delete" onPress={() => {}} />
      </View>
    </Animated.View>
  );

  // ── Duplicates: grouped-by-3 layout with "Best Photo" label ──────────
  if (variant === "duplicates") {
    return (
      <SafeAreaView style={styles.screen}>
        <Animated.View style={[styles.header, headerEntrance]}>
          <Pressable onPress={handleGoBack}>
            <ChevronLeft strokeWidth={2} color={Brand.textPrimary} />
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

  // ── Screenshots / Blurry / Live: uniform grid, styling differs per-cell ──
  return (
    <SafeAreaView style={styles.screen}>
      <Animated.View style={[styles.header, headerEntrance]}>
        <Pressable onPress={handleGoBack}>
          <ChevronLeft strokeWidth={2} color={Brand.textPrimary} />
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
        ItemSeparatorComponent={() => <View style={{ height: GRID_GAP }} />}
        renderItem={({ item, index }: ListRenderItemInfo<PhotoItem>) => (
          <View
            style={{
              paddingRight: (index + 1) % COLUMNS === 0 ? 0 : GRID_GAP,
            }}
          >
            <PhotoThumbnail
              item={item}
              variant={variant}
              size={TILE_SIZE}
              index={index}
              onToggle={toggleGridItem}
            />
          </View>
        )}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.divider,
    borderTopRightRadius: Radii.xlarge,
    borderTopLeftRadius: Radii.xlarge,
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
  footerLeft: {
    gap: 2,
  },
  footerCount: {
    color: Brand.textPrimary,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.semibold as any,
  },
  footerSize: {
    color: Brand.textSecondary,
    fontSize: FontSizes.caption,
  },
});