/**
 * Design Tokens for VibeKraft
 * Based on Shadcn/ui design system with WebVM-specific enhancements
 */

// Color Tokens
export const colorTokens = {
  // Base Colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  
  // Gray Scale (using oklch for better color consistency)
  gray: {
    50: 'oklch(0.985 0.002 247.858)',
    100: 'oklch(0.968 0.007 247.896)',
    200: 'oklch(0.929 0.013 255.508)',
    300: 'oklch(0.854 0.026 252.890)',
    400: 'oklch(0.704 0.040 256.788)',
    500: 'oklch(0.554 0.046 257.417)',
    600: 'oklch(0.429 0.042 264.695)',
    700: 'oklch(0.329 0.041 260.031)',
    800: 'oklch(0.279 0.041 260.031)',
    900: 'oklch(0.208 0.042 265.755)',
    950: 'oklch(0.129 0.042 264.695)',
  },
  
  // Brand Colors (WebVM-focused)
  brand: {
    primary: {
      50: 'oklch(0.95 0.05 264)',
      100: 'oklch(0.90 0.10 264)',
      200: 'oklch(0.85 0.15 264)',
      300: 'oklch(0.75 0.20 264)',
      400: 'oklch(0.65 0.25 264)',
      500: 'oklch(0.55 0.30 264)', // Main brand color
      600: 'oklch(0.45 0.25 264)',
      700: 'oklch(0.35 0.20 264)',
      800: 'oklch(0.25 0.15 264)',
      900: 'oklch(0.15 0.10 264)',
      950: 'oklch(0.10 0.05 264)',
    },
    secondary: {
      50: 'oklch(0.95 0.05 300)',
      100: 'oklch(0.90 0.10 300)',
      200: 'oklch(0.85 0.15 300)',
      300: 'oklch(0.75 0.20 300)',
      400: 'oklch(0.65 0.25 300)',
      500: 'oklch(0.55 0.30 300)',
      600: 'oklch(0.45 0.25 300)',
      700: 'oklch(0.35 0.20 300)',
      800: 'oklch(0.25 0.15 300)',
      900: 'oklch(0.15 0.10 300)',
      950: 'oklch(0.10 0.05 300)',
    },
  },
  
  // Semantic Colors
  semantic: {
    success: {
      50: 'oklch(0.95 0.05 142)',
      100: 'oklch(0.90 0.10 142)',
      200: 'oklch(0.85 0.15 142)',
      300: 'oklch(0.75 0.20 142)',
      400: 'oklch(0.65 0.25 142)',
      500: 'oklch(0.55 0.30 142)',
      600: 'oklch(0.45 0.25 142)',
      700: 'oklch(0.35 0.20 142)',
      800: 'oklch(0.25 0.15 142)',
      900: 'oklch(0.15 0.10 142)',
    },
    warning: {
      50: 'oklch(0.95 0.05 85)',
      100: 'oklch(0.90 0.10 85)',
      200: 'oklch(0.85 0.15 85)',
      300: 'oklch(0.75 0.20 85)',
      400: 'oklch(0.65 0.25 85)',
      500: 'oklch(0.55 0.30 85)',
      600: 'oklch(0.45 0.25 85)',
      700: 'oklch(0.35 0.20 85)',
      800: 'oklch(0.25 0.15 85)',
      900: 'oklch(0.15 0.10 85)',
    },
    error: {
      50: 'oklch(0.95 0.05 27)',
      100: 'oklch(0.90 0.10 27)',
      200: 'oklch(0.85 0.15 27)',
      300: 'oklch(0.75 0.20 27)',
      400: 'oklch(0.65 0.25 27)',
      500: 'oklch(0.577 0.245 27.325)',
      600: 'oklch(0.45 0.25 27)',
      700: 'oklch(0.35 0.20 27)',
      800: 'oklch(0.25 0.15 27)',
      900: 'oklch(0.15 0.10 27)',
    },
    info: {
      50: 'oklch(0.95 0.05 220)',
      100: 'oklch(0.90 0.10 220)',
      200: 'oklch(0.85 0.15 220)',
      300: 'oklch(0.75 0.20 220)',
      400: 'oklch(0.65 0.25 220)',
      500: 'oklch(0.55 0.30 220)',
      600: 'oklch(0.45 0.25 220)',
      700: 'oklch(0.35 0.20 220)',
      800: 'oklch(0.25 0.15 220)',
      900: 'oklch(0.15 0.10 220)',
    },
  },
  
  // WebVM-specific colors
  webvm: {
    terminal: {
      background: 'oklch(0.129 0.042 264.695)',
      foreground: 'oklch(0.984 0.003 247.858)',
      cursor: 'oklch(0.704 0.04 256.788)',
      selection: 'oklch(0.704 0.04 256.788 / 0.3)',
    },
    editor: {
      background: 'oklch(0.208 0.042 265.755)',
      foreground: 'oklch(0.984 0.003 247.858)',
      lineNumber: 'oklch(0.554 0.046 257.417)',
      selection: 'oklch(0.704 0.04 256.788 / 0.2)',
    },
    syntax: {
      keyword: 'oklch(0.7 0.15 300)', // Purple
      string: 'oklch(0.7 0.15 142)',  // Green
      function: 'oklch(0.8 0.15 85)',  // Yellow
      variable: 'oklch(0.7 0.15 220)', // Blue
      comment: 'oklch(0.554 0.046 257.417)', // Gray
      operator: 'oklch(0.8 0.1 0)',   // Orange
      number: 'oklch(0.7 0.15 27)',   // Red
    },
  },
};

// Typography Tokens
export const typographyTokens = {
  fontFamily: {
    sans: ['var(--font-geist-sans)', 'system-ui', 'Arial', 'sans-serif'],
    mono: ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular', 'Monaco', 'Consolas', 'monospace'],
    display: ['var(--font-geist-sans)', 'system-ui', 'Arial', 'sans-serif'],
  },
  
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }],
    '6xl': ['3.75rem', { lineHeight: '1' }],
    '7xl': ['4.5rem', { lineHeight: '1' }],
    '8xl': ['6rem', { lineHeight: '1' }],
    '9xl': ['8rem', { lineHeight: '1' }],
  },
  
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
  
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
};

// Spacing Tokens
export const spacingTokens = {
  0: '0px',
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
};

// Border Radius Tokens
export const radiusTokens = {
  none: '0px',
  sm: '0.125rem',
  base: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
};

// Shadow Tokens
export const shadowTokens = {
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  base: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  md: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  lg: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  xl: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: '0 0 #0000',
};

// Animation Tokens
export const animationTokens = {
  duration: {
    75: '75ms',
    100: '100ms',
    150: '150ms',
    200: '200ms',
    300: '300ms',
    500: '500ms',
    700: '700ms',
    1000: '1000ms',
  },
  
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// Component-specific tokens
export const componentTokens = {
  button: {
    height: {
      sm: '2rem',
      base: '2.5rem',
      lg: '3rem',
    },
    padding: {
      sm: '0.5rem 0.75rem',
      base: '0.625rem 1rem',
      lg: '0.75rem 1.5rem',
    },
  },
  
  input: {
    height: {
      sm: '2rem',
      base: '2.5rem',
      lg: '3rem',
    },
  },
  
  card: {
    padding: {
      sm: '1rem',
      base: '1.5rem',
      lg: '2rem',
    },
  },
};

// Export all tokens
export const designTokens = {
  colors: colorTokens,
  typography: typographyTokens,
  spacing: spacingTokens,
  radius: radiusTokens,
  shadows: shadowTokens,
  animations: animationTokens,
  components: componentTokens,
} as const;

export type DesignTokens = typeof designTokens;
