import { colors } from './colors';

export const shadows = {
  floating: {
    elevation: 8,
    shadowColor: colors.shadow,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
  },
  md: {
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  sm: {
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
} as const;
