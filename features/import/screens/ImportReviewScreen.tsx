import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, SafeAreaView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives/AppText';
import { colors, spacing } from '@/theme';

export function ImportReviewScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons color={colors.text} name="arrow-back" size={22} />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText variant="eyebrow">Add Capture</AppText>
            <AppText variant="title">Review</AppText>
          </View>
        </View>

        <View style={styles.panel}>
          <AppText>
            This review step is wired as its own modal route so the picker and review screens can
            evolve into the real import flow without changing navigation structure.
          </AppText>
          <AppText color={colors.textMuted}>
            Shared tag, reminder, and duplicate-warning UI is intentionally deferred.
          </AppText>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  headerCopy: {
    gap: 2,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
