import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

import { AppText } from '@/components/primitives/AppText';
import { DATABASE_NAME } from '@/constants/app';
import { routes } from '@/constants/routes';
import { CaptureService } from '@/modules/captures/capture.service';
import { GraveyardService } from '@/modules/graveyard/graveyard.service';
import { SettingsService } from '@/modules/settings/settings.service';
import { colors, spacing } from '@/theme';

type DiagnosticsState = {
  databaseSizeBytes: number | null;
  graveyardCount: number;
  lastExportAt: number | null;
  lastScanAt: number | null;
  reminderCount: number;
  totalCount: number;
};

const EMPTY_DIAGNOSTICS: DiagnosticsState = {
  databaseSizeBytes: null,
  graveyardCount: 0,
  lastExportAt: null,
  lastScanAt: null,
  reminderCount: 0,
  totalCount: 0,
};

export function SettingsStorageScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const captureService = useMemo(() => new CaptureService(db), [db]);
  const graveyardService = useMemo(() => new GraveyardService(db), [db]);
  const settingsService = useMemo(() => new SettingsService(db), [db]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsState>(EMPTY_DIAGNOSTICS);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [counts, lastScanAt, lastExportAt, dbInfo] = await Promise.all([
      captureService.getSmartCounts(),
      settingsService.getNumberSetting('graveyard.lastScanAt'),
      settingsService.getNumberSetting('backup.lastExportAt'),
      getDatabaseSizeAsync(),
    ]);

    setDiagnostics({
      databaseSizeBytes: dbInfo,
      graveyardCount: counts.graveyardCount,
      lastExportAt,
      lastScanAt,
      reminderCount: counts.reminderCount,
      totalCount: counts.totalCount,
    });
  }, [captureService, settingsService]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const runGraveyardScan = useCallback(async () => {
    setIsScanning(true);
    setScanMessage(null);

    try {
      const result = await graveyardService.runIntegrityScan({ limit: 80 });
      await settingsService.setSetting('graveyard.lastScanAt', result.runAt);
      await settingsService.setSetting('graveyard.lastScanSummary', result);
      setScanMessage(
        `Scanned ${result.scanned}. Marked missing: ${result.markedMissing}. Recovered: ${result.recovered}.`,
      );
      await load();
    } catch (error) {
      setScanMessage(error instanceof Error ? error.message : 'Graveyard scan failed.');
    } finally {
      setIsScanning(false);
    }
  }, [graveyardService, load, settingsService]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons color={colors.text} name="arrow-back" size={22} />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText variant="eyebrow">Settings</AppText>
            <AppText variant="title">Storage diagnostics</AppText>
          </View>
        </View>

        <View style={styles.card}>
          <DiagnosticRow label="Captures" value={String(diagnostics.totalCount)} />
          <DiagnosticRow label="Graveyard" value={String(diagnostics.graveyardCount)} />
          <DiagnosticRow label="Pending reminders" value={String(diagnostics.reminderCount)} />
          <DiagnosticRow label="Database size" value={formatBytes(diagnostics.databaseSizeBytes)} />
          <DiagnosticRow
            label="Last graveyard scan"
            value={diagnostics.lastScanAt ? formatTimestamp(diagnostics.lastScanAt) : 'Never'}
          />
          <DiagnosticRow
            label="Last metadata export"
            value={diagnostics.lastExportAt ? formatTimestamp(diagnostics.lastExportAt) : 'Never'}
          />
        </View>

        <Pressable accessibilityRole="button" onPress={() => void runGraveyardScan()} style={styles.primaryButton}>
          <AppText color={colors.surface} variant="action">
            {isScanning ? 'Running scan...' : 'Run missing-original check'}
          </AppText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`${routes.library}?smartView=graveyard`)}
          style={styles.secondaryButton}
        >
          <AppText variant="caption">Open Graveyard in Library</AppText>
        </Pressable>

        {scanMessage ? (
          <View style={styles.messageCard}>
            <AppText color={colors.textMuted} variant="caption">
              {scanMessage}
            </AppText>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

async function getDatabaseSizeAsync() {
  const documentDirectory = FileSystem.documentDirectory;

  if (!documentDirectory) {
    return null;
  }

  const dbPath = `${documentDirectory}SQLite/${DATABASE_NAME}`;
  const info = await FileSystem.getInfoAsync(dbPath);

  return info.exists && typeof info.size === 'number' ? info.size : null;
}

function formatBytes(value: number | null) {
  if (!value || value < 0) {
    return 'Unknown';
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
}

function formatTimestamp(value: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value);
}

function DiagnosticRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <AppText color={colors.textMuted}>{label}</AppText>
      <AppText>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
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
  messageCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    padding: spacing.sm,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
