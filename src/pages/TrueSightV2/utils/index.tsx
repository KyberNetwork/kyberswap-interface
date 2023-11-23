import { ChainId, WETH } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { commify } from 'ethers/lib/utils'
import { useSearchParams } from 'react-router-dom'
import { DefaultTheme } from 'styled-components'

import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { KyberAIListType } from 'pages/TrueSightV2/types'
import { getChainIdFromSlug, isInEnum } from 'utils/string'

import { KYBERSCORE_TAG_TYPE, NETWORK_TO_CHAINID } from '../constants'

export const calculateValueToColor = (value: number, theme: DefaultTheme) => {
  if (value === 0) return theme.subText

  if (value > 83) {
    return theme.primary
  }
  if (value > 67) {
    return '#8DE1C7'
  }
  if (value > 33) {
    return theme.text
  }
  if (value > 16) {
    return '#FFA7C3'
  }
  return theme.red
}

export const getTypeByKyberScore = (value: number): KYBERSCORE_TAG_TYPE => {
  if (value > 83) {
    return KYBERSCORE_TAG_TYPE.VERY_BULLISH
  }
  if (value > 67) {
    return KYBERSCORE_TAG_TYPE.BULLISH
  }
  if (value > 33) {
    return KYBERSCORE_TAG_TYPE.NEUTRAL
  }
  if (value > 16) {
    return KYBERSCORE_TAG_TYPE.BEARISH
  }
  return KYBERSCORE_TAG_TYPE.VERY_BEARISH
}

export const formatShortNum = (num: number, fixed = 1): string => {
  const negative = num < 0
  const absNum = Math.abs(num)
  let formattedNum = ''
  if (absNum >= 1000000000) {
    formattedNum = (+(absNum / 1000000000).toFixed(fixed)).toString() + 'B'
  } else if (absNum >= 1000000) {
    formattedNum = (+(absNum / 1000000).toFixed(fixed)).toString() + 'M'
  } else if (absNum >= 1000) {
    formattedNum = (+(absNum / 1000).toFixed(fixed)).toString() + 'K'
  } else if (absNum >= 1) {
    formattedNum = (+absNum.toFixed(fixed)).toString()
  } else if (absNum > 0 && absNum <= 0.00001) {
    return '<0.00001'
  } else {
    formattedNum = (+absNum.toPrecision(fixed)).toString()
  }

  return (negative ? '-' : '') + formattedNum
}

export const formatLocaleStringNum = (num: number, fixed?: number): string => {
  if (num === 0) return '--'
  const negative = num < 0
  const absNum = Math.abs(num)
  let formattedNum = ''
  if (num > 1e20) return num.toString()
  if (absNum > 100000) {
    formattedNum = commify(+absNum.toFixed(fixed || 0))
  } else if (absNum > 100) {
    formattedNum = commify(+absNum.toFixed(fixed || 2))
  } else {
    formattedNum = commify(+absNum.toFixed(fixed || 4))
  }
  return (negative ? '-' : '') + formattedNum
}

export const formatTokenPrice = (num: number, fixed?: number): string => {
  if (num === 0) return '--'
  if (num > 1000) {
    return commify(num.toFixed(2))
  } else if (num > 1) {
    return num.toFixed(fixed || 6)
  } else {
    const log10 = Math.ceil(Math.log10(num))
    return num.toFixed(-log10 + (fixed || 4))
  }
}

export const isReferrerCodeInvalid = (error: any) => error?.data?.code === 4040

const mapErr: { [key: number]: string } = {
  4004: t`Verification code is wrong or expired. Please try again.`,
  4040: t`Referral code is invalid.`,
  4090: t`This email address is already registered.`,
}
export const getErrorMessage = (error: any) => {
  const code = error?.data?.code
  return mapErr[code] || t`Error occur, please try again.`
}

// todo move to global
export const navigateToSwapPage = ({ address, chain }: { address?: string; chain?: string | number }) => {
  if (!address || !chain) return
  const chainId: ChainId | undefined = !isNaN(+chain) ? +chain : getChainIdFromSlug(chain as string)
  if (!chainId) return
  window.open(
    window.location.origin +
      `${APP_PATHS.SWAP}/${NETWORKS_INFO[chainId].route}?inputCurrency=${WETH[chainId].address}&outputCurrency=${address}`,
    '_blank',
  )
}

export const navigateToLimitPage = ({ address, chain }: { address?: string; chain?: string }) => {
  if (!address || !chain) return
  const wethAddress = WETH[NETWORK_TO_CHAINID[chain]].address
  const formattedChain = chain === 'bsc' ? 'bnb' : chain
  window.open(
    window.location.origin +
      `${APP_PATHS.LIMIT}/${formattedChain}?inputCurrency=${wethAddress}&outputCurrency=${address}`,
    '_blank',
  )
}

export const colorFundingRateText = (value: number, theme: DefaultTheme) => {
  if (value > 0.015) return theme.primary
  if (value > 0.005) return theme.text
  return theme.red
}

export const useFormatParamsFromUrl = () => {
  const [searchParams] = useSearchParams()
  const { page, listType, sort, ...filter } = Object.fromEntries(searchParams)
  const defaultTab = KyberAIListType.BULLISH
  return {
    page: +page || 1,
    listType: (isInEnum(listType, KyberAIListType) ? listType : defaultTab) || defaultTab,
    filter,
    sort,
  }
}
