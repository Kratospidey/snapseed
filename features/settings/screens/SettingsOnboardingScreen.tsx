import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/primitives/AppButton';
import { AppIconButton } from '@/components/primitives/AppIconButton';
import { AppText } from '@/components/primitives/AppText';
import { GlassSurface } from '@/components/primitives/GlassSurface';
import { colors, spacing } from '@/theme';

export function SettingsOnboardingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <AppIconButton onPress={() => router.back()}>
            <Ionicons color={colors.text} name="arrow-back" size={22} />
          </AppIconButton>
          <View style={styles.headerCopy}>
            <AppText variant="eyebrow">Settings</AppText>
            <AppText variant="title">Replay onboarding</AppText>
          </View>
        </View>

        <GlassSurface style={styles.card} useBlur={false}>
          <AppText variant="action">Onboarding replay</AppText>
          <AppText color={colors.textMuted}>
            Onboarding replay entry is available for MVP flow continuity. Full onboarding routing is intentionally lightweight in this phase.
          </AppText>
          <AppButton onPress={() => router.replace('/')} style={styles.primaryButton}>
            Open app intro path
          </AppButton>
        </GlassSurface>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
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
  primaryButton: {},
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
