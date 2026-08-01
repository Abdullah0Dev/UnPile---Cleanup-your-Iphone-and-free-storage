import React from "react";
import {
  Text,
  TextProps,
  StyleSheet,
  ColorValue,
  Pressable,
} from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient, LinearGradientPoint } from "expo-linear-gradient";

interface GradientTextProps extends TextProps {
  colors: readonly [ColorValue, ColorValue, ...ColorValue[]];
  children: React.ReactNode;
  start?: LinearGradientPoint;
  end?: LinearGradientPoint;
}

export const GradientText = ({
  colors,
  children,
  style,
  start = { x: 0, y: 0 },
  end = { x: 0, y: 1 },
  ...rest
}: GradientTextProps) => {
  return (
    <MaskedView
      maskElement={
        <Text
          {...rest}
          onPress={() => console.log("pressed text")}
          style={[style, styles.transparentText]}
        >
          {children}
        </Text>
      }
    >
      <Pressable onPress={rest.onPress}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <Text {...rest} style={[style, styles.hiddenText]}>
            {children}
          </Text>
        </LinearGradient>
      </Pressable>
    </MaskedView>
  );
};

const styles = StyleSheet.create({
  transparentText: {
    backgroundColor: "transparent",
  },
  hiddenText: {
    opacity: 0,
  },
});
