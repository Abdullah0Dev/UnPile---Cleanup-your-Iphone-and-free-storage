import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";
import { Platform } from "react-native";

const STORAGE_KEY = "@review_prompt_state_v1";

interface ReviewPromptState {
  visitCount: number;
  nextEligibleVisit: number;
}

const DEFAULT_STATE: ReviewPromptState = {
  visitCount: 0,
  nextEligibleVisit: 1, // first ask on the 1st "Done" visit
};

const randomSkip = (min = 3, max = 5) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

async function getState(): Promise<ReviewPromptState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : { ...DEFAULT_STATE };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

async function setState(state: ReviewPromptState) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

/**
 * Call once per visit to the Done screen. Handles everything:
 * counts the visit, decides if it's time, and fires the native
 * review sheet directly if so. No callback needed — fire and forget.
 */
export async function maybeRequestReview(): Promise<void> {
  if (Platform.OS !== "ios") return;

  const available = await StoreReview.isAvailableAsync();
  if (!available) return;

  const state = await getState();
  const newVisitCount = state.visitCount + 1;

  if (newVisitCount >= state.nextEligibleVisit) {
    await StoreReview.requestReview();
    await setState({
      visitCount: newVisitCount,
      nextEligibleVisit: newVisitCount + randomSkip(3, 5),
    });
  } else {
    await setState({ ...state, visitCount: newVisitCount });
  }
}

export async function resetReviewPromptState() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}