import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { DoneCleaning } from "@/screens";
import { router } from "expo-router";

const DonePage = () => {
  const handleViewLibrary = () => {
    router.navigate("/home-results");
  };
  const handleDone = () => {
    router.navigate("/home-results");
  };
  return <DoneCleaning onDone={handleDone} onViewLibrary={handleViewLibrary} />;
};

export default DonePage;
