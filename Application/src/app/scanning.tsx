import { StyleSheet, Text, View } from "react-native";
import React, { useEffect } from "react";
import { ScanningProgress } from "@/screens";
import { router } from "expo-router";

const scanningPage = () => {
  useEffect(() => {
    setTimeout(() => {
      router.push("/home-results");
    }, 3000);
  }, []);

  return <ScanningProgress />;
};

export default scanningPage;
