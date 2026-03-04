import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/theme';

export function RootLayoutShell() {
  return (
    <>
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
    </>
  );
}
