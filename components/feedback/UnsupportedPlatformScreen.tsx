import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppScreen } from '@/components/primitives/AppScreen';
import { AppText } from '@/components/primitives/AppText';
import { colors, spacing } from '@/theme';

type UnsupportedPlatformScreenProps = {
  ctaHref?: Href;
  ctaLabel?: string;
  eyebrow?: string;
  message?: string;
  onPressCta?: () => void;
  title?: string;
};

const DEFAULT_MESSAGE =
  'SnapBrain is currently built for Android and iPhone. Web is intentionally limited in this pass so the app does not crash while native features continue to stabilize.';

export function UnsupportedPlatformScreen({
  ctaHref,
  ctaLabel,
  eyebrow = 'Web',
  message = DEFAULT_MESSAGE,
  onPressCta,
  title = 'Mobile-only for now',
}: UnsupportedPlatformScreenProps) {
  const showLinkCta = Boolean(ctaHref && ctaLabel && !onPressCta);
  const showPressableCta = Boolean(onPressCta && ctaLabel && !ctaHref);

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <AppText variant="eyebrow">{eyebrow}</AppText>
        <AppText variant="display">{title}</AppText>
        <AppText color={colors.textMuted}>{message}</AppText>
        <View style={styles.noteBlock}>
          <AppText variant="title">What still works here</AppText>
          <AppText color={colors.textMuted}>
            This web shell is intentionally thin. It exists to keep bundling healthy and to point manual testing back
            to native where Capture import, SQLite metadata, and device URI handling actually run.
          </AppText>
        </View>
        {showLinkCta ? (
          <Link asChild href={ctaHref!}>
            <Pressable accessibilityRole="link" style={styles.button}>
              <AppText color={colors.surface} variant="action">
                {ctaLabel}
              </AppText>
            </Pressable>
          </Link>
        ) : null}
        {showPressableCta ? (
          <Pressable accessibilityRole="button" onPress={onPressCta} style={styles.button}>
            <AppText color={colors.surface} variant="action">
              {ctaLabel}
            </AppText>
          </Pressable>
        ) : null}
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
  noteBlock: {
    backgroundColor: colors.background,
    borderRadius: 20,
    gap: spacing.sm,
    padding: spacing.md,
  },
});
