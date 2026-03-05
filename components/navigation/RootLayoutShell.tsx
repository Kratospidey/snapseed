import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';

import { DATABASE_NAME, initializeDatabaseAsync } from '@/db/client';
import { colors } from '@/theme';
import { ReminderRuntimeSync } from '@/components/runtime/ReminderRuntimeSync';
import { GraveyardRuntimeSync } from '@/components/runtime/GraveyardRuntimeSync';

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
      <GraveyardRuntimeSync />
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
        <Stack.Screen
          name="capture/[captureId]"
          options={{ animation: 'fade_from_bottom', animationDuration: 180, headerShown: false }}
        />
        <Stack.Screen
          name="capture/[captureId]/preview"
          options={{ animation: 'fade', animationDuration: 180, headerShown: false, presentation: 'fullScreenModal' }}
        />
        <Stack.Screen name="tags/[tagId]" options={{ headerShown: false }} />
        <Stack.Screen name="modals/import/picker" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="modals/import/review" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="modals/relink" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="settings/notifications" options={{ headerShown: false }} />
        <Stack.Screen name="settings/storage" options={{ headerShown: false }} />
        <Stack.Screen name="settings/backup" options={{ headerShown: false }} />
        <Stack.Screen name="settings/about" options={{ headerShown: false }} />
        <Stack.Screen name="settings/onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </SQLiteProvider>
  );
}
