import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

const config: Config = {
  // App is dark-only; no theme switching. `dark:` variants intentionally not configured.
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    // Screens are intentionally MEDIA_WIDTHS + 1 so Tailwind's `max-{bp}:` variant
    // (which compiles to `max-width: screens.bp - 0.02px`) lines up with the
    // original `theme.mediaWidth.upTo*` helpers and JS `useMedia('(max-width: Npx)')`
    // calls — all of which are inclusive at the boundary (e.g. applies at vw=1200).
    // The +1 also shifts min-width `{bp}:` activation by 1px, which is acceptable
    // for the small number of min-width usages in this codebase.
    screens: {
      xxs: '421px',
      xs: '577px',
      sm: '769px',
      md: '993px',
      lg: '1201px',
      xl: '1401px',
      '2xl': '1801px',
    },
    extend: {
      colors: {
        // base
        white: {
          DEFAULT: 'rgb(var(--ks-white-rgb) / <alpha-value>)',
          '04': 'var(--ks-white-04)',
          '08': 'var(--ks-white-08)',
          60: 'var(--ks-white-60)',
        },
        white2: 'rgb(var(--ks-white2-rgb) / <alpha-value>)',
        black: {
          DEFAULT: 'rgb(var(--ks-black-rgb) / <alpha-value>)',
          20: 'var(--ks-black-20)',
          40: 'var(--ks-black-40)',
          48: 'var(--ks-black-48)',
        },

        // text
        text: {
          DEFAULT: 'rgb(var(--ks-text-rgb) / <alpha-value>)',
          '04': 'var(--ks-text-04)',
          '08': 'var(--ks-text-08)',
          12: 'var(--ks-text-12)',
          60: 'var(--ks-text-60)',
        },
        darkText: 'var(--ks-darkText)',
        textReverse: 'var(--ks-textReverse)',
        subText: {
          DEFAULT: 'rgb(var(--ks-subText-rgb) / <alpha-value>)',
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
          DEFAULT: 'rgb(var(--ks-background-rgb) / <alpha-value>)',
          60: 'var(--ks-background-60)',
        },
        tabActive: {
          DEFAULT: 'rgb(var(--ks-tabActive-rgb) / <alpha-value>)',
          80: 'var(--ks-tabActive-80)',
        },
        tabBackground: 'var(--ks-tabBackground)',
        tableHeader: 'rgb(var(--ks-tableHeader-rgb) / <alpha-value>)',
        buttonBlack: {
          DEFAULT: 'rgb(var(--ks-buttonBlack-rgb) / <alpha-value>)',
          40: 'var(--ks-buttonBlack-40)',
          60: 'var(--ks-buttonBlack-60)',
        },
        buttonGray: 'rgb(var(--ks-buttonGray-rgb) / <alpha-value>)',
        bg1: 'var(--ks-bg1)',
        bg2: 'var(--ks-bg2)',
        bg3: 'var(--ks-bg3)',
        bg4: 'var(--ks-bg4)',
        bg5: 'var(--ks-bg5)',
        bg6: 'rgb(var(--ks-bg6-rgb) / <alpha-value>)',

        // primary
        primary: {
          DEFAULT: 'rgb(var(--ks-primary-rgb) / <alpha-value>)',
          10: 'var(--ks-primary-10)',
          12: 'var(--ks-primary-12)',
          15: 'var(--ks-primary-15)',
          20: 'var(--ks-primary-20)',
          25: 'var(--ks-primary-25)',
          30: 'var(--ks-primary-30)',
          40: 'var(--ks-primary-40)',
          50: 'var(--ks-primary-50)',
        },

        // border
        border: {
          DEFAULT: 'rgb(var(--ks-border-rgb) / <alpha-value>)',
          primary: 'rgb(var(--ks-border-primary) / <alpha-value>)',
        },
        darkBorder: 'var(--ks-darkBorder)',

        // semantic
        red: {
          DEFAULT: 'rgb(var(--ks-red-rgb) / <alpha-value>)',
          10: 'var(--ks-red-10)',
          20: 'var(--ks-red-20)',
          25: 'var(--ks-red-25)',
          30: 'var(--ks-red-30)',
          35: 'var(--ks-red-35)',
        },
        red1: 'var(--ks-red1)',
        red2: 'var(--ks-red2)',
        warning: {
          DEFAULT: 'rgb(var(--ks-warning-rgb) / <alpha-value>)',
          10: 'var(--ks-warning-10)',
          20: 'var(--ks-warning-20)',
          25: 'var(--ks-warning-25)',
          30: 'var(--ks-warning-30)',
          35: 'var(--ks-warning-35)',
        },

        // accents
        apr: 'rgb(var(--ks-apr-rgb) / <alpha-value>)',
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
        gray: 'rgb(var(--ks-gray-rgb) / <alpha-value>)',
        blue: 'rgb(var(--ks-blue-rgb) / <alpha-value>)',
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
        sans: ['Work Sans', 'sans-serif'],
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
          '0%, 100%': { boxShadow: '0 0 0 0 rgb(var(--ks-warning-rgb) / 0)' },
          '70%': { boxShadow: '0 0 0 1px rgb(var(--ks-warning-rgb) / 1)' },
        },
        // Drop-shadow pulse for TokenInfo when spread/price warning is active.
        // Color is a slightly lighter orange than --ks-warning; keep as literal hex.
        'token-info-glow': {
          '0%, 100%': { filter: 'drop-shadow(0 0 2px rgba(255, 178, 55, 0.2))' },
          '50%': {
            filter: 'drop-shadow(0 0 8px rgba(255, 178, 55, 0.8)) drop-shadow(0 0 12px rgba(255, 178, 55, 0.4))',
          },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        // Dropdown/popover enter: fade + subtle drop-down + scale from the anchor corner.
        dropdownIn: {
          from: { opacity: '0', transform: 'translateY(-6px) scale(0.97)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        // Push-navigation enter: a detail panel fades in with a short nudge from the right (paired with
        // a "←" back). Kept to a few pixels — travelling the full panel width janks on slow devices.
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        // Push-navigation exit: the detail panel fades back out toward the right on "←" back.
        slideOutRight: {
          from: { opacity: '1', transform: 'translateX(0)' },
          to: { opacity: '0', transform: 'translateX(12px)' },
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
        dropdownIn: 'dropdownIn 0.15s ease-out',
        slideInRight: 'slideInRight 0.15s ease-out',
        slideOutRight: 'slideOutRight 0.12s ease-in forwards',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}

export default config
