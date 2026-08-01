import React, { useMemo, useState } from "react";
import { DoneCleaning } from "@/screens";
import { router, useLocalSearchParams } from "expo-router";
import Paywall from "@/components/ui/paywall";
import { useCredits } from "@/context/CreditsContext";
import { useAnalysis } from "@/context/AnalysisContext";

const DonePage = () => {
  const params = useLocalSearchParams<{
    freedUpBytes?: string;
    itemsDeleted?: string;
  }>();

  const freedUpBytes = params.freedUpBytes
    ? parseFloat(params.freedUpBytes)
    : 0;
  const itemsDeleted = params.itemsDeleted
    ? parseInt(params.itemsDeleted, 10)
    : 0;

  // 🚀 Mock state: In production, this will come from your global app state/AsyncStorage
  const { result } = useAnalysis();
  const { credits: currentCredits } = useCredits();
  const [showPaywall, setShowPaywall] = useState(false);

  const remainingItems = useMemo(() => {
    if (!result) return 0;

    let count = 0;
    // Sum up the main categories
    count += result.screenshots?.length || 0;
    count += result.clutter?.length || 0;
    count += result.blurry?.length || 0;
    count += result.livePhotos?.length || 0;

    // Duplicates are stored in groups, so we flatten them to count correctly
    for (const group of result.duplicateGroups || []) {
      count += 1; // The bestAssetId
      count += group.duplicateAssetIds?.length || 0; // The duplicate IDs
    }

    return count;
  }, [result]);

  const handleViewLibrary = () => {
    router.navigate("/home-results");
  };

  const handleDone = () => {
    router.navigate("/home-results");
  };

  // 🚀 Function to trigger the paywall when the user taps "Unlock Unlimited"
  const handleUpgradePress = () => {
    setShowPaywall(true);
    // Replace this with your actual paywall route or modal logic
    // Example: router.navigate("/paywall");
    // Example: openPaywallModal('LIMIT_REACHED');
    console.log("Opening paywall modal...");
    // router.navigate("/paywall");
  };

  return (
    <>
      <DoneCleaning
        freedUpBytes={freedUpBytes}
        itemsDeleted={itemsDeleted}
        // 🚀 Pass the new required props
        currentCredits={currentCredits}
        remainingItems={remainingItems}
        onUpgradePress={handleUpgradePress}
        // Pass existing handlers
        onDone={handleDone}
        onViewLibrary={handleViewLibrary}
      />
      <Paywall
        isPresented={showPaywall}
        onDismiss={() => setShowPaywall(false)}
      />
    </>
  );
};

export default DonePage;
