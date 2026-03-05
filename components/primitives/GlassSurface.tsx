import { BlurView } from 'expo-blur';
import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Platform, StyleSheet, View } from 'react-native';

import { colors, radii, shadows } from '@/theme';

import { useGlassCapabilities } from './useGlassCapabilities';

type GlassSurfaceProps = PropsWithChildren<{
  blurIntensity?: number;
  contentStyle?: StyleProp<ViewStyle>;
  elevation?: 'flat' | 'floating' | 'raised';
  style?: StyleProp<ViewStyle>;
  useBlur?: boolean;
  variant?: 'card' | 'inset' | 'overlay' | 'sheet';
}>;

export function GlassSurface({
  blurIntensity = 22,
  children,
  contentStyle,
  elevation = 'raised',
  style,
  useBlur,
  variant = 'card',
}: GlassSurfaceProps) {
  const capabilities = useGlassCapabilities();
  const shouldUseBlur = useBlur ?? capabilities.canUseBlur;

  return (
    <View style={[styles.base, stylesByVariant[variant], stylesByElevation[elevation], style]}>
      {shouldUseBlur ? (
        <BlurView intensity={Platform.OS === 'ios' ? blurIntensity : 16} style={StyleSheet.absoluteFill} tint="light" />
      ) : (
        <>
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.fauxBase]} />
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.fauxHighlight]} />
        </>
      )}
      <View pointerEvents="none" style={styles.edgeHighlight} />
      <View style={contentStyle}>{children}</View>
    </View>
  );
}

const stylesByVariant = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.borderSoft,
    borderRadius: radii.lg,
  },
  inset: {
    backgroundColor: colors.surfaceInset,
    borderColor: colors.borderSoft,
    borderRadius: radii.md,
  },
  overlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: radii.xl,
  },
  sheet: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderColor: colors.borderSoft,
    borderRadius: radii.xl,
  },
});

const stylesByElevation = StyleSheet.create({
  flat: {},
  floating: shadows.floating,
  raised: shadows.md,
});

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  edgeHighlight: {
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
    height: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  fauxBase: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  fauxHighlight: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
  },
});
