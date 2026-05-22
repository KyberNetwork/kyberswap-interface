import type { Config } from 'tailwindcss'

const config: Config = {
  // App is dark-only; no theme switching. `dark:` variants intentionally not configured.
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    screens: {
      xxs: '420px',
      xs: '576px',
      sm: '768px',
      md: '992px',
      lg: '1200px',
      xl: '1400px',
      '2xl': '1800px',
    },
    extend: {
      colors: {
        // base
        white: {
          DEFAULT: 'var(--ks-white)',
          60: 'var(--ks-white-60)',
        },
        white2: 'var(--ks-white2)',
        black: {
          DEFAULT: 'var(--ks-black)',
          20: 'var(--ks-black-20)',
          40: 'var(--ks-black-40)',
          48: 'var(--ks-black-48)',
        },

        // text
        text: 'var(--ks-text)',
        darkText: 'var(--ks-darkText)',
        textReverse: 'var(--ks-textReverse)',
        subText: {
          DEFAULT: 'var(--ks-subText)',
          '04': 'var(--ks-subText-04)',
          20: 'var(--ks-subText-20)',
          40: 'var(--ks-subText-40)',
        },
        disableText: 'var(--ks-disableText)',
        text2: 'var(--ks-text2)',
        text3: 'var(--ks-text3)',
        text4: 'var(--ks-text4)',
        text5: 'var(--ks-text5)',
        text6: 'var(--ks-text6)',

        // backgrounds
        background: {
          DEFAULT: 'var(--ks-background)',
          60: 'var(--ks-background-60)',
        },
        tabActive: {
          DEFAULT: 'var(--ks-tabActive)',
          80: 'var(--ks-tabActive-80)',
        },
        tabBackground: 'var(--ks-tabBackground)',
        tableHeader: 'var(--ks-tableHeader)',
        buttonBlack: {
          DEFAULT: 'var(--ks-buttonBlack)',
          40: 'var(--ks-buttonBlack-40)',
          60: 'var(--ks-buttonBlack-60)',
        },
        buttonGray: 'var(--ks-buttonGray)',
        bg1: 'var(--ks-bg1)',
        bg2: 'var(--ks-bg2)',
        bg3: 'var(--ks-bg3)',
        bg4: 'var(--ks-bg4)',
        bg5: 'var(--ks-bg5)',
        bg6: 'var(--ks-bg6)',

        // primary
        primary: {
          DEFAULT: 'var(--ks-primary)',
          10: 'var(--ks-primary-10)',
          12: 'var(--ks-primary-12)',
          20: 'var(--ks-primary-20)',
          25: 'var(--ks-primary-25)',
          30: 'var(--ks-primary-30)',
          40: 'var(--ks-primary-40)',
          50: 'var(--ks-primary-50)',
        },

        // border
        border: 'var(--ks-border)',
        darkBorder: 'var(--ks-darkBorder)',

        // semantic
        red: {
          DEFAULT: 'var(--ks-red)',
          10: 'var(--ks-red-10)',
          20: 'var(--ks-red-20)',
          30: 'var(--ks-red-30)',
          35: 'var(--ks-red-35)',
        },
        red1: 'var(--ks-red1)',
        red2: 'var(--ks-red2)',
        warning: {
          DEFAULT: 'var(--ks-warning)',
          10: 'var(--ks-warning-10)',
          20: 'var(--ks-warning-20)',
          25: 'var(--ks-warning-25)',
          30: 'var(--ks-warning-30)',
          35: 'var(--ks-warning-35)',
        },

        // accents
        apr: 'var(--ks-apr)',
        lightGreen: 'var(--ks-lightGreen)',
        darkerGreen: 'var(--ks-darkerGreen)',
        darkGreen: 'var(--ks-darkGreen)',
        green: 'var(--ks-green)',
        green1: {
          DEFAULT: 'var(--ks-green1)',
          50: 'var(--ks-green1-50)',
        },
        yellow1: 'var(--ks-yellow1)',
        yellow2: 'var(--ks-yellow2)',
        gray: 'var(--ks-gray)',
        blue: 'var(--ks-blue)',
        blue1: 'var(--ks-blue1)',
        blue2: 'var(--ks-blue2)',
        blue3: 'var(--ks-blue3)',
        darkBlue: 'var(--ks-darkBlue)',

        // shadow colors (used interpolated into box-shadow shorthands)
        shadow: 'var(--ks-shadow)',
        shadow1: 'var(--ks-shadow1)',
      },
      backgroundImage: {
        'gradient-success': 'var(--ks-bgSuccess)',
        'gradient-error': 'var(--ks-bgError)',
        'gradient-warning': 'var(--ks-bgWarning)',
        'gradient-modal': 'var(--ks-bgModal)',
        'gradient-radial': 'var(--ks-radialGradient)',
      },
      fontFamily: {
        sans: ['Work Sans', 'Inter var', 'Inter', 'sans-serif'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        // Scale-based pulse used by LocalLoader (Tailwind's default animate-pulse is opacity-based).
        'pulse-scale': {
          '0%, 100%': { transform: 'scale(1)' },
          '60%': { transform: 'scale(1.1)' },
        },
        // Primary-color box-shadow pulse used by Toggle's data-highlight=true state.
        highlight: {
          '0%, 100%': { boxShadow: '0 0 0 0 var(--ks-primary)' },
          '70%': { boxShadow: '0 0 0 2px var(--ks-primary)' },
        },
        // ProgressBar loading shimmer (sweeps across the bar).
        'loading-shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        // Warning-colored box-shadow pulse used by SlippageControl custom input highlight.
        'highlight-warning': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 153, 1, 0)' },
          '70%': { boxShadow: '0 0 0 1px rgba(255, 153, 1, 1)' },
        },
        // Drop-shadow pulse for TokenInfo when spread/price warning is active.
        'token-info-glow': {
          '0%, 100%': { filter: 'drop-shadow(0 0 2px rgba(255, 178, 55, 0.2))' },
          '50%': {
            filter: 'drop-shadow(0 0 8px rgba(255, 178, 55, 0.8)) drop-shadow(0 0 12px rgba(255, 178, 55, 0.4))',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        // Slower spin variants used by Loader (2s vs Tailwind default 1s).
        'spin-slow': 'spin 2s linear infinite',
        'spin-slow-reverse': 'spin 2s linear infinite reverse',
        'pulse-scale': 'pulse-scale 800ms linear infinite',
        // 2 iterations alternating to mirror original styled-components Toggle.
        highlight: 'highlight 2s 2 alternate ease-in-out',
        'loading-shimmer': 'loading-shimmer 1.2s ease-in-out infinite',
        'highlight-warning': 'highlight-warning 2s infinite alternate ease-in-out',
        'token-info-glow': 'token-info-glow 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
