import React from "react";
import { Text, TextProps, StyleSheet, Pressable, PressableProps } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { Brand, FontSizes, FontWeights, Gradients } from "@/constants/theme";
// Note: For Bare React Native, use: import LinearGradient from 'react-native-linear-gradient';

interface GradientButtonProps extends PressableProps {
  title: string;
  type?: "primary" | "secondary";
}

export const GradientButton = ({
  title,
  type = "primary",
  onPress
}: GradientButtonProps) => {
  return (
    <Pressable onPress={onPress}>
      <LinearGradient
        colors={
          type === "primary"
            ? Gradients.buttonGradient
            : Gradients.buttonGradientOFF
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.8 }}
        style={styles.buttonContainer}
      >
        <Text style={[styles.buttonText]}>{title}</Text>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    paddingVertical: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.4,
    shadowRadius: 26,
    elevation: 10,
    borderWidth: 1,
    borderColor: Brand.cardBorder + 80,
  },
  buttonText: {
    color: Brand.textPrimary,
    fontSize: 17,
    fontWeight: FontWeights.medium,
  },
});
