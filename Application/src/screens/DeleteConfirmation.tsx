import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image, ImageSource } from "expo-image";
import Animated from "react-native-reanimated";

import {
  Brand,
  FontSizes,
  FontWeights,
  Radii,
  Spacing,
} from "@/constants/theme";
import { GradientButton } from "@/components/ui/gradient-button";
import { CATEGORIES, CategoriesList } from "./Home";
import { useEntrance, useHeroEntrance } from "@/hooks/use-entrance";
import { router } from "expo-router";
import { CategoryVariant } from "./CategoryDetails";

type DeleteConfirmationProps = {
  itemCount?: number;
  onDelete?: () => void;
  onCancel?: () => void;
};

const ROW_STAGGER_MS = 70;

const DeleteConfirmation = ({
  itemCount = 1654,
  onDelete,
  onCancel,
}: DeleteConfirmationProps) => {
  const iconEntrance = useHeroEntrance(0);
  const titleEntrance = useEntrance(160);
  const subtitleEntrance = useEntrance(220);
  const listBaseDelay = 320;
  const buttonsEntrance = useEntrance(
    listBaseDelay + CATEGORIES.length * ROW_STAGGER_MS + 140,
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <Animated.View style={iconEntrance}>
          <Image
            source={require("@/assets/icons/trash.png")}
            contentFit="contain"
            style={styles.logoImage}
          />
        </Animated.View>

        <Animated.View style={[styles.logoTextContainer, titleEntrance]}>
          <Text style={styles.logoText}>
            Delete {itemCount.toLocaleString()} items?
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.subtitleContainer,
            { gap: 4, marginTop: 10 },
            subtitleEntrance,
          ]}
        >
          <Text style={styles.logoSubtitle}>This action cannot be undone.</Text>
        </Animated.View>

        {/* ── Category breakdown — each row cascades in ────────────── */}

        <CategoriesList marginTop />
      </View>

      <Animated.View style={[styles.buttonGroup, buttonsEntrance]}>
        <GradientButton title="Delete Everything" onPress={onDelete} />
        <GradientButton title="Cancel" type="secondary" onPress={onCancel} />
      </Animated.View>
    </SafeAreaView>
  );
};

export default DeleteConfirmation; 

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.appBackground,
    paddingHorizontal: Spacing.four,
  },
  logoImage: {
    width: 200,
    height: 200,
    alignSelf: "center",
  },
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    display: "flex",
  },
  subtitleContainer: {
    alignItems: "center",
  },
  logoTextContainer: {
    alignItems: "center",
    justifyContent: "center",
    display: "flex",
    flexDirection: "row",
  },
  logoText: {
    marginTop: Spacing.two,
    color: Brand.textPrimary,
    fontSize: FontSizes.title,
    fontWeight: "800",
  },
  logoSubtitle: {
    color: Brand.textPrimary,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.regular,
    opacity: 0.8,
  }, 
  buttonGroup: {
    gap: Spacing.two + Spacing.half,
    marginBottom: Spacing.five,
  },
});
