import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';

import { DATABASE_NAME, initializeDatabaseAsync } from '@/db/client';
import { colors } from '@/theme';

export function RootLayoutShell() {
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.background);
  }, []);

  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={initializeDatabaseAsync}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          contentStyle: {
            backgroundColor: colors.background,
          },
          headerShown: false,
        }}
      >
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
