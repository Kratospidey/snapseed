import type { ErrorBoundaryProps } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppScreen } from '@/components/primitives/AppScreen';
import { AppText } from '@/components/primitives/AppText';
import { colors, spacing } from '@/theme';

export function AppRuntimeErrorScreen({ error, retry }: ErrorBoundaryProps) {
  return (
    <AppScreen contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <AppText variant="eyebrow">Startup Error</AppText>
        <AppText variant="display">SnapBrain could not finish loading</AppText>
        <AppText color={colors.textMuted}>
          The app hit a runtime error before the current screen could render. Check the Metro terminal for startup
          diagnostics and retry after fixing the reported issue.
        </AppText>
        {__DEV__ ? (
          <View style={styles.errorBlock}>
            <AppText variant="title">Error details</AppText>
            <AppText color={colors.textMuted}>{error.message}</AppText>
          </View>
        ) : null}
        <Pressable accessibilityRole="button" onPress={retry} style={styles.button}>
          <AppText color={colors.surface} variant="action">
            Retry
          </AppText>
        </Pressable>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: spacing.md,
    maxWidth: 720,
    padding: spacing.xl,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBlock: {
    backgroundColor: colors.background,
    borderRadius: 20,
    gap: spacing.sm,
    padding: spacing.md,
  },
});
