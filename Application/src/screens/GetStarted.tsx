import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import Animated from "react-native-reanimated";

import { Brand, FontSizes, FontWeights, Gradients } from "@/constants/theme";
import { GradientText } from "@/components/ui/gradient-text";
import { GradientButton } from "@/components/ui/gradient-button";
import { useEntrance, useHeroEntrance } from "@/hooks/use-entrance";
import { router } from "expo-router";

const GetStarted = () => {
  const logoEntrance = useHeroEntrance(0);
  const wordmarkEntrance = useEntrance(160);
  const subtitleEntrance = useEntrance(240);
  const buttonEntrance = useEntrance(360);

  const handleStartScanning = () => {
    console.log("hiii");

    router.push("/scanning");
  };
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <Animated.View style={logoEntrance}>
          <Image
            source={require("@/assets/images/logo2.png")}
            contentFit="contain"
            style={styles.logoImage}
          />
        </Animated.View>

        <Animated.View style={[styles.logoTextContainer, wordmarkEntrance]}>
          <Text style={styles.logoText}>Un</Text>
          <GradientText
            colors={Gradients.primaryButton}
            style={styles.logoText}
          >
            Pile
          </GradientText>
        </Animated.View>

        <Animated.View
          style={[
            styles.subtitleContainer,
            { gap: 4, marginTop: 10 },
            subtitleEntrance,
          ]}
        >
          <Text style={styles.logoSubtitle}>Clean your camera roll.</Text>
          <Text style={styles.logoSubtitle}>Free up space in seconds.</Text>
        </Animated.View>
      </View>

      <Animated.View style={buttonEntrance}>
        <GradientButton onPress={handleStartScanning} title="Start Scanning" />
      </Animated.View>
    </SafeAreaView>
  );
};

export default GetStarted;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: `#060423`,
    paddingHorizontal: 18,
    paddingBottom: 25,
  },
  logoImage: {
    width: 300,
    height: 300,
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
    color: Brand.textPrimary,
    fontSize: FontSizes.largeTitle,
    fontWeight: "800",
  },
  logoSubtitle: {
    color: Brand.textPrimary,
    fontSize: 18,
    fontWeight: FontWeights.regular,
    opacity: 0.8,
  },
});
