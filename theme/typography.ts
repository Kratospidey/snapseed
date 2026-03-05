export const typography = {
  body: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.1,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  display: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '600' as const,
    letterSpacing: 1.2,
    lineHeight: 18,
    textTransform: 'uppercase' as const,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
    lineHeight: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 30,
  },
} as const;
