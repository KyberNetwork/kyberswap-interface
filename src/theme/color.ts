const white = '#FFFFFF'
const black = '#000000'

export function colors() {
  return {
    // base
    white,
    black,

    // text
    text: '#ffffff',
    darkText: '#222222',
    textReverse: '#222222',
    subText: '#A9A9A9',
    disableText: '#373737',

    // backgrounds
    background: '#1C1C1C',
    background2: '#1C1C1C',
    tabActive: '#313131',
    tabBackground: '#0F0F0F',

    tableHeader: '#313131',
    buttonBlack: '#0F0F0F',
    buttonGray: '#292929',

    text2: '#C3C5CB',
    text3: '#6C7284',
    text4: '#565A69',
    text6: '#6d8591',
    text7: '#c9d2d7',
    text9: '#859aa5',
    text10: '#00a2f7',
    text11: '#f4f4f4',
    text13: '#f5f5f5',
    text15: '#3b3b3b',
    text16: '#D8D8D8',

    // backgrounds
    bg1: '#212429',
    bg2: '#222c31',
    bg3: '#40444F',
    bg3Opacity4: '#40444F69',
    bg4: '#565A69',
    bg5: '#6C7284',
    bg7: '#31CB9E',
    bg8: '#1d7a5f',
    bg9: '#1d2a32',
    bg10: '#263239',
    bg11: '#1b2226',
    bg13: '#1f292e',
    bg14: '#40505a',
    bg15: '#1f292e',
    bg16: '#1f292e',
    bg17: '#31cb9e33',
    bg18: '#1a4052',
    bg19: '#222c31',
    bg20: '#243036',
    bg21: 'linear-gradient(90deg, rgba(29, 122, 95, 0.5) 0%, rgba(29, 122, 95, 0) 100%)', // success
    bg22: 'linear-gradient(90deg, rgba(255, 83, 123, 0.4) 0%, rgba(255, 83, 123, 0) 100%)', // error
    bg23: 'linear-gradient(90deg, rgba(255, 153, 1, 0.5) 0%, rgba(255, 153, 1, 0) 100%)', // warning
    radialGradient: 'radial-gradient(#095143, #06291d)',

    //specialty colors
    modalBG: 'rgba(0,0,0,.425)',
    advancedBG: '#1d272b',
    advancedBorder: '#303e46',

    //primary colors
    primary: '#31CB9E',
    primary30: '#1D4D3D',

    // border colors
    border: '#505050',
    btnOutline: '#31cb9e',

    // table colors
    oddRow: '#283339',
    evenRow: '#303e46',

    //shadows
    shadow1: '#000',

    // other
    red: '#FF537B',
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
    blue: '#08A1E7',
    shadow: 'rgba(0, 0, 0, 0.2)',
  } as const
}

export type Colors = ReturnType<typeof colors>
