import type { PropsWithChildren } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

type TactilePressableProps = PropsWithChildren<
  Omit<PressableProps, 'style'> & {
    intensity?: 'soft' | 'strong';
    shadowMode?: 'default' | 'none';
    style?: StyleProp<ViewStyle>;
  }
>;

const PRESS_SCALE_BY_INTENSITY = {
  soft: 0.99,
  strong: 0.98,
} as const;

const SHADOW_FACTOR_BY_INTENSITY = {
  soft: 0.88,
  strong: 0.74,
} as const;

export function TactilePressable({
  children,
  intensity = 'soft',
  shadowMode = 'default',
  style,
  ...props
}: TactilePressableProps) {
  const pressedScale = PRESS_SCALE_BY_INTENSITY[intensity];
  const pressedShadowFactor = SHADOW_FACTOR_BY_INTENSITY[intensity];
  const shouldApplyShadow = shadowMode === 'default';

  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        style,
        pressed
          ? {
              transform: [{ scale: pressedScale }],
              ...(shouldApplyShadow
                ? {
                    elevation: 4 * pressedShadowFactor,
                    shadowOpacity: 0.12 * pressedShadowFactor,
                    shadowRadius: 12 * pressedShadowFactor,
                  }
                : null),
            }
          : shouldApplyShadow
            ? {
                elevation: 4,
                shadowOpacity: 0.12,
                shadowRadius: 12,
              }
            : null,
      ]}
    >
      {children}
    </Pressable>
  );
}
