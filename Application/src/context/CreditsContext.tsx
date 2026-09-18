import { ENTITLEMENT_ID } from "@/components/ui/paywall";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import Purchases, { CustomerInfo } from "react-native-purchases";

// Constants for configuration
const WELCOME_BONUS_CREDITS = 500;
const DAILY_REFILL_CREDITS = 50;
const MAX_CREDITS_CAP = 500; // Prevents infinite hoarding for free users
const UNLIMITED_CREDITS = 999999; // A huge number to represent "Unlimited" for subscribers

const STORAGE_KEYS = {
  credits: "userCredits",
  lastResetDate: "lastCreditResetDate",
  welcomeBonusClaimed: "welcomeBonusClaimed",
  isSubscribed: "isSubscribed",
};

type CreditsContextType = {
  credits: number;
  isLoadingCredits: boolean;
  isSubscribed: boolean;
  isLoadingSubscription: boolean;
  canConsume: (amount: number) => boolean;
  consumeCredits: (amount: number) => Promise<boolean>;
  refillCredits: () => Promise<void>;
  setSubscriptionStatus: (status: boolean) => Promise<void>;
};

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

export const CreditsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [credits, setCredits] = useState<number>(0);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isLoadingCredits, setIsLoadingCredits] = useState(true);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

  const getTodayString = () => new Date().toISOString().split("T")[0];

  // Extracted logic so we can call it separately if needed
  const refillCreditsLogic = async () => {
    try {
      const today = getTodayString();

      const storedCredits = await AsyncStorage.getItem(STORAGE_KEYS.credits);
      const storedDate = await AsyncStorage.getItem(STORAGE_KEYS.lastResetDate);
      const hasClaimedBonus = await AsyncStorage.getItem(
        STORAGE_KEYS.welcomeBonusClaimed,
      );

      let currentCredits = storedCredits ? parseInt(storedCredits, 10) : 0;
      const lastDate = storedDate || "";

      // Handle Welcome Bonus (Only on first ever launch)
      if (!hasClaimedBonus) {
        currentCredits = WELCOME_BONUS_CREDITS;
        await AsyncStorage.setItem(STORAGE_KEYS.welcomeBonusClaimed, "true");
        await AsyncStorage.setItem(STORAGE_KEYS.lastResetDate, today);
        await AsyncStorage.setItem(STORAGE_KEYS.credits, String(currentCredits));
        setCredits(currentCredits);
        return;
      }

      // Handle Daily Refill (If a new day has started)
      if (lastDate !== today) {
        const newCredits = Math.min(
          currentCredits + DAILY_REFILL_CREDITS,
          MAX_CREDITS_CAP,
        );
        await AsyncStorage.setItem(STORAGE_KEYS.credits, String(newCredits));
        await AsyncStorage.setItem(STORAGE_KEYS.lastResetDate, today);
        setCredits(newCredits);
      } else {
        // Same day — just cap and restore whatever's stored (handles a lapsed
        // subscriber whose credits were left at UNLIMITED_CREDITS from before)
        const cappedCredits = Math.min(currentCredits, MAX_CREDITS_CAP);
        if (cappedCredits !== currentCredits) {
          await AsyncStorage.setItem(STORAGE_KEYS.credits, String(cappedCredits));
        }
        setCredits(cappedCredits);
      }
    } catch (error) {
      console.error("Failed to refill credits:", error);
    }
  };

  // Load Subscription Status and Credits on app start, and keep them in sync
  // with RevenueCat going forward. This listener fires on EVERY entitlement
  // change — initial load, purchase, restore, renewal, expiration, refund —
  // so it's the single source of truth for isSubscribed.
  useEffect(() => {
    const handleCustomerInfo = async (customerInfo: CustomerInfo) => {
      const isSub =
        typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";
      setIsSubscribed(isSub);
      await AsyncStorage.setItem(STORAGE_KEYS.isSubscribed, String(isSub));

      if (isSub) {
        setCredits(UNLIMITED_CREDITS);
      } else {
        // Was subscribed and lapsed, or was never subscribed — either way,
        // fall back to the real free-tier credit balance.
        await refillCreditsLogic();
      }
    };

    Purchases.addCustomerInfoUpdateListener(handleCustomerInfo);

    (async () => {
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        await handleCustomerInfo(customerInfo);
      } catch (e) {
        console.error("Failed to load customer info", e);
      } finally {
        setIsLoadingCredits(false);
        setIsLoadingSubscription(false);
      }
    })();

    return () => {
      Purchases.removeCustomerInfoUpdateListener(handleCustomerInfo);
    };
  }, []);

  // Public wrapper for refill
  const refillCredits = async () => {
    if (isSubscribed) {
      setCredits(UNLIMITED_CREDITS);
      return;
    }
    await refillCreditsLogic();
  };

  // Kept for any manual/dev-only use — the RevenueCat listener above is what
  // drives isSubscribed in normal operation, so you shouldn't need to call
  // this from purchase/restore code anymore.
  const setSubscriptionStatus = async (status: boolean) => {
    setIsSubscribed(status);
    await AsyncStorage.setItem(STORAGE_KEYS.isSubscribed, String(status));

    if (status) {
      setCredits(UNLIMITED_CREDITS);
      await AsyncStorage.setItem(STORAGE_KEYS.credits, String(UNLIMITED_CREDITS));
    } else {
      setCredits(0);
      await AsyncStorage.setItem(STORAGE_KEYS.credits, "0");
      await refillCreditsLogic();
    }
  };

  const canConsume = (amount: number) => {
    if (isSubscribed) return true;
    return credits >= amount;
  };

  const consumeCredits = async (amount: number): Promise<boolean> => {
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