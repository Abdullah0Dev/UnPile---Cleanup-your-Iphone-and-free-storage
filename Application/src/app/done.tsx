import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { DoneCleaning } from "@/screens";
import { router, useLocalSearchParams } from "expo-router";

const DonePage = () => {
  const params = useLocalSearchParams<{
    freedUpBytes?: string;
    itemsDeleted?: string;
  }>();

  const freedUpBytes = params.freedUpBytes ? parseFloat(params.freedUpBytes) : 0;
  const itemsDeleted = params.itemsDeleted ? parseInt(params.itemsDeleted, 10) : 0;

  const handleViewLibrary = () => {
    router.navigate("/home-results");
  };
  const handleDone = () => {
    router.navigate("/home-results");
  };

  return (
    <DoneCleaning
      freedUpBytes={freedUpBytes}
      itemsDeleted={itemsDeleted}
      onDone={handleDone}
      onViewLibrary={handleViewLibrary}
    />
  );
};

export default DonePage;