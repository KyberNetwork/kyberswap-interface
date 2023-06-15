import { RouteData, Squid } from '@0xsquid/sdk'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { createAction } from '@reduxjs/toolkit'

import { CrossChainCurrency, PoolValueOutMap } from 'state/crossChain/reducer'
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

export type CrossChainStateParams = {
  chains: ChainId[]
  tokens: WrappedTokenInfo[]
  loadingToken: boolean
  squidInstance: Squid
}

export const setCrossChainState = createAction<CrossChainStateParams>('crosschain/setCrossChainState')

type SelectCurrencyCrossChainParam = {
  currencyIn?: CrossChainCurrency
  currencyOut?: CrossChainCurrency
}
export const selectCurrencyCrossChain = createAction<SelectCurrencyCrossChainParam>(
  'crosschain/selectCurrencyCrossChain',
)
export const setInputAmountCrossChain = createAction<string>('crosschain/setInputAmountCrossChain')

export const selectDestChainCrossChain = createAction<ChainId | undefined>('crosschain/selectDestChainCrossChain')
export const setRoute = createAction<RouteData | undefined>('crosschain/setRoute')
