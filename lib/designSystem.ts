/**
 * FusionAI Design System
 * Modern dark theme with cyberpunk aesthetics
 */

export const designTokens = {
  // Colors
  colors: {
    // Base
    background: {
      primary: '#0e0e0f',
      secondary: '#131314',
      tertiary: '#201f21',
      elevated: '#262627',
    },
    // Accent colors
    accent: {
      cyan: '#00F0FF',
      cyanDark: '#00deec',
      cyanLight: '#00eefc',
      purple: '#7000ff',
      purpleLight: '#ac89ff',
      pink: '#ff59e3',
    },
    // Text
    text: {
      primary: '#ffffff',
      secondary: '#adaaab',
      tertiary: '#6b6b6b',
    },
    // Status
    status: {
      success: '#00ff88',
      error: '#ff4444',
      warning: '#ffaa00',
      info: '#00aaff',
    },
    // Gradients
    gradients: {
      primary: 'linear-gradient(135deg, #00F0FF 0%, #7000ff 100%)',
      glow: 'radial-gradient(circle, rgba(0,240,255,0.2) 0%, transparent 70%)',
      card: 'linear-gradient(180deg, rgba(0,240,255,0.05) 0%, transparent 100%)',
    }
  },

  // Typography
  typography: {
    fonts: {
      primary: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif',
      mono: 'var(--font-geist-mono), ui-monospace, monospace',
    },
    sizes: {
      xs: '0.625rem',   // 10px
      sm: '0.75rem',    // 12px
      base: '0.875rem', // 14px
      md: '0.9375rem',  // 15px
      lg: '1rem',       // 16px
      xl: '1.125rem',   // 18px
      '2xl': '1.25rem', // 20px
      '3xl': '1.5rem',  // 24px
      '4xl': '2rem',    // 32px
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    }
  },

  // Spacing
  spacing: {
    xs: '0.25rem',  // 4px
    sm: '0.5rem',   // 8px
    md: '0.75rem',  // 12px
    lg: '1rem',     // 16px
    xl: '1.5rem',   // 24px
    '2xl': '2rem',  // 32px
    '3xl': '3rem',  // 48px
    '4xl': '4rem',  // 64px
  },

  // Border radius
  radius: {
    sm: '0.5rem',   // 8px
    md: '0.75rem',  // 12px
    lg: '1rem',     // 16px
    xl: '1.5rem',   // 24px
    '2xl': '2rem',  // 32px
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    glow: '0 0 20px rgba(0, 240, 255, 0.3)',
    glowPurple: '0 0 20px rgba(112, 0, 255, 0.3)',
    glowPink: '0 0 20px rgba(255, 89, 227, 0.3)',
  },

  // Animations
  animations: {
    durations: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easings: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      smooth: 'cubic-bezier(0.4, 0, 0.6, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    }
  },

  // Z-index layers
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  }
};

// Utility function to get color with opacity
export const withOpacity = (color: string, opacity: number) => {
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
};

// Common component styles
export const componentStyles = {
  button: {
    primary: `
      px-6 py-3 rounded-2xl
      bg-gradient-to-r from-cyan-400 to-cyan-500
      text-gray-900 font-semibold
      transition-all duration-300
      hover:shadow-[0_0_20px_rgba(0,240,255,0.5)]
      hover:-translate-y-0.5
      active:translate-y-0
      disabled:opacity-40 disabled:cursor-not-allowed
    `,
    secondary: `
      px-6 py-3 rounded-2xl
      bg-[#262627] border border-white/5
      text-white font-medium
      transition-all duration-300
      hover:bg-[#2f2f2f] hover:border-white/10
      disabled:opacity-40 disabled:cursor-not-allowed
    `,
    ghost: `
      px-4 py-2 rounded-xl
      text-[#adaaab] font-medium
      transition-all duration-300
      hover:bg-[#201f21] hover:text-white
    `,
  },
  input: {
    base: `
      w-full px-4 py-3 rounded-xl
      bg-[#201f21] border border-white/5
      text-white placeholder-[#adaaab]/70
      outline-none transition-all duration-300
      focus:border-[#00F0FF]/50 focus:bg-[#262627]
    `,
  },
  card: {
    base: `
      rounded-3xl bg-[#131314] border border-white/5
      backdrop-blur-xl overflow-hidden
      transition-all duration-500
      hover:border-white/10
    `,
    elevated: `
      rounded-3xl bg-[#131314] border border-white/5
      backdrop-blur-xl overflow-hidden
      shadow-2xl
      transition-all duration-500
      hover:border-white/10 hover:shadow-[0_0_30px_rgba(0,240,255,0.1)]
    `,
  }
};

export default designTokens;
