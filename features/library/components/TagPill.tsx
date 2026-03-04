import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives/AppText';
import { colors, spacing } from '@/theme';

type TagPillProps = {
  label: string;
};

export function TagPill({ label }: TagPillProps) {
  return (
    <View style={styles.pill}>
      <AppText style={styles.label} variant="caption">
        #{label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.text,
    fontWeight: '700',
  },
  pill: {
    backgroundColor: colors.accentSoft,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
});
