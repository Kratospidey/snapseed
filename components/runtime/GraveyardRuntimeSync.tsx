import { useSQLiteContext } from 'expo-sqlite';
import { AppState } from 'react-native';
import { useEffect, useMemo } from 'react';

import { GraveyardService } from '@/modules/graveyard/graveyard.service';
import { SettingsService } from '@/modules/settings/settings.service';

const MIN_SCAN_INTERVAL_MS = 6 * 60 * 60 * 1000;

export function GraveyardRuntimeSync() {
  const db = useSQLiteContext();
  const graveyardService = useMemo(() => new GraveyardService(db), [db]);
  const settingsService = useMemo(() => new SettingsService(db), [db]);

  useEffect(() => {
    let inFlight = false;

    const maybeRunScan = async () => {
      if (inFlight) {
        return;
      }

      const lastScanAt = await settingsService.getNumberSetting('graveyard.lastScanAt');

      if (lastScanAt && Date.now() - lastScanAt < MIN_SCAN_INTERVAL_MS) {
        return;
      }

      inFlight = true;

      try {
        const result = await graveyardService.runIntegrityScan({ limit: 20 });
        await settingsService.setSetting('graveyard.lastScanAt', result.runAt);
        await settingsService.setSetting('graveyard.lastScanSummary', result);
      } finally {
        inFlight = false;
      }
    };

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void maybeRunScan();
      }
    });

    void maybeRunScan();

    return () => {
      subscription.remove();
    };
  }, [graveyardService, settingsService]);

  return null;
}
