import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  startAnalysis: () => Promise<boolean>;
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

const STORAGE_KEY = "photoAnalysisResult_v2";

//  Format bytes (utility function, not part of context)
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const digitsFor = (i: number) => (i <= 1 ? 0 : i === 2 ? 1 : 2);

  let size = bytes;
  let i = 0;
  while (size >= 1000 && i < units.length - 1) {
    size /= 1000;
    i++;
  }
  // rounding can push "999.96" up to "1000.0", so bump to the next unit
  if (i < units.length - 1 && Number(size.toFixed(digitsFor(i))) >= 1000) {
    size /= 1000;
    i++;
  }
  return `${size.toFixed(digitsFor(i))} ${units[i]}`;
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

  const runningRef = useRef(false);

  const startAnalysis = async (): Promise<boolean> => {
    if (runningRef.current) return false;
    runningRef.current = true;

    setIsLoading(true);
    setProgress(0);
    setCategory("");
    setResult(null);
    setOverrides({});

    const subscription = ExpoPhotoAnalyzerModule.addListener(
      "onProgress",
      (e: any) => {
        setProgress((p) => Math.max(p, e.progress)); // never goes backwards
        setCategory(e.category);
      },
    );

    let ok = false;
    try {
      const data = await ExpoPhotoAnalyzerModule.analyzePhotos();
      setResult(data);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      ok = true;
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      subscription.remove();
      runningRef.current = false;
      setIsLoading(false);
    }
    return ok;
  };

  const clearResult = async () => {
    setResult(null);
    setOverrides({});
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  const lookups = useMemo(() => {
    if (!result) return null;
    const bestIds = new Set<string>();
    const dupIds = new Set<string>();
    for (const g of result.duplicateGroups) {
      bestIds.add(g.bestAssetId);
      g.duplicateAssetIds.forEach((id) => dupIds.add(id));
    }
    return {
      screenshotCandidates: new Set(result.screenshotCandidates),
      clutter: new Set(result.clutter),
      blurry: new Set(result.blurry),
      liveCandidates: new Set(result.livePhotoCandidates),
      bestIds,
      dupIds,
    };
  }, [result]);

  const getDefaultSelected = (
    category: CategoryKey,
    itemId: string,
  ): boolean => {
    if (!lookups) return false;
    switch (category) {
      case "screenshots":
        return lookups.screenshotCandidates.has(itemId);
      case "duplicates":
        return !lookups.bestIds.has(itemId) && lookups.dupIds.has(itemId);
      case "clutter":
        return lookups.clutter.has(itemId);
      case "blurry":
        return lookups.blurry.has(itemId);
      case "live":
        return lookups.liveCandidates.has(itemId);
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
   //  Remove items from the result (after deletion)
  const removeItems = (ids: string[]) => {
    if (!result) return;
    const removeSet = new Set(ids);

    const filterArray = (arr: string[]) =>
      arr.filter((id) => !removeSet.has(id));

    // FIX: previously a group whose best photo survived but had 0 duplicates left
    // stayed in the list as a lone item, and a group whose best was deleted kept
    // pointing at the deleted id. Now: drop groups with no duplicates left, and
    // promote the first surviving duplicate to "best" if the best was deleted.
    const filteredGroups = result.duplicateGroups
      .map((group) => {
        const remainingDupes = filterArray(group.duplicateAssetIds);
        if (remainingDupes.length === 0) return null;

        if (removeSet.has(group.bestAssetId)) {
          return {
            bestAssetId: remainingDupes[0],
            duplicateAssetIds: remainingDupes.slice(1),
          };
        }
        return { ...group, duplicateAssetIds: remainingDupes };
      })
      .filter(
        (g): g is { bestAssetId: string; duplicateAssetIds: string[] } =>
          g !== null && g.duplicateAssetIds.length > 0,
      );

    const screenshots = filterArray(result.screenshots);
    const screenshotCandidates = filterArray(result.screenshotCandidates);
    const clutter = filterArray(result.clutter);
    const blurry = filterArray(result.blurry);
    const livePhotos = filterArray(result.livePhotos);
    const livePhotoCandidates = filterArray(result.livePhotoCandidates);

    // Remove deleted asset sizes
    const assetSizes = { ...result.assetSizes };
    for (const id of ids) {
      delete assetSizes[id];
    }

    const sumSizes = (list: string[]) =>
      list.reduce((sum, id) => sum + (assetSizes[id] || 0), 0);

    // FIX: recompute savings from what's left instead of zeroing them out
    const duplicateIds = filteredGroups.flatMap((g) => g.duplicateAssetIds);

    const categorySavings = {
      screenshots: sumSizes(screenshotCandidates),
      duplicates: sumSizes(duplicateIds),
      blurry: sumSizes(blurry),
      clutter: sumSizes(clutter),
      livePhotos: sumSizes(livePhotoCandidates),
    };

    // Total = union of all remaining candidates (no double counting)
    const candidateIds = new Set<string>([
      ...screenshotCandidates,
      ...duplicateIds,
      ...blurry,
      ...clutter,
      ...livePhotoCandidates,
    ]);
    const totalSavingsBytes = sumSizes([...candidateIds]);

    const newResult: AnalysisResult = {
      ...result,
      screenshots,
      screenshotCandidates,
      duplicateGroups: filteredGroups,
      clutter,
      blurry,
      livePhotos,
      livePhotoCandidates,
      totalSavingsBytes,
      categorySavings,
      assetSizes,
    };

    setResult(newResult);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newResult));

    // FIX: don't mutate the previous state objects; build new ones
    setOverrides((prev) => {
      const next: CategorySelectionOverrides = {};
      for (const cat of Object.keys(prev) as CategoryKey[]) {
        const catOverrides = prev[cat];
        if (!catOverrides) continue;
        const kept = Object.fromEntries(
          Object.entries(catOverrides).filter(([id]) => !removeSet.has(id)),
        );
        if (Object.keys(kept).length > 0) next[cat] = kept;
      }
      return next;
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
