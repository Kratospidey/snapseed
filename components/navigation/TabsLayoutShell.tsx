import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs, useRouter } from 'expo-router';
import { Animated, StyleSheet, View } from 'react-native';
import { useEffect, useRef } from 'react';

import { AppText } from '@/components/primitives/AppText';
import { TactilePressable } from '@/components/primitives/TactilePressable';
import { routes } from '@/constants/routes';
import { colors, motion, radii, shadows, spacing, typography } from '@/theme';

const TAB_ICON_BY_ROUTE = {
  'library/index': 'grid-outline',
  'reminders/index': 'alarm-outline',
  'search/index': 'search-outline',
  'settings/index': 'settings-outline',
  'tags/index': 'pricetags-outline',
} as const;

type TabRouteName = keyof typeof TAB_ICON_BY_ROUTE;

export function TabsLayoutShell() {
  const router = useRouter();
  const fabFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(fabFloat, {
          duration: motion.duration.slow,
          toValue: -4,
          useNativeDriver: true,
        }),
        Animated.timing(fabFloat, {
          duration: motion.duration.slow,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [fabFloat]);

  return (
    <View style={styles.shell}>
      <Tabs
        initialRouteName="library/index"
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
              name={TAB_ICON_BY_ROUTE[(route.name as TabRouteName) ?? 'library/index'] ?? 'grid-outline'}
              size={size}
            />
          ),
        })}
      >
        <Tabs.Screen name="library/index" options={{ title: 'Library' }} />
        <Tabs.Screen name="search/index" options={{ title: 'Search' }} />
        <Tabs.Screen name="reminders/index" options={{ title: 'Reminders' }} />
        <Tabs.Screen name="tags/index" options={{ title: 'Tags' }} />
        <Tabs.Screen name="settings/index" options={{ title: 'Settings' }} />
      </Tabs>

      <Animated.View style={[styles.fabWrap, { transform: [{ translateY: fabFloat }] }]}>
        <TactilePressable
          accessibilityRole="button"
          intensity="strong"
          onPress={() => router.push(routes.importPicker)}
          style={styles.fab}
        >
          <Ionicons color={colors.surface} name="add" size={24} />
          <AppText color={colors.surface} style={styles.fabLabel} variant="caption">
            Add Capture
          </AppText>
        </TactilePressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderColor: colors.accentStrong,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.floating,
  },
  fabWrap: {
    bottom: 88,
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
