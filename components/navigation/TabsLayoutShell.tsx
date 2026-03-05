import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';
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
      <NativeTabs
        backgroundColor="rgba(255, 255, 255, 0.8)"
        blurEffect={Platform.OS === 'ios' ? 'systemUltraThinMaterialLight' : undefined}
        disableTransparentOnScrollEdge
        iconColor={{ default: colors.textMuted, selected: colors.accent }}
        labelStyle={{
          default: {
            color: colors.textMuted,
            fontSize: typography.caption.fontSize,
            fontWeight: '600',
          },
          selected: {
            color: colors.accent,
            fontSize: typography.caption.fontSize,
            fontWeight: '700',
          },
        }}
        shadowColor="rgba(12, 20, 16, 0.08)"
      >
        <NativeTabs.Trigger name="library/index">
          <Label>Library</Label>
          <Icon src={<VectorIcon family={Ionicons} name={TAB_ICON_BY_ROUTE['library/index']} />} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="search/index">
          <Label>Search</Label>
          <Icon src={<VectorIcon family={Ionicons} name={TAB_ICON_BY_ROUTE['search/index']} />} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="reminders/index">
          <Label>Reminders</Label>
          <Icon src={<VectorIcon family={Ionicons} name={TAB_ICON_BY_ROUTE['reminders/index']} />} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="tags/index">
          <Label>Tags</Label>
          <Icon src={<VectorIcon family={Ionicons} name={TAB_ICON_BY_ROUTE['tags/index']} />} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="settings/index">
          <Label>Settings</Label>
          <Icon src={<VectorIcon family={Ionicons} name={TAB_ICON_BY_ROUTE['settings/index']} />} />
        </NativeTabs.Trigger>
      </NativeTabs>

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
