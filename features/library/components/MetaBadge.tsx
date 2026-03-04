import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives/AppText';
import { colors, spacing } from '@/theme';

type MetaBadgeProps = {
  label: string;
  tone: 'accent' | 'danger' | 'neutral';
};

const toneStyles = {
  accent: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
    color: colors.accent,
  },
  danger: {
    backgroundColor: '#F7E0D8',
    borderColor: '#A9471B',
    color: '#8F3710',
  },
  neutral: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    color: colors.textMuted,
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
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  label: {
    fontWeight: '700',
  },
});
