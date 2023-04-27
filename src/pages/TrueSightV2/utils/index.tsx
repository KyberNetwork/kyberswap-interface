import { ChainId } from '@kyberswap/ks-sdk-core'
import { DefaultTheme } from 'styled-components'

import { NETWORKS_INFO } from 'constants/networks'

export const calculateValueToColor = (value: number, theme: DefaultTheme) => {
  if (value === 0) return theme.darkMode ? theme.subText : theme.border
  if (value < 20) {
    return theme.red
  }
  if (value < 40) {
    return '#FFA7C3'
  }
  if (value < 60) {
    return theme.darkMode ? theme.text : theme.border
  }
  if (value < 80) {
    return '#8DE1C7'
  }
  return theme.primary
}

export const formatShortNum = (num: number, fixed = 1): string => {
  const negative = num < 0
  const absNum = Math.abs(num)
  let formattedNum = ''
  if (absNum > 1000000000) {
    formattedNum = (+(absNum / 1000000000).toFixed(fixed)).toString() + 'B'
  } else if (absNum > 1000000) {
    formattedNum = (+(absNum / 1000000).toFixed(fixed)).toString() + 'M'
  } else if (absNum > 1000) {
    formattedNum = (+(absNum / 1000).toFixed(fixed)).toString() + 'K'
  } else {
    formattedNum = (+absNum.toFixed(fixed)).toString()
  }

  return (negative ? '-' : '') + formattedNum
}

export const formatLocaleStringNum = (num: number): string => {
  if (num === 0) return '--'
  const negative = num < 0
  const absNum = Math.abs(num)
  let formattedNum = ''
  if (absNum > 100000) {
    formattedNum = (+absNum.toFixed(0)).toLocaleString()
  } else if (absNum > 1000) {
    formattedNum = (+absNum.toFixed(2)).toLocaleString()
  } else {
    formattedNum = (+absNum.toFixed(5)).toLocaleString()
  }
  return (negative ? '-' : '') + formattedNum
}

export const NETWORK_IMAGE_URL: { [chain: string]: string } = {
  ethereum: NETWORKS_INFO[ChainId.MAINNET].icon,
  bsc: NETWORKS_INFO[ChainId.BSCMAINNET].icon,
  arbitrum: NETWORKS_INFO[ChainId.ARBITRUM].icon,
  optimism: NETWORKS_INFO[ChainId.OPTIMISM].icon,
  avalanche: NETWORKS_INFO[ChainId.AVAXMAINNET].icon,
  polygon: NETWORKS_INFO[ChainId.MATIC].icon,
  fantom: NETWORKS_INFO[ChainId.FANTOM].icon,
}
