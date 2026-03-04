import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives/AppText';
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
          <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons color={colors.text} name="arrow-back" size={22} />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText variant="eyebrow">Settings</AppText>
            <AppText variant="title">Notifications</AppText>
          </View>
        </View>

        <View style={styles.card}>
          <AppText variant="action">System notification permission</AppText>
          <AppText color={colors.textMuted}>
            Current status: {permissionState}
          </AppText>
          <Pressable accessibilityRole="button" onPress={() => void reminderService.openSystemNotificationSettings()} style={styles.secondaryButton}>
            <AppText variant="caption">Open system notification settings</AppText>
          </Pressable>
        </View>

        <View style={styles.card}>
          <AppText variant="action">In-app reminder support</AppText>
          <AppText color={colors.textMuted}>
            In-app reminders stay available even if lock-screen notifications are denied.
          </AppText>
          <Pressable accessibilityRole="button" onPress={toggleInAppReminders} style={styles.secondaryButton}>
            <AppText variant="caption">{inAppEnabled ? 'Disable in-app reminders' : 'Enable in-app reminders'}</AppText>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
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
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
