import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, SafeAreaView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives/AppText';
import { routes } from '@/constants/routes';
import { colors, spacing } from '@/theme';

export function ImportPickerScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons color={colors.text} name="close" size={22} />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText variant="eyebrow">Add Capture</AppText>
            <AppText variant="title">Import picker</AppText>
          </View>
        </View>

        <View style={styles.panel}>
          <AppText>
            The route shell for the import flow is in place. Media-library selection and draft
            persistence start in the next phase.
          </AppText>
          <AppText color={colors.textMuted}>
            This entry point is modal so dismissing it returns to the current tab context.
          </AppText>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(routes.importReview)}
          style={styles.primaryButton}
        >
          <AppText style={styles.primaryButtonLabel} variant="action">
            Continue to Review Shell
          </AppText>
        </Pressable>
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
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  primaryButtonLabel: {
    color: colors.surface,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
