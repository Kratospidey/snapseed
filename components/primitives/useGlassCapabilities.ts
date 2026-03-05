import { Platform } from 'react-native';

type UseGlassCapabilitiesOptions = {
  avoidBlur?: boolean;
  prefersPerformance?: boolean;
};

export function useGlassCapabilities(options: UseGlassCapabilitiesOptions = {}) {
  const canUseBlur = Platform.OS === 'ios' && !options.avoidBlur && !options.prefersPerformance;

  return {
    canUseBlur,
    fallbackOnly: !canUseBlur,
  } as const;
}
