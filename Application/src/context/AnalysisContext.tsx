import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import ExpoPhotoAnalyzerModule from "../../modules/expo-photo-analyzer/src/ExpoPhotoAnalyzerModule";

// ───────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────

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
};

export type CategoryItem = {
  id: string;
  selected: boolean;
  isBest?: boolean;
  image: string; // `ph://${id}`
};

export type CategoryKey = "screenshots" | "duplicates" | "clutter" | "blurry" | "live";

type CategorySelectionOverrides = {
  [category in CategoryKey]?: {
    [itemId: string]: boolean; // true = selected, false = deselected (override)
  };
};

type AnalysisContextType = {
  result: AnalysisResult | null;
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
  removeItems: (ids: string[]) => void; // ✅ New: remove IDs from result
};

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

const STORAGE_KEY = "photoAnalysisResult";

// ───────────────────────────────────────────────────────────────
// Provider
// ───────────────────────────────────────────────────────────────

export const AnalysisProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [category, setCategory] = useState("");
  const [overrides, setOverrides] = useState<CategorySelectionOverrides>({});

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
    };
    loadCached();
  }, []);

  const startAnalysis = async () => {
    setIsLoading(true);
    setProgress(0);
    setCategory("");
    setResult(null);
    setOverrides({});

    const subscription = ExpoPhotoAnalyzerModule.addListener("onProgress", (event: any) => {
      console.log(`📡 Event: progress=${event.progress}, category=${event.category}`);
      setProgress(event.progress);
      setCategory(event.category);
    });

    try {
      console.log("📱 Calling native analyzePhotos...");
      const data = await ExpoPhotoAnalyzerModule.analyzePhotos();
      console.log("✅ Native analysis returned:", data);
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

  // ── Helper: compute default selected state based on raw data ──
  const getDefaultSelected = (category: CategoryKey, itemId: string): boolean => {
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

  // ── Get category items with overrides ──────────────────────
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

    return ids.map((id) => {
      const defaultSelected = getDefaultSelected(category, id);
      const overridden = categoryOverrides[id];
      const selected = overridden !== undefined ? overridden : defaultSelected;
      const isBest = category === "duplicates" && result.duplicateGroups.some((g) => g.bestAssetId === id);
      return {
        id,
        selected,
        isBest,
        image: `ph://${id}`,
      };
    });
  };

  // ── Get selected IDs (optionally for a specific category) ──
  const getSelectedItems = (category?: CategoryKey): string[] => {
    if (!result) return [];
    const categories: CategoryKey[] = category ? [category] : ["screenshots", "duplicates", "clutter", "blurry", "live"];
    const allIds: string[] = [];
    for (const cat of categories) {
      const items = getCategoryItems(cat);
      allIds.push(...items.filter((item) => item.selected).map((item) => item.id));
    }
    return allIds;
  };

  // ── Toggle selection for a single item ──────────────────────
  const toggleSelection = (category: CategoryKey, itemId: string) => {
    setOverrides((prev) => {
      const categoryOverrides = prev[category] || {};
      const currentDefault = getDefaultSelected(category, itemId);
      const currentOverride = categoryOverrides[itemId];
      const newValue = currentOverride !== undefined ? !currentOverride : !currentDefault;
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

  // ── Set all items in a category to the same selected state ──
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
      [category]: Object.keys(newOverrides).length > 0 ? newOverrides : undefined,
    }));
  };

  // ── Reset selections to default (for a category or all) ──
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

  // ── Remove items from the result (after deletion) ──────────
  const removeItems = (ids: string[]) => {
    if (!result) return;
    const removeSet = new Set(ids);

    // Helper to filter array
    const filterArray = (arr: string[]) => arr.filter(id => !removeSet.has(id));

    // Remove from duplicate groups and filter empty groups
    const filteredGroups = result.duplicateGroups
      .map(group => ({
        ...group,
        duplicateAssetIds: filterArray(group.duplicateAssetIds),
      }))
      .filter(group => {
        // Keep group if bestAssetId is not removed OR there are still duplicateAssetIds
        const bestRemoved = removeSet.has(group.bestAssetId);
        const hasDuplicates = group.duplicateAssetIds.length > 0;
        return !bestRemoved || hasDuplicates;
      });

    // Build new result
    const newResult: AnalysisResult = {
      ...result,
      screenshots: filterArray(result.screenshots),
      screenshotCandidates: filterArray(result.screenshotCandidates),
      duplicateGroups: filteredGroups,
      clutter: filterArray(result.clutter),
      blurry: filterArray(result.blurry),
      livePhotos: filterArray(result.livePhotos),
      livePhotoCandidates: filterArray(result.livePhotoCandidates),
      // Update savings: we'll subtract the size of removed items from totalSavingsBytes
      totalSavingsBytes: Math.max(0, result.totalSavingsBytes - (ids.reduce((sum, id) => sum + 1, 0) * 1024 * 1024)), // Temporary approximation
      // Recompute categorySavings? For now we'll keep them as is but the totals will be inaccurate.
      // We'll set categorySavings to zeros to force recalc on next scan.
      categorySavings: {
        screenshots: 0,
        duplicates: 0,
        blurry: 0,
        clutter: 0,
        livePhotos: 0,
      }
    };

    setResult(newResult);
    // Save to AsyncStorage
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newResult));

    // Also remove any overrides for the deleted IDs
    setOverrides(prev => {
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

  return (
    <AnalysisContext.Provider
      value={{
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
        removeItems, // ✅ exposed
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