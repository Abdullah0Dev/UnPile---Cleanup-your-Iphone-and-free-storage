import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import ExpoPhotoAnalyzerModule from "../../modules/expo-photo-analyzer/src/ExpoPhotoAnalyzerModule";
export type AnalysisResult = {
  screenshots: string[];
  screenshotCandidates: string[];
  duplicateGroups: { bestAssetId: string; duplicateAssetIds: string[] }[];
  clutter: string[];
  blurry: string[];
  livePhotos: string[];
  livePhotoCandidates: string[];
  totalSavingsBytes: number;
  categorySavings: {
    screenshots: number;
    duplicates: number;
    blurry: number;
    clutter: number;
    livePhotos: number;
  };
  assetSizes: Record<string, number>;
};

export type CategoryItem = {
  id: string;
  selected: boolean;
  isBest: boolean;
  image: string; // `ph://${id}`
};

export type CategoryKey =
  | "screenshots"
  | "duplicates"
  | "clutter"
  | "blurry"
  | "live";

type CategorySelectionOverrides = {
  [category in CategoryKey]?: {
    [itemId: string]: boolean;
  };
};

type AnalysisContextType = {
  result: AnalysisResult | null;
  isLoadingCache: boolean;
  isLoading: boolean;
  progress: number;
  category: string;
  startAnalysis: () => Promise<void>;
  clearResult: () => void;
  getCategoryItems: (category: CategoryKey) => CategoryItem[];
  getSelectedItems: (category?: CategoryKey) => string[];
  toggleSelection: (category: CategoryKey, itemId: string) => void;
  setAllSelected: (category: CategoryKey, selected: boolean) => void;
  resetSelections: (category?: CategoryKey) => void;
  removeItems: (ids: string[]) => void;
  getAssetSize: (assetId: string) => number;
  getTotalSizeForIds: (ids: string[]) => number;
  getSelectedSize: (category?: CategoryKey) => number;
};

const AnalysisContext = createContext<AnalysisContextType | undefined>(
  undefined,
);

const STORAGE_KEY = "photoAnalysisResult";

//  Format bytes (utility function, not part of context)
export function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export const AnalysisProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [category, setCategory] = useState("");
  const [overrides, setOverrides] = useState<CategorySelectionOverrides>({});
  const [isLoadingCache, setIsLoadingCache] = useState(true);

  // Load cached result on mount
  useEffect(() => {
    const loadCached = async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setResult(parsed);
        } catch (_) {}
      }
      setIsLoadingCache(false);
    };
    loadCached();
  }, []);

  const startAnalysis = async () => {
    setIsLoading(true);
    setProgress(0);
    setCategory("");
    setResult(null);
    setOverrides({});

    const subscription = ExpoPhotoAnalyzerModule.addListener(
      "onProgress",
      (event: any) => {
        console.log(
          `📡 Event: progress=${event.progress}, category=${event.category}`,
        );
        setProgress(event.progress);
        setCategory(event.category);
      },
    );

    try {
      console.log("📱 Calling native analyzePhotos...");
      const data = await ExpoPhotoAnalyzerModule.analyzePhotos();
      console.log(" Native analysis returned:", data);
      setResult(data);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("❌ Analysis failed:", error);
    } finally {
      subscription.remove();
      setIsLoading(false);
    }
  };

  const clearResult = async () => {
    setResult(null);
    setOverrides({});
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  //  Helper: compute default selected state based on raw data
  const getDefaultSelected = (
    category: CategoryKey,
    itemId: string,
  ): boolean => {
    if (!result) return false;
    switch (category) {
      case "screenshots":
        return result.screenshotCandidates.includes(itemId);
      case "duplicates": {
        for (const group of result.duplicateGroups) {
          if (group.bestAssetId === itemId) return false;
          if (group.duplicateAssetIds.includes(itemId)) return true;
        }
        return false;
      }
      case "clutter":
        return result.clutter.includes(itemId);
      case "blurry":
        return result.blurry.includes(itemId);
      case "live":
        return result.livePhotoCandidates.includes(itemId);
      default:
        return false;
    }
  };

  //  Get category items with overrides
  const getCategoryItems = (category: CategoryKey): CategoryItem[] => {
    if (!result) return [];

    let ids: string[] = [];
    switch (category) {
      case "screenshots":
        ids = result.screenshots || [];
        break;
      case "duplicates": {
        const allIds: string[] = [];
        for (const group of result.duplicateGroups) {
          allIds.push(group.bestAssetId);
          allIds.push(...group.duplicateAssetIds);
        }
        ids = allIds;
        break;
      }
      case "clutter":
        ids = result.clutter || [];
        break;
      case "blurry":
        ids = result.blurry || [];
        break;
      case "live":
        ids = result.livePhotos || [];
        break;
      default:
        return [];
    }

    const categoryOverrides = overrides[category] || {};

    let items = ids.map((id) => {
      const defaultSelected = getDefaultSelected(category, id);
      const overridden = categoryOverrides[id];
      const selected = overridden !== undefined ? overridden : defaultSelected;
      const isBest =
        category === "duplicates" &&
        result.duplicateGroups.some((g) => g.bestAssetId === id);
      return {
        id,
        selected,
        isBest,
        image: `ph://${id}`,
      };
    });

    // Reorder screenshots to mix selected and unselected
    if (category === "screenshots") {
      items = interleaveItems(items);
    }
    return items;
  };

  //  Get selected IDs (optionally for a specific category)
  const getSelectedItems = (category?: CategoryKey): string[] => {
    if (!result) return [];
    const categories: CategoryKey[] = category
      ? [category]
      : ["screenshots", "duplicates", "clutter", "blurry", "live"];
    const allIds: string[] = [];
    for (const cat of categories) {
      const items = getCategoryItems(cat);
      allIds.push(
        ...items.filter((item) => item.selected).map((item) => item.id),
      );
    }
    return allIds;
  };

  //  Toggle selection for a single item
  const toggleSelection = (category: CategoryKey, itemId: string) => {
    setOverrides((prev) => {
      const categoryOverrides = prev[category] || {};
      const currentDefault = getDefaultSelected(category, itemId);
      const currentOverride = categoryOverrides[itemId];
      const newValue =
        currentOverride !== undefined ? !currentOverride : !currentDefault;
      if (newValue === currentDefault) {
        const { [itemId]: _, ...rest } = categoryOverrides;
        return {
          ...prev,
          [category]: Object.keys(rest).length > 0 ? rest : undefined,
        };
      } else {
        return {
          ...prev,
          [category]: {
            ...categoryOverrides,
            [itemId]: newValue,
          },
        };
      }
    });
  };

  //  Set all items in a category to the same selected state
  const setAllSelected = (category: CategoryKey, selected: boolean) => {
    if (!result) return;
    const items = getCategoryItems(category);
    const newOverrides: { [id: string]: boolean } = {};
    for (const item of items) {
      const defaultSelected = getDefaultSelected(category, item.id);
      if (selected !== defaultSelected) {
        newOverrides[item.id] = selected;
      }
    }
    setOverrides((prev) => ({
      ...prev,
      [category]:
        Object.keys(newOverrides).length > 0 ? newOverrides : undefined,
    }));
  };

  //  Reset selections to default (for a category or all)
  const resetSelections = (category?: CategoryKey) => {
    if (category) {
      setOverrides((prev) => {
        const { [category]: _, ...rest } = prev;
        return rest;
      });
    } else {
      setOverrides({});
    }
  };

  //  Remove items from the result (after deletion)
  const removeItems = (ids: string[]) => {
    if (!result) return;
    const removeSet = new Set(ids);

    const filterArray = (arr: string[]) =>
      arr.filter((id) => !removeSet.has(id));

    const filteredGroups = result.duplicateGroups
      .map((group) => ({
        ...group,
        duplicateAssetIds: filterArray(group.duplicateAssetIds),
      }))
      .filter((group) => {
        const bestRemoved = removeSet.has(group.bestAssetId);
        const hasDuplicates = group.duplicateAssetIds.length > 0;
        return !bestRemoved || hasDuplicates;
      });

    const newResult: AnalysisResult = {
      ...result,
      screenshots: filterArray(result.screenshots),
      screenshotCandidates: filterArray(result.screenshotCandidates),
      duplicateGroups: filteredGroups,
      clutter: filterArray(result.clutter),
      blurry: filterArray(result.blurry),
      livePhotos: filterArray(result.livePhotos),
      livePhotoCandidates: filterArray(result.livePhotoCandidates),
      totalSavingsBytes: Math.max(
        0,
        result.totalSavingsBytes -
          ids.reduce((sum, id) => sum + (result.assetSizes[id] || 0), 0),
      ),
      categorySavings: {
        screenshots: 0,
        duplicates: 0,
        blurry: 0,
        clutter: 0,
        livePhotos: 0,
      },
      assetSizes: { ...result.assetSizes },
    };
    // Remove deleted asset sizes
    for (const id of ids) {
      delete newResult.assetSizes[id];
    }

    setResult(newResult);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newResult));

    setOverrides((prev) => {
      const newOverrides = { ...prev };
      for (const cat of Object.keys(newOverrides) as CategoryKey[]) {
        const catOverrides = newOverrides[cat];
        if (catOverrides) {
          for (const id of ids) {
            delete catOverrides[id];
          }
          if (Object.keys(catOverrides).length === 0) {
            delete newOverrides[cat];
          }
        }
      }
      return newOverrides;
    });
  };
  // Helper: interleave selected and unselected items
  function interleaveItems(items: CategoryItem[]): CategoryItem[] {
    const selected = items.filter((item) => item.selected);
    const unselected = items.filter((item) => !item.selected);
    const result: CategoryItem[] = [];
    let i = 0,
      j = 0;
    // Alternate: selected, unselected, selected, unselected, ...
    while (i < selected.length || j < unselected.length) {
      if (i < selected.length) result.push(selected[i++]);
      if (j < unselected.length) result.push(unselected[j++]);
    }
    return result;
  }
  //  Size helpers

  const getAssetSize = (assetId: string): number => {
    return result?.assetSizes?.[assetId] ?? 0;
  };

  const getTotalSizeForIds = (ids: string[]): number => {
    if (!result) return 0;
    return ids.reduce((sum, id) => sum + (result.assetSizes[id] || 0), 0);
  };

  const getSelectedSize = (category?: CategoryKey): number => {
    const ids = getSelectedItems(category);
    return getTotalSizeForIds(ids);
  };

  return (
    <AnalysisContext.Provider
      value={{
        isLoadingCache,
        result,
        isLoading,
        progress,
        category,
        startAnalysis,
        clearResult,
        getCategoryItems,
        getSelectedItems,
        toggleSelection,
        setAllSelected,
        resetSelections,
        removeItems,
        getAssetSize,
        getTotalSizeForIds,
        getSelectedSize,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
};

export const useAnalysis = () => {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be used within AnalysisProvider");
  return ctx;
};
