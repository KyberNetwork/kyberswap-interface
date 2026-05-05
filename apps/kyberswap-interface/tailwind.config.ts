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
        white: 'var(--ks-white)',
        white2: 'var(--ks-white2)',
        black: 'var(--ks-black)',

        // text
        text: 'var(--ks-text)',
        darkText: 'var(--ks-darkText)',
        textReverse: 'var(--ks-textReverse)',
        subText: 'var(--ks-subText)',
        disableText: 'var(--ks-disableText)',
        text2: 'var(--ks-text2)',
        text3: 'var(--ks-text3)',
        text4: 'var(--ks-text4)',
        text5: 'var(--ks-text5)',
        text6: 'var(--ks-text6)',

        // backgrounds
        background: 'var(--ks-background)',
        tabActive: 'var(--ks-tabActive)',
        tabBackground: 'var(--ks-tabBackground)',
        tableHeader: 'var(--ks-tableHeader)',
        buttonBlack: 'var(--ks-buttonBlack)',
        buttonGray: 'var(--ks-buttonGray)',
        bg1: 'var(--ks-bg1)',
        bg2: 'var(--ks-bg2)',
        bg3: 'var(--ks-bg3)',
        bg4: 'var(--ks-bg4)',
        bg5: 'var(--ks-bg5)',
        bg6: 'var(--ks-bg6)',

        // primary
        primary: 'var(--ks-primary)',

        // border
        border: 'var(--ks-border)',
        darkBorder: 'var(--ks-darkBorder)',

        // semantic
        red: 'var(--ks-red)',
        red1: 'var(--ks-red1)',
        red2: 'var(--ks-red2)',
        warning: 'var(--ks-warning)',

        // accents
        apr: 'var(--ks-apr)',
        lightGreen: 'var(--ks-lightGreen)',
        darkerGreen: 'var(--ks-darkerGreen)',
        darkGreen: 'var(--ks-darkGreen)',
        green: 'var(--ks-green)',
        green1: 'var(--ks-green1)',
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
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
