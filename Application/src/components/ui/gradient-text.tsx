import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient'; 
// Note: For Bare React Native, use: import LinearGradient from 'react-native-linear-gradient';

interface GradientTextProps extends TextProps {
  colors: string[];
  children: string;
}

export const GradientText = ({ colors, children, style, ...rest }: GradientTextProps) => {
  return (
    <MaskedView
      maskElement={
        <Text {...rest} style={[style, styles.transparentText]}>
          {children}
        </Text>
      }
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <Text {...rest} style={[style, styles.hiddenText]}>
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
};

const styles = StyleSheet.create({
  transparentText: {
    backgroundColor: 'transparent',
  },
  hiddenText: {
    opacity: 0,
  },
});