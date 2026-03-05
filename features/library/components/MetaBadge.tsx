import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives/AppText';
import { colors, radii, spacing } from '@/theme';

type MetaBadgeProps = {
  label: string;
  tone: 'accent' | 'danger' | 'neutral';
};

const toneStyles = {
  accent: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
    color: colors.accentStrong,
  },
  danger: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
    color: colors.danger,
  },
  neutral: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    color: colors.textSecondary,
  },
} as const;

export function MetaBadge({ label, tone }: MetaBadgeProps) {
  const toneStyle = toneStyles[tone];

  return (
    <View style={[styles.badge, { backgroundColor: toneStyle.backgroundColor, borderColor: toneStyle.borderColor }]}>
      <AppText color={toneStyle.color} style={styles.label} variant="caption">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  label: {
    fontWeight: '700',
  },
});
