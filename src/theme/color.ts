const white = '#FFFFFF'
const black = '#000000'

export function colors(darkMode: boolean) {
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
    tabBackground: darkMode ? '#0F0F0F' : '#E2E2E2',

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
    primary30: darkMode ? '#1D4D3D' : '#C7E9DC',

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
  } as const
}

export type Colors = ReturnType<typeof colors>
