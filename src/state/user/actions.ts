import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { createAction } from '@reduxjs/toolkit'
import { RecentConnectionMeta } from 'connection/types'

import { SupportedLocale } from 'constants/locales'

import { CrossChainSetting, VIEW_MODE } from './reducer'

export interface SerializedToken {
  chainId: number
  address: string
  decimals: number
  symbol?: string
  name?: string
  logoURI?: string
}

export interface SerializedPair {
  token0: SerializedToken
  token1: SerializedToken
}

export const updateUserDegenMode = createAction<{ userDegenMode: boolean; isStablePairSwap: boolean }>(
  'user/updateUserDegenMode',
)
export const updatePoolDegenMode = createAction<{ poolDegenMode: boolean; isStablePairSwap: boolean }>(
  'user/updatePoolDegenMode',
)
export const toggleUseAggregatorForZap = createAction('user/toggleUseAggregatorForZap')
export const toggleTradeRoutes = createAction('user/toggleTradeRoutes')
export const updateUserLocale = createAction<{ userLocale: SupportedLocale }>('user/updateUserLocale')
export const updateUserSlippageTolerance = createAction<{ userSlippageTolerance: number }>(
  'user/updateUserSlippageTolerance',
)
export const updatePoolSlippageTolerance = createAction<{ poolSlippageTolerance: number }>(
  'user/updatePoolSlippageTolerance',
)

export const updateUserDeadline = createAction<{ userDeadline: number }>('user/updateUserDeadline')
export const addSerializedToken = createAction<{ serializedToken: SerializedToken }>('user/addSerializedToken')
export const removeSerializedToken = createAction<{ chainId: number; address: string }>('user/removeSerializedToken')
export const addSerializedPair = createAction<{ serializedPair: SerializedPair }>('user/addSerializedPair')
export const removeSerializedPair = createAction<{ chainId: number; tokenAAddress: string; tokenBAddress: string }>(
  'user/removeSerializedPair',
)
export const toggleTopTrendingTokens = createAction<void>('user/toggleTopTrendingTokens')

export type ToggleFavoriteTokenPayload = {
  chainId: ChainId
  address: string
  newValue?: boolean
}
export const toggleFavoriteToken = createAction<ToggleFavoriteTokenPayload>('user/toggleFavoriteToken')
export const updateChainId = createAction<ChainId>('user/updateChainId')
export const updateTokenAnalysisSettings = createAction<string>('user/updateTokenAnalysisSettings')
export const updateAcceptedTermVersion = createAction<number | null>('user/updateAcceptedTermVersion')
export const changeViewMode = createAction<VIEW_MODE>('user/changeViewMode')
export const toggleHolidayMode = createAction<void>('user/toggleHolidayMode')
export const permitUpdate = createAction<{
  chainId: number
  address: string
  rawSignature: string
  deadline: number
  value: string
  account: string
}>('user/permitUpdate')
export const revokePermit = createAction<{ chainId: number; address: string; account: string }>('user/revokePermit')
export const permitError = createAction<{ chainId: number; address: string; account: string }>('user/permitError')
export const pinSlippageControl = createAction<boolean>('user/pinSlippageControl')
export const toggleMyEarningChart = createAction<void>('user/toggleMyEarningChart')

export const setCrossChainSetting = createAction<CrossChainSetting>('user/setCrossChainSetting')
export const setPaymentToken = createAction<Token | null>('user/setPaymentToken')
export const updateRecentConnectionMeta = createAction<RecentConnectionMeta>('user/updateRecentConnectionMeta')
export const setRecentConnectionDisconnected = createAction<void>('user/setRecentConnectionDisconnected')
export const clearRecentConnectionMeta = createAction<void>('user/clearRecentConnectionMeta')
