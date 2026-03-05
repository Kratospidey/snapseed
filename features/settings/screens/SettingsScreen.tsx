import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { AppChip } from '@/components/primitives/AppChip';
import { AppText } from '@/components/primitives/AppText';
import { GlassSurface } from '@/components/primitives/GlassSurface';
import { TactilePressable } from '@/components/primitives/TactilePressable';
import { routes } from '@/constants/routes';
import { ReminderService } from '@/modules/reminders/reminder.service';
import { SettingsService } from '@/modules/settings/settings.service';
import { colors, spacing } from '@/theme';

export function SettingsScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const settingsService = useMemo(() => new SettingsService(db), [db]);
  const reminderService = useMemo(() => new ReminderService(db), [db]);
  const [defaultViewMode, setDefaultViewMode] = useState<'grid' | 'list'>('grid');
  const [notificationState, setNotificationState] = useState<'denied' | 'granted' | 'undetermined'>('undetermined');

  const load = useCallback(async () => {
    const [nextDefaultViewMode, nextNotificationState] = await Promise.all([
      settingsService.getLibraryDefaultViewMode(),
      reminderService.getPermissionState(),
    ]);
    setDefaultViewMode(nextDefaultViewMode);
    setNotificationState(nextNotificationState);
  }, [reminderService, settingsService]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleSetDefaultViewMode = useCallback(
    (nextMode: 'grid' | 'list') => {
      setDefaultViewMode(nextMode);
      void settingsService.setLibraryDefaultViewMode(nextMode);
    },
    [settingsService],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCopy}>
          <AppText variant="eyebrow">SnapBrain</AppText>
          <AppText variant="display">Settings</AppText>
          <AppText color={colors.textMuted}>
            Preferences, diagnostics, and metadata-first backup tools.
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="title">Preferences</AppText>
          <GlassSurface style={styles.card} useBlur={false}>
            <AppText variant="action">Default Library view mode</AppText>
            <View style={styles.inlineRow}>
              <ChoiceChip
                active={defaultViewMode === 'grid'}
                label="Grid"
                onPress={() => handleSetDefaultViewMode('grid')}
              />
              <ChoiceChip
                active={defaultViewMode === 'list'}
                label="List"
                onPress={() => handleSetDefaultViewMode('list')}
              />
            </View>
            <AppText color={colors.textMuted} variant="caption">
              Last chosen view mode is still remembered per usage; this default is used when no prior choice exists.
            </AppText>
          </GlassSurface>
        </View>

        <View style={styles.section}>
          <AppText variant="title">Notifications</AppText>
          <SettingsLinkRow
            description={`System permission: ${notificationState}`}
            label="Notification preferences"
            onPress={() => router.push(routes.settingsNotifications)}
          />
        </View>

        <View style={styles.section}>
          <AppText variant="title">Diagnostics</AppText>
          <SettingsLinkRow
            description="Storage counts, graveyard scan, and management shortcuts."
            label="Storage diagnostics"
            onPress={() => router.push(routes.settingsStorage)}
          />
          <SettingsLinkRow
            description="Open Graveyard smart view in Library."
            label="Manage Graveyard"
            onPress={() => router.push(`${routes.library}?smartView=graveyard`)}
          />
        </View>

        <View style={styles.section}>
          <AppText variant="title">Backup</AppText>
          <SettingsLinkRow
            description="Export SQLite metadata backup (images are not included)."
            label="Export backup"
            onPress={() => router.push(routes.settingsBackup)}
          />
        </View>

        <View style={styles.section}>
          <AppText variant="title">Future modules</AppText>
          <GlassSurface style={styles.card} useBlur={false}>
            <AppText variant="action">OCR (coming later)</AppText>
            <AppText color={colors.textMuted}>
              OCR search is not part of MVP yet. Current search covers tags and note text only.
            </AppText>
          </GlassSurface>
        </View>

        <View style={styles.section}>
          <AppText variant="title">App</AppText>
          <SettingsLinkRow
            description="Version and product information."
            label="About"
            onPress={() => router.push(routes.settingsAbout)}
          />
          <SettingsLinkRow
            description="Replay onboarding guidance."
            label="Replay onboarding"
            onPress={() => router.push(routes.settingsOnboarding)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ChoiceChip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return <AppChip label={label} onPress={onPress} selected={active} />;
}

function SettingsLinkRow({
  description,
  label,
  onPress,
}: {
  description: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <TactilePressable accessibilityRole="button" intensity="soft" onPress={onPress}>
      <GlassSurface style={styles.card} useBlur={false}>
        <AppText variant="action">{label}</AppText>
        <AppText color={colors.textMuted} variant="caption">
          {description}
        </AppText>
      </GlassSurface>
    </TactilePressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
    padding: spacing.md,
  },
  content: {
    gap: spacing.md,
    paddingBottom: 120,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  headerCopy: {
    gap: spacing.xs,
  },
  inlineRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  section: {
    gap: spacing.sm,
  },
});
