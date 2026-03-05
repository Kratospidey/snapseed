import type { TextInputProps } from 'react-native';
import { StyleSheet, TextInput, View } from 'react-native';

import { colors, radii, spacing } from '@/theme';

import { AppText } from './AppText';
import { GlassSurface } from './GlassSurface';

type AppTextAreaProps = TextInputProps & {
  label?: string;
};

export function AppTextArea({ label, style, ...props }: AppTextAreaProps) {
  return (
    <View style={styles.wrap}>
      {label ? (
        <AppText color={colors.textSecondary} variant="caption">
          {label}
        </AppText>
      ) : null}
      <GlassSurface elevation="flat" variant="inset">
        <TextInput
          multiline
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, style]}
          textAlignVertical="top"
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
    minHeight: 112,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  wrap: {
    gap: spacing.xs,
  },
});
