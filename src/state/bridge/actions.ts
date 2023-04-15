import { RouteData, Squid } from '@0xsquid/sdk'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { createAction } from '@reduxjs/toolkit'

import { PoolValueOutMap } from 'state/bridge/reducer'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

export type BridgeStateParams = {
  tokenIn?: WrappedTokenInfo | undefined
  tokenOut?: WrappedTokenInfo | undefined
  chainIdOut?: ChainId
  listChainIn?: ChainId[] | undefined
  listTokenIn?: WrappedTokenInfo[] | undefined
  listTokenOut?: WrappedTokenInfo[] | undefined
  loadingToken?: boolean
}

export const setBridgeState = createAction<BridgeStateParams>('bridge/setBridgeState')

export type BridgeStatePoolParams = { poolValueOutMap: PoolValueOutMap }
export const setBridgePoolInfo = createAction<BridgeStatePoolParams>('bridge/setBridgePoolInfo')

export const resetBridgeState = createAction('bridge/resetBridgeState')
export const setHistoryURL = createAction<string>('bridge/setHistoryURL')

export type CrossChainStateParams = {
  chains: ChainId[]
  tokens: WrappedTokenInfo[]
  loadingToken: boolean
  squidInstance: Squid
}

export const setCrossChainState = createAction<CrossChainStateParams>('crosschain/setCrossChainState')

export type SelectCurrencyCrossChainParam = {
  currencyIn: WrappedTokenInfo | undefined
  currencyOut: WrappedTokenInfo | undefined
}
export const selectCurrencyCrossChain = createAction<SelectCurrencyCrossChainParam>(
  'crosschain/selectCurrencyCrossChain',
)

export const selectDestChainCrossChain = createAction<ChainId | undefined>('crosschain/selectDestChainCrossChain')
export const setRoute = createAction<RouteData | undefined>('crosschain/setRoute')
