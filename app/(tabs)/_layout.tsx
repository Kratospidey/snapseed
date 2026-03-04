import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

import { colors, spacing, typography } from '@/theme';

const TAB_ICON_BY_ROUTE = {
  library: 'grid-outline',
  search: 'search-outline',
  reminders: 'alarm-outline',
  tags: 'pricetags-outline',
  settings: 'settings-outline',
} as const;

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="library"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 72,
          paddingBottom: spacing.sm,
          paddingTop: spacing.xs,
        },
        tabBarLabelStyle: {
          fontSize: typography.caption.fontSize,
          fontWeight: '600',
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
  );
}

