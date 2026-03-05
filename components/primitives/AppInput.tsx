import type { TextInputProps } from 'react-native';
import { StyleSheet, TextInput, View } from 'react-native';

import { colors, radii, spacing } from '@/theme';

import { AppText } from './AppText';
import { GlassSurface } from './GlassSurface';

type AppInputProps = TextInputProps & {
  label?: string;
};

export function AppInput({ label, style, ...props }: AppInputProps) {
  return (
    <View style={styles.wrap}>
      {label ? (
        <AppText color={colors.textSecondary} variant="caption">
          {label}
        </AppText>
      ) : null}
      <GlassSurface elevation="flat" variant="inset">
        <TextInput
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, style]}
          {...props}
        />
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderRadius: radii.md,
    color: colors.textPrimary,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  wrap: {
    gap: spacing.xs,
  },
});
