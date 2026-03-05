import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/primitives/AppButton';
import { AppIconButton } from '@/components/primitives/AppIconButton';
import { AppText } from '@/components/primitives/AppText';
import { GlassSurface } from '@/components/primitives/GlassSurface';
import { ReminderService } from '@/modules/reminders/reminder.service';
import { SettingsService } from '@/modules/settings/settings.service';
import { colors, spacing } from '@/theme';

export function SettingsNotificationsScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const reminderService = useMemo(() => new ReminderService(db), [db]);
  const settingsService = useMemo(() => new SettingsService(db), [db]);
  const [permissionState, setPermissionState] = useState<'denied' | 'granted' | 'undetermined'>('undetermined');
  const [inAppEnabled, setInAppEnabled] = useState(true);

  const load = useCallback(async () => {
    const [nextPermissionState, prefs] = await Promise.all([
      reminderService.getPermissionState(),
      settingsService.getNotificationPreferences(),
    ]);

    setPermissionState(nextPermissionState);
    setInAppEnabled(prefs.inAppRemindersEnabled);
  }, [reminderService, settingsService]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const toggleInAppReminders = useCallback(() => {
    setInAppEnabled((current) => {
      const next = !current;
      void settingsService.setNotificationPreferences({
        inAppRemindersEnabled: next,
        pushNotificationsEnabled: permissionState === 'granted',
      });
      return next;
    });
  }, [permissionState, settingsService]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <AppIconButton onPress={() => router.back()}>
            <Ionicons color={colors.text} name="arrow-back" size={22} />
          </AppIconButton>
          <View style={styles.headerCopy}>
            <AppText variant="eyebrow">Settings</AppText>
            <AppText variant="title">Notifications</AppText>
          </View>
        </View>

        <GlassSurface style={styles.card} useBlur={false}>
          <AppText variant="action">System notification permission</AppText>
          <AppText color={colors.textMuted}>
            Current status: {permissionState}
          </AppText>
          <AppButton onPress={() => void reminderService.openSystemNotificationSettings()} tone="secondary">
            Open system notification settings
          </AppButton>
        </GlassSurface>

        <GlassSurface style={styles.card} useBlur={false}>
          <AppText variant="action">In-app reminder support</AppText>
          <AppText color={colors.textMuted}>
            In-app reminders stay available even if lock-screen notifications are denied.
          </AppText>
          <AppButton onPress={toggleInAppReminders} tone="secondary">
            {inAppEnabled ? 'Disable in-app reminders' : 'Enable in-app reminders'}
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
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
