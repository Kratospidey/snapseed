import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { Tabs, useRouter } from 'expo-router';
import { Animated, Platform, StyleSheet, View } from 'react-native';
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
          tabBarBackground: () => <TabBarGlassBackground />,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: {
            fontSize: typography.caption.fontSize,
            fontWeight: '600',
          },
          tabBarStyle: styles.tabBar,
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

function TabBarGlassBackground() {
  const shouldUseBlur = Platform.OS === 'ios';

  return (
    <View pointerEvents="none" style={styles.tabBarBackground}>
      {shouldUseBlur ? (
        <BlurView intensity={26} style={StyleSheet.absoluteFill} tint="light" />
      ) : (
        <View pointerEvents="none" style={styles.tabBarFallbackBase} />
      )}
      <View pointerEvents="none" style={styles.tabBarOverlayTint} />
      <View pointerEvents="none" style={styles.tabBarTopEdge} />
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
  tabBar: {
    backgroundColor: 'transparent',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderTopWidth: 0,
    elevation: 10,
    height: 72,
    overflow: 'hidden',
    paddingBottom: spacing.sm,
    paddingTop: spacing.xs,
    shadowColor: colors.shadow,
    shadowOffset: { height: -4, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
  },
  tabBarBackground: {
    backgroundColor: colors.surfaceGlass,
    ...StyleSheet.absoluteFillObject,
  },
  tabBarFallbackBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
  },
  tabBarOverlayTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(241, 247, 243, 0.32)',
  },
  tabBarTopEdge: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    height: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
