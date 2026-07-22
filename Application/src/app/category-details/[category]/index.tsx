import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { CategoryDetails } from "@/screens";
import { useLocalSearchParams, useSearchParams } from "expo-router/build/hooks";
import { CategoryVariant } from "@/screens/CategoryDetails";

const CategoryDetailsPage = () => {
  const { category } = useLocalSearchParams();
  console.log("category: ", category);

  return <CategoryDetails variant={category as CategoryVariant} />;
};

export default CategoryDetailsPage;
