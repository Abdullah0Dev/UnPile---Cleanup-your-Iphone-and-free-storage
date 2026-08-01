import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

// Constants for configuration
const WELCOME_BONUS_CREDITS = 500;
const DAILY_REFILL_CREDITS = 50;
const MAX_CREDITS_CAP = 500; // Prevents infinite hoarding for free users
const UNLIMITED_CREDITS = 999999; // A huge number to represent "Unlimited" for subscribers

const STORAGE_KEYS = {
  credits: "userCredits",
  lastResetDate: "lastCreditResetDate",
  welcomeBonusClaimed: "welcomeBonusClaimed",
  isSubscribed: "isSubscribed", // New key
};

type CreditsContextType = {
  credits: number;
  isLoadingCredits: boolean;
  isSubscribed: boolean; // New state
  isLoadingSubscription: boolean; // New state
  canConsume: (amount: number) => boolean;
  consumeCredits: (amount: number) => Promise<boolean>;
  refillCredits: () => Promise<void>;
  setSubscriptionStatus: (status: boolean) => Promise<void>; // New function
};

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

export const CreditsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [credits, setCredits] = useState<number>(0);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isLoadingCredits, setIsLoadingCredits] = useState(true);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

  // Helper to get today's date in YYYY-MM-DD format
  const getTodayString = () => new Date().toISOString().split("T")[0];

  // Load Subscription Status and Credits on app start
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Load Subscription status
        const storedSub = await AsyncStorage.getItem(STORAGE_KEYS.isSubscribed);
        const isSub = storedSub === "true";
        setIsSubscribed(isSub);

        // 2. If Subscribed, skip all credit math and set to unlimited
        if (isSub) {
          setCredits(UNLIMITED_CREDITS);
          setIsLoadingCredits(false);
          setIsLoadingSubscription(false);
          return;
        }

        // 3. Otherwise, run the normal free-user credits logic
        await refillCreditsLogic();
      } catch (error) {
        console.error("Failed to load initial data:", error);
      } finally {
        setIsLoadingCredits(false);
        setIsLoadingSubscription(false);
      }
    };

    loadData();
  }, []);

  // Extracted logic so we can call it separately if needed
  const refillCreditsLogic = async () => {
    try {
      const today = getTodayString();

      // Load current state from storage
      const storedCredits = await AsyncStorage.getItem(STORAGE_KEYS.credits);
      const storedDate = await AsyncStorage.getItem(STORAGE_KEYS.lastResetDate);
      const hasClaimedBonus = await AsyncStorage.getItem(
        STORAGE_KEYS.welcomeBonusClaimed,
      );

      let currentCredits = storedCredits ? parseInt(storedCredits, 10) : 0;
      let lastDate = storedDate || "";

      // Handle Welcome Bonus (Only on first ever launch)
      if (!hasClaimedBonus) {
        currentCredits = WELCOME_BONUS_CREDITS;
        await AsyncStorage.setItem(STORAGE_KEYS.welcomeBonusClaimed, "true");
        await AsyncStorage.setItem(STORAGE_KEYS.lastResetDate, today);
        await AsyncStorage.setItem(
          STORAGE_KEYS.credits,
          String(currentCredits),
        );

        setCredits(currentCredits);
        return;
      }

      // Handle Daily Refill (If a new day has started)
      if (lastDate !== today) {
        // Add daily bonus, cap it at MAX_CREDITS_CAP
        const newCredits = Math.min(
          currentCredits + DAILY_REFILL_CREDITS,
          MAX_CREDITS_CAP,
        );

        await AsyncStorage.setItem(STORAGE_KEYS.credits, String(newCredits));
        await AsyncStorage.setItem(STORAGE_KEYS.lastResetDate, today);

        setCredits(newCredits);
      } else {
        // Just keep the existing credits if it's the same day
        setCredits(currentCredits);
      }
    } catch (error) {
      console.error("Failed to refill credits:", error);
    }
  };

  // Public wrapper for refill
  const refillCredits = async () => {
    // If subscribed, just ensure they have the huge balance
    if (isSubscribed) {
      setCredits(UNLIMITED_CREDITS);
      return;
    }
    await refillCreditsLogic();
  };

  // Public function to set subscription status (Call this from your Paywall!)
  const setSubscriptionStatus = async (status: boolean) => {
    setIsSubscribed(status);
    await AsyncStorage.setItem(STORAGE_KEYS.isSubscribed, String(status));

    if (status) {
      // If they subscribed, instantly give them unlimited credits
      setCredits(UNLIMITED_CREDITS);
      await AsyncStorage.setItem(
        STORAGE_KEYS.credits,
        String(UNLIMITED_CREDITS),
      );
    } else {
      // If they unsubscribe (or subscription expires), reset to 0 and trigger a fresh refill
      setCredits(0);
      await AsyncStorage.setItem(STORAGE_KEYS.credits, "0");
      await refillCreditsLogic();
    }
  };

  // Check if user can consume a specific amount
  const canConsume = (amount: number) => {
    // If subscribed, they can ALWAYS consume
    if (isSubscribed) return true;
    return credits >= amount;
  };

  // Consume credits (e.g., when deleting)
  const consumeCredits = async (amount: number): Promise<boolean> => {
    // If subscribed, just return true instantly, no storage manipulation
    if (isSubscribed) return true;

    if (!canConsume(amount)) return false;

    const newCredits = Math.max(0, credits - amount);
    setCredits(newCredits);
    await AsyncStorage.setItem(STORAGE_KEYS.credits, String(newCredits));
    return true;
  };

  return (
    <CreditsContext.Provider
      value={{
        credits,
        isLoadingCredits,
        isSubscribed,
        isLoadingSubscription,
        canConsume,
        consumeCredits,
        refillCredits,
        setSubscriptionStatus,
      }}
    >
      {children}
    </CreditsContext.Provider>
  );
};

export const useCredits = () => {
  const ctx = useContext(CreditsContext);
  if (!ctx) throw new Error("useCredits must be used within CreditsProvider");
  return ctx;
};
