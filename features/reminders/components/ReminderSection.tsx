import { StyleSheet, View } from 'react-native';

import { AppChip } from '@/components/primitives/AppChip';
import { AppText } from '@/components/primitives/AppText';
import { colors, spacing } from '@/theme';

type ReminderSectionProps = {
  count: number;
  ctaLabel?: string;
  onPressCta?: () => void;
  subtitle?: string;
  title: string;
};

export function ReminderSection({ count, ctaLabel, onPressCta, subtitle, title }: ReminderSectionProps) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionCopy}>
        <AppText variant="title">{title}</AppText>
        <AppText color={colors.textMuted} variant="caption">
          {count} Capture{count === 1 ? '' : 's'}
          {subtitle ? ` • ${subtitle}` : ''}
        </AppText>
      </View>
      {ctaLabel && onPressCta ? (
        <AppChip label={ctaLabel} onPress={onPressCta} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
});
