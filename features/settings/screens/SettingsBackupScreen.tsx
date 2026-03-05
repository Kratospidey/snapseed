import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/primitives/AppButton';
import { AppIconButton } from '@/components/primitives/AppIconButton';
import { AppText } from '@/components/primitives/AppText';
import { GlassSurface } from '@/components/primitives/GlassSurface';
import { BackupService } from '@/modules/backup/backup.service';
import { SettingsService } from '@/modules/settings/settings.service';
import { colors, spacing } from '@/theme';

export function SettingsBackupScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const backupService = useMemo(() => new BackupService(), []);
  const settingsService = useMemo(() => new SettingsService(db), [db]);
  const [isExporting, setIsExporting] = useState(false);
  const [lastExportAt, setLastExportAt] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void settingsService.getNumberSetting('backup.lastExportAt').then((value) => {
        setLastExportAt(value);
      });
    }, [settingsService]),
  );

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setMessage(null);

    try {
      const result = await backupService.exportMetadataBackup();
      await settingsService.setSetting('backup.lastExportAt', result.exportedAt);
      await settingsService.setSetting('backup.lastExportPath', result.databasePath);
      setLastExportAt(result.exportedAt);
      setMessage('Metadata backup exported. Original screenshot files are not part of this export.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Backup export failed.');
    } finally {
      setIsExporting(false);
    }
  }, [backupService, settingsService]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <AppIconButton onPress={() => router.back()}>
            <Ionicons color={colors.text} name="arrow-back" size={22} />
          </AppIconButton>
          <View style={styles.headerCopy}>
            <AppText variant="eyebrow">Settings</AppText>
            <AppText variant="title">Backup export</AppText>
          </View>
        </View>

        <GlassSurface style={styles.card} useBlur={false}>
          <AppText variant="action">Metadata-first export</AppText>
          <AppText color={colors.textMuted}>
            SnapBrain exports SQLite metadata only. Original screenshot image files are not included and are not restored automatically.
          </AppText>
          <AppText color={colors.textMuted} variant="caption">
            Last export: {lastExportAt ? formatTimestamp(lastExportAt) : 'Never'}
          </AppText>
        </GlassSurface>

        <AppButton onPress={() => void handleExport()} style={styles.primaryButton}>
          {isExporting ? 'Exporting...' : 'Export metadata backup'}
        </AppButton>

        {message ? (
          <GlassSurface style={styles.messageCard} useBlur={false}>
            <AppText color={colors.textMuted} variant="caption">
              {message}
            </AppText>
          </GlassSurface>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatTimestamp(value: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value);
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
  messageCard: {
    padding: spacing.sm,
  },
  primaryButton: {},
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
