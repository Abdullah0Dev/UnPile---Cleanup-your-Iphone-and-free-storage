import React, { useEffect, useMemo, useState } from "react";
import { DoneCleaning } from "@/screens";
import { router, useLocalSearchParams } from "expo-router";
import Paywall from "@/components/ui/paywall";
import { useCredits } from "@/context/CreditsContext";
import { useAnalysis } from "@/context/AnalysisContext";
import { maybeRequestReview } from "@/utils/reviewPrompt";

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

  const { result } = useAnalysis();
  const { credits: currentCredits } = useCredits();
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    maybeRequestReview();
  }, []); // runs once per mount of the Done screen

  const remainingItems = useMemo(() => {
    if (!result) return 0;
    let count = 0;
    count += result.screenshots?.length || 0;
    count += result.clutter?.length || 0;
    count += result.blurry?.length || 0;
    count += result.livePhotos?.length || 0;
    for (const group of result.duplicateGroups || []) {
      count += 1;
      count += group.duplicateAssetIds?.length || 0;
    }
    return count;
  }, [result]);

  const handleViewLibrary = () => {
    // router.dismissAll();
    router.replace("/home-results");
  };
  const handleDone = () => {
    // router.dismissAll();
    router.replace("/home-results");
  };
  const handleUpgradePress = () => setShowPaywall(true);

  return (
    <>
      <DoneCleaning
        freedUpBytes={freedUpBytes}
        itemsDeleted={itemsDeleted}
        currentCredits={currentCredits}
        remainingItems={remainingItems}
        onUpgradePress={handleUpgradePress}
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
