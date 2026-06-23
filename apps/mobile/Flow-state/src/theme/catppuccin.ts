export const catppuccin = {
  mocha: {
    rosewater: '#f5e0dc',
    flamingo: '#f2cdcd',
    pink: '#f5c2e7',
    mauve: '#cba6f7',
    red: '#f38ba8',
    maroon: '#eba0ac',
    peach: '#fab387',
    yellow: '#f9e2af',
    green: '#a6e3a1',
    teal: '#94e2d5',
    sky: '#89dceb',
    sapphire: '#74c7ec',
    blue: '#89b4fa',
    lavender: '#b4befe',
    text: '#cdd6f4',
    subtext1: '#bac2de',
    subtext0: '#a6adc8',
    overlay2: '#9399b2',
    overlay1: '#7f849c',
    overlay0: '#6c7086',
    surface2: '#585b70',
    surface1: '#45475a',
    surface0: '#313244',
    base: '#1e1e2e',
    mantle: '#181825',
    crust: '#11111b',
  },
} as const;

export type ThemeColor = keyof typeof catppuccin.mocha;

export const font = {
  mono: 'JetBrainsMono',
  body: 'Inter',
} as const;

export const typography = {
  hero: { fontSize: 32, lineHeight: 40, letterSpacing: -0.5, fontFamily: font.body },
  h1: { fontSize: 24, lineHeight: 32, letterSpacing: -0.3, fontFamily: font.body },
  h2: { fontSize: 20, lineHeight: 28, letterSpacing: -0.2, fontFamily: font.body },
  h3: { fontSize: 17, lineHeight: 24, letterSpacing: -0.1, fontFamily: font.body },
  body: { fontSize: 15, lineHeight: 22, letterSpacing: 0, fontFamily: font.body },
  small: { fontSize: 13, lineHeight: 18, letterSpacing: 0, fontFamily: font.body },
  tiny: { fontSize: 11, lineHeight: 14, letterSpacing: 0.2, fontFamily: font.mono },
  label: { fontSize: 12, lineHeight: 16, letterSpacing: 0.4, fontFamily: font.mono, textTransform: 'uppercase' as const },
} as const;

export const spacing = {
  px: 1,
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
} as const;

export const radii = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
} as const;
