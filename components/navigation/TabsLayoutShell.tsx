import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives/AppText';
import { routes } from '@/constants/routes';
import { colors, spacing, typography } from '@/theme';

const TAB_ICON_BY_ROUTE = {
  library: 'grid-outline',
  reminders: 'alarm-outline',
  search: 'search-outline',
  settings: 'settings-outline',
  tags: 'pricetags-outline',
} as const;

export function TabsLayoutShell() {
  const router = useRouter();

  return (
    <View style={styles.shell}>
      <Tabs
        initialRouteName="library"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: {
            fontSize: typography.caption.fontSize,
            fontWeight: '600',
          },
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            height: 72,
            paddingBottom: spacing.sm,
            paddingTop: spacing.xs,
          },
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              color={color}
              name={TAB_ICON_BY_ROUTE[route.name as keyof typeof TAB_ICON_BY_ROUTE]}
              size={size}
            />
          ),
        })}
      >
        <Tabs.Screen name="library" options={{ title: 'Library' }} />
        <Tabs.Screen name="search" options={{ title: 'Search' }} />
        <Tabs.Screen name="reminders" options={{ title: 'Reminders' }} />
        <Tabs.Screen name="tags" options={{ title: 'Tags' }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      </Tabs>

      <Pressable accessibilityRole="button" onPress={() => router.push(routes.importPicker)} style={styles.fab}>
        <Ionicons color={colors.surface} name="add" size={24} />
        <AppText color={colors.surface} style={styles.fabLabel} variant="caption">
          Add Capture
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 999,
    bottom: 88,
    elevation: 6,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    position: 'absolute',
    right: spacing.lg,
  },
  fabLabel: {
    fontWeight: '700',
  },
  shell: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
