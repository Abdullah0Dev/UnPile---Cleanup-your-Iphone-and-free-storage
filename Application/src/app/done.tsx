import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { DoneCleaning } from "@/screens";
import { router } from "expo-router";

const DonePage = () => {
  const handleViewLibrary = () => {
    router.back();
  };
  const handleDone = () => {
    router.navigate("/home-results");
  };
  return <DoneCleaning onDone={handleDone} />;
};

export default DonePage;
