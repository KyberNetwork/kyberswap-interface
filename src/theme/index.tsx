import { lighten } from 'polished'
import React, { useMemo } from 'react'
import { Text, TextProps } from 'rebass'
import styled, {
  DefaultTheme,
  ThemeProvider as StyledComponentsThemeProvider,
  createGlobalStyle,
  css,
} from 'styled-components'

import { useIsDarkMode } from 'state/user/hooks'

import { Colors } from './styled'

export * from './components'

export const MEDIA_WIDTHS = {
  upToXXSmall: 420,
  upToExtraSmall: 576,
  upToSmall: 768,
  upToMedium: 992,
  upToLarge: 1200,
  upToXL: 1400,
  upToXXL: 1800,
}

const mediaWidthTemplates: { [width in keyof typeof MEDIA_WIDTHS]: typeof css } = (
  Object.keys(MEDIA_WIDTHS) as (keyof typeof MEDIA_WIDTHS)[]
).reduce((accumulator, size) => {
  accumulator[size] = (a: any, b: any, c: any) => css`
    @media (max-width: ${MEDIA_WIDTHS[size]}px) {
      ${css(a, b, c)}
    }
  `
  return accumulator
}, {} as { [width in keyof typeof MEDIA_WIDTHS]: typeof css })

const white = '#FFFFFF'
const black = '#000000'

function colors(darkMode: boolean): Colors {
  return {
    // base
    white,
    black,

    // text
    text: darkMode ? '#ffffff' : '#222222',
    darkText: '#222222',
    textReverse: darkMode ? '#222222' : '#ffffff',
    subText: darkMode ? '#A9A9A9' : '#5E5E5E',
    disableText: darkMode ? '#373737' : '#B6B6B6',

    // backgrounds
    background: darkMode ? '#1C1C1C' : '#ffffff',
    background2: darkMode ? '#1C1C1C' : '#f5f5f5',
    tabActive: darkMode ? '#313131' : '#ffffff',
    tabBackgound: darkMode ? '#0F0F0F' : '#E2E2E2',

    tableHeader: darkMode ? '#313131' : '#FBFBFB',
    buttonBlack: darkMode ? '#0F0F0F' : '#f5f5f5',
    buttonGray: darkMode ? '#292929' : '#E2E2E2',

    text2: darkMode ? '#C3C5CB' : '#565A69',
    text3: darkMode ? '#6C7284' : '#888D9B',
    text4: darkMode ? '#565A69' : '#C3C5CB',
    text6: darkMode ? '#6d8591' : '#565A69',
    text7: darkMode ? '#c9d2d7' : '#565A69',
    text9: darkMode ? '#859aa5' : '#859aa5',
    text10: darkMode ? '#00a2f7' : '#00a2f7',
    text11: darkMode ? '#f4f4f4' : '#565A69',
    text13: darkMode ? '#f5f5f5' : '#333333',
    text15: darkMode ? '#3b3b3b' : '#8A8A8A',
    text16: darkMode ? '#D8D8D8' : '#212121',

    // backgrounds
    bg1: darkMode ? '#212429' : '#FFFFFF',
    bg2: darkMode ? '#222c31' : '#F7F8FA',
    bg3: darkMode ? '#40444F' : '#dcdbdc',
    bg3Opacity4: darkMode ? '#40444F69' : '#69dcdbdc69',
    bg4: darkMode ? '#565A69' : '#CED0D9',
    bg5: darkMode ? '#6C7284' : '#888D9B',
    bg7: darkMode ? '#31CB9E' : '#98e5ce',
    bg8: darkMode ? '#1d7a5f' : '#31CB9E',
    bg9: darkMode ? '#1d2a32' : '#ecebeb',
    bg10: darkMode ? '#263239' : '#f5f5f5',
    bg11: darkMode ? '#1b2226' : '#ebeaea',
    bg13: darkMode ? '#1f292e' : '#e8e9ed',
    bg14: darkMode ? '#40505a' : '#a9a9a9',
    bg15: darkMode ? '#1f292e' : '#f5f5f5',
    bg16: darkMode ? '#1f292e' : '#ffffff',
    bg17: darkMode ? '#31cb9e33' : '#31cb9e1a',
    bg18: darkMode ? '#1a4052' : '#ecebeb',
    bg19: darkMode ? '#222c31' : '#ffffff',
    bg20: darkMode ? '#243036' : '#F5F5F5',
    bg21: darkMode
      ? 'linear-gradient(90deg, rgba(29, 122, 95, 0.5) 0%, rgba(29, 122, 95, 0) 100%)'
      : 'linear-gradient(90deg, rgba(49, 203, 158, 0.15) 0%, rgba(49, 203, 158, 0) 100%)', // success
    bg22: darkMode
      ? 'linear-gradient(90deg, rgba(255, 83, 123, 0.4) 0%, rgba(255, 83, 123, 0) 100%)'
      : 'linear-gradient(90deg, rgba(255, 83, 123, 0.15) 0%, rgba(255, 83, 123, 0) 100%)', // error
    bg23: darkMode
      ? 'linear-gradient(90deg, rgba(255, 153, 1, 0.5) 0%, rgba(255, 153, 1, 0) 100%)'
      : 'linear-gradient(90deg, rgba(255, 153, 1, 0.5) 0%, rgba(255, 153, 1, 0) 100%)', // warning
    radialGradient: darkMode ? 'radial-gradient(#095143, #06291d)' : 'radial-gradient(#DAEBE6, #DAF1EC)',

    //specialty colors
    modalBG: darkMode ? 'rgba(0,0,0,.425)' : 'rgba(0,0,0,0.3)',
    advancedBG: darkMode ? '#1d272b' : '#ecebeb',
    advancedBorder: darkMode ? '#303e46' : '#dcdbdc',

    //primary colors
    primary: '#31CB9E',

    // border colors
    border: darkMode ? '#505050' : '#C1C1C1',
    btnOutline: darkMode ? '#31cb9e' : '#333333',

    // table colors
    oddRow: darkMode ? '#283339' : '#ffffff',
    evenRow: darkMode ? '#303e46' : '#f4f4f4',

    // other
    red: darkMode ? '#FF537B' : '#FF6871',
    warning: '#FF9901',
    apr: '#0faaa2',
    lightGreen: '#98E5CE',
    darkerGreen: '#1D7A5F',
    red1: '#FF6871',
    red2: '#F82D3A',
    red3: '#D60000',
    darkGreen: '#1D7A5F',
    green: '#31CB9E',
    green1: '#27AE60',
    yellow1: '#FFE270',
    yellow2: '#F3841E',
    blue1: '#31cb9e',
    lightBlue: '#78d5ff',
    darkBlue: '#1183b7',
    blue: darkMode ? '#08A1E7' : '#31cb9e',
    shadow: darkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.04)',
  }
}

function theme(darkMode: boolean): DefaultTheme {
  return {
    ...colors(darkMode),

    grids: {
      sm: 8,
      md: 12,
      lg: 24,
    },

    //shadows
    shadow1: darkMode ? '#000' : '#2F80ED',

    // media queries
    mediaWidth: mediaWidthTemplates,

    // css snippets
    flexColumnNoWrap: css`
      display: flex;
      flex-flow: column nowrap;
    `,
    flexRowNoWrap: css`
      display: flex;
      flex-flow: row nowrap;
    `,
    darkMode: darkMode,
  }
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const darkMode = useIsDarkMode()

  const themeObject = useMemo(() => theme(darkMode), [darkMode])

  return <StyledComponentsThemeProvider theme={themeObject}>{children}</StyledComponentsThemeProvider>
}

const TextWrapper = styled(Text)<{ color: keyof Colors }>`
  color: ${({ color, theme }) => (theme as any)[color]} !important;
`

export const TYPE = {
  main(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'subText'} {...props} />
  },
  link(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'primary'} {...props} />
  },
  black(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'text'} {...props} />
  },
  white(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'white'} {...props} />
  },
  body(props: TextProps) {
    return <TextWrapper fontWeight={400} fontSize={16} color={'text'} {...props} />
  },
  largeHeader(props: TextProps) {
    return <TextWrapper fontWeight={600} fontSize={24} {...props} />
  },
  mediumHeader(props: TextProps) {
    return <TextWrapper fontWeight={500} fontSize={20} {...props} />
  },
  subHeader(props: TextProps) {
    return <TextWrapper fontWeight={400} fontSize={14} {...props} />
  },
  h3(props: TextProps) {
    return <TextWrapper fontSize={'18px'} fontWeight={500} color={'#E1F5FE'} lineheight={'21px'} my={0} {...props} />
  },
  small(props: TextProps) {
    return <TextWrapper fontWeight={500} fontSize={11} {...props} />
  },
  blue(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'primary'} {...props} />
  },
  yellow(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'yellow1'} {...props} />
  },
  warning(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'warning'} {...props} />
  },
  darkGray(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'text3'} {...props} />
  },
  gray(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'bg3'} {...props} />
  },
  italic(props: TextProps) {
    return <TextWrapper fontWeight={500} fontSize={12} fontStyle={'italic'} color={'text2'} {...props} />
  },
  error({ error, ...props }: { error: boolean } & TextProps) {
    return <TextWrapper fontWeight={500} color={error ? 'red1' : 'text2'} {...props} />
  },
}

export const FixedGlobalStyle = createGlobalStyle`
  html, input, textarea, button {
    font-family: 'Work Sans', 'Inter', sans-serif;
    font-display: fallback;
  }

  @supports (font-variation-settings: normal) {
    html, input, textarea, button {
      font-family: 'Work Sans', 'Inter var', sans-serif;
    }
  }

  html,
  body {
    margin: 0;
    padding: 0;
  }

  a {
    color: ${colors(false).primary};
    text-decoration: none;
    :hover{
      color: ${lighten(0.2, colors(false).primary)};
    }
  }

  * {
    box-sizing: border-box;
  }

  button {
    user-select: none;
  }

  html {
    font-size: 16px;
    font-variant: none;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    font-feature-settings: 'ss01' on, 'ss02' on, 'cv01' on, 'cv03' on;

  }
`

export const ThemedGlobalStyle = createGlobalStyle`
  ::-webkit-scrollbar {
    display: none;
  }

  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */

  html {
    color: ${({ theme }) => theme.text};
    background-color: ${({ theme }) => theme.buttonBlack};

    --color-primary-120: #27a27e;
    --color-primary-110: #2cb78e;
    --color-primary: #31CB9E;
    --color-primary-90: #44d2a8;
    --color-primary-80: #59d7b2;
    --color-red-120:#ff0f47
    --color-red-110:#ff3161
    --color-red:#FF537B
    --color-red-90:#ff6488
    --color-red-80:#ff7595
    --color-warning-120:#cd7b00
    --color-warning-110:#e68a00
    --color-warning:#FF9901
    --color-warning-90:#ffa31a
    --color-warning-80:#ffad34

    ${({ theme }) =>
      theme.darkMode
        ? css`
            --color-background-120: #161616;
            --color-background-110: #191919;
            --color-background: #1c1c1c;
            --color-background-90: #333333;
            --color-background-80: #494949;
            --color-button-black-120: #0c0c0c;
            --color-button-black-110: #0d0d0d;
            --color-button-black: #0f0f0f;
            --color-button-black-90: #272727;
            --color-button-black-80: #3f3f3f;
            --color-button-gray-120: #212121;
            --color-button-gray-110: #252525;
            --color-button-gray: #292929;
            --color-button-gray-90: #3e3e3e;
            --color-button-gray-80: #545454;
            --color-text-120: #cccccc;
            --color-text-110: #e6e6e6;
            --color-text: #ffffff;
            --color-subtext-120: #878787;
            --color-subtext-110: #989898;
            --color-subtext: #a9a9a9;
            --color-table-header-120: #272727;
            --color-table-header-110: #2c2c2c;
            --color-table-header: #313131;
            --color-border-120: #404040;
            --color-border-110: #484848;
            --color-border: #505050;
            --color-border-90: #616161;
            --color-border-80: #737373;
          `
        : css`
            --color-background-120: #ffffff;
            --color-background-110: #ffffff;
            --color-background: #ffffff;
            --color-background-90: #e6e6e6;
            --color-background-80: #cccccc;
            --color-button-black-120: #f7f7f7;
            --color-button-black-110: #f6f6f6;
            --color-button-black: #f5f5f5;
            --color-button-black-90: #dcdcdc;
            --color-button-black-80: #c4c4c4;
            --color-button-gray-120: #e8e8e8;
            --color-button-gray-110: #e5e5e5;
            --color-button-gray: #e2e2e2;
            --color-button-gray-90: #cbcbcb;
            --color-button-gray-80: #b5b5b5;
            --color-text-120: #4e4e4e;
            --color-text-110: #383838;
            --color-text: #222222;
            --color-subtext-120: #7e7e7e;
            --color-subtext-110: #6e6e6e;
            --color-subtext: #5e5e5e;
            --color-table-header-120: #fcfcfc;
            --color-table-header-110: #fbfbfb;
            --color-table-header: #fbfbfb;
            --color-border-120: #cdcdcd;
            --color-border-110: #c7c7c7;
            --color-border: #c1c1c1;
            --color-border-90: #aeaeae;
            --color-border-80: #9a9a9a;
          `}
  }

  body {
    min-height: 100vh;
    background: ${({ theme }) => theme.buttonBlack};
  }

  .staked-only-switch {
    box-shadow: 0 0 0 2px;
    background: ${({ theme }) => theme.background} !important;
  }

  .staked-only-switch[aria-checked="false"] div {
    background: ${({ theme }) => theme.border} !important;
  }

  .staked-only-switch div {
    background: ${({ theme }) => theme.primary};
  }

  #language-selector {
    &:focus-visible {
      outline-width: 0;
    }
  }

  .grecaptcha-badge {
    visibility: hidden;
  }

  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type=number] {
    -moz-appearance: textfield; /* Firefox */
  }

  .tv-lightweight-charts{
    width: 100% !important;

    & > * {
      width: 100% !important;
    }
  }

`
