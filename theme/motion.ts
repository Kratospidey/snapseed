export const motion = {
  duration: {
    fast: 120,
    medium: 180,
    normal: 180,
    slow: 320,
    slower: 520,
  },
  easing: {
    emphasized: [0.2, 0.0, 0, 1] as const,
    smooth: [0.22, 1, 0.36, 1] as const,
    standard: [0.2, 0, 0, 1] as const,
  },
  spring: {
    snappy: {
      damping: 18,
      mass: 0.4,
      stiffness: 300,
    },
    soft: {
      damping: 20,
      mass: 0.5,
      stiffness: 220,
    },
  },
} as const;
