import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';

import { DATABASE_NAME, initializeDatabaseAsync } from '@/db/client';
import { colors } from '@/theme';
import { ReminderRuntimeSync } from '@/components/runtime/ReminderRuntimeSync';

export function RootLayoutShell() {
  useEffect(() => {
    if (__DEV__) {
      console.info('[startup] SnapBrain root layout mounted');
    }

    void SystemUI.setBackgroundColorAsync(colors.background).catch((error) => {
      if (__DEV__) {
        console.warn('[startup] Failed to set system background color', error);
      }
    });
  }, []);

  return (
    <SQLiteProvider
      databaseName={DATABASE_NAME}
      onError={(error) => {
        console.error('[startup] SQLite provider failed', error);
      }}
      onInit={initializeDatabaseAsync}
    >
      <ReminderRuntimeSync />
      <StatusBar style="dark" />
      <Stack
        initialRouteName="index"
        screenOptions={{
          contentStyle: {
            backgroundColor: colors.background,
          },
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="capture/[captureId]" options={{ headerShown: false }} />
        <Stack.Screen name="capture/[captureId]/preview" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="tags/[tagId]" options={{ headerShown: false }} />
        <Stack.Screen name="modals/import/picker" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="modals/import/review" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </SQLiteProvider>
  );
}
