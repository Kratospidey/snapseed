import type { PropsWithChildren } from 'react';
import type { StyleProp, TextProps, TextStyle } from 'react-native';
import { StyleSheet, Text } from 'react-native';

import { colors, typography } from '@/theme';

type AppTextVariant = 'body' | 'caption' | 'action' | 'eyebrow' | 'title' | 'display';

type AppTextProps = PropsWithChildren<{
  color?: string;
  numberOfLines?: TextProps['numberOfLines'];
  style?: StyleProp<TextStyle>;
  variant?: AppTextVariant;
}>;

const variantStyles = StyleSheet.create({
  action: {
    ...typography.body,
    color: colors.accent,
    fontWeight: '700',
  },
  body: {
    ...typography.body,
    color: colors.text,
  },
  caption: {
    ...typography.caption,
    color: colors.textMuted,
  },
  display: {
    ...typography.display,
    color: colors.text,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.accent,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
});

export function AppText({ children, color, numberOfLines, style, variant = 'body' }: AppTextProps) {
  return (
    <Text numberOfLines={numberOfLines} style={[variantStyles[variant], color ? { color } : undefined, style]}>
      {children}
    </Text>
  );
}
