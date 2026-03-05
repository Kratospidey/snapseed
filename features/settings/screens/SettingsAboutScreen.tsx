import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { AppIconButton } from '@/components/primitives/AppIconButton';
import { AppText } from '@/components/primitives/AppText';
import { GlassSurface } from '@/components/primitives/GlassSurface';
import { colors, spacing } from '@/theme';

export function SettingsAboutScreen() {
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
            <AppText variant="title">About SnapBrain</AppText>
          </View>
        </View>

        <GlassSurface style={styles.card} useBlur={false}>
          <AppText variant="action">Version</AppText>
          <AppText color={colors.textMuted}>{Constants.expoConfig?.version ?? 'unknown'}</AppText>
        </GlassSurface>

        <GlassSurface style={styles.card} useBlur={false}>
          <AppText variant="action">Model</AppText>
          <AppText color={colors.textMuted}>
            SnapBrain is an offline-first, metadata-first screenshot organizer. Captures keep references to originals and local metadata for fast retrieval.
          </AppText>
        </GlassSurface>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
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
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
