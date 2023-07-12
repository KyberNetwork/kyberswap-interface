import { RouteData, Squid } from '@0xsquid/sdk'
import { ChainId, NativeCurrency } from '@kyberswap/ks-sdk-core'
import { createReducer } from '@reduxjs/toolkit'

import { ENV_LEVEL } from 'constants/env'
import { ENV_TYPE } from 'constants/type'
import { MultiChainTokenInfo } from 'pages/Bridge/type'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

import {
  resetBridgeState,
  selectCurrencyCrossChain,
  selectDestChainCrossChain,
  setBridgePoolInfo,
  setBridgeState,
  setCrossChainState,
  setInputAmountCrossChain,
  setRoute,
} from './actions'

export type PoolBridgeValue = undefined | string | number | null
export type PoolValueOutMap = { [address: string]: PoolBridgeValue }

export type CrossChainCurrency = NativeCurrency | WrappedTokenInfo | undefined
export type SwapCrossChainState = {
  chains: ChainId[]
  chainIdOut: ChainId | undefined
  tokens: WrappedTokenInfo[]
  currencyIn: CrossChainCurrency
  currencyOut: CrossChainCurrency
  loadingToken: boolean
  squidInstance: Squid | undefined
  route: RouteData | undefined
  requestId: string
  inputAmount: string
}

export type BridgeState = {
  tokenInfoIn: MultiChainTokenInfo | undefined
  tokenInfoOut: MultiChainTokenInfo | undefined
  currencyIn: WrappedTokenInfo | undefined
  currencyOut: WrappedTokenInfo | undefined

  chainIdOut: ChainId | undefined
  listChainIn: ChainId[]
  listTokenIn: WrappedTokenInfo[]
  listTokenOut: WrappedTokenInfo[]
  loadingToken: boolean

  poolValueOutMap: PoolValueOutMap
}
interface CrossChainState {
  bridge: BridgeState
  crossChain: SwapCrossChainState
}

let defaultChainIdOut = undefined
try {
  const params = Number(new URLSearchParams(window.location.search).get('chainIdOut'))
  if (params && ENV_LEVEL < ENV_TYPE.PROD) defaultChainIdOut = params
} catch (error) {}

const DEFAULT_STATE: CrossChainState = {
  bridge: {
    tokenInfoIn: undefined,
    tokenInfoOut: undefined,
    currencyIn: undefined,
    currencyOut: undefined,

    chainIdOut: undefined,
    listTokenIn: [],
    listChainIn: [],
    listTokenOut: [],
    loadingToken: true,

    poolValueOutMap: {},
  },

  crossChain: {
    inputAmount: '',
    chains: [],
    tokens: [],
    currencyIn: undefined,
    currencyOut: undefined,
    chainIdOut: defaultChainIdOut,
    loadingToken: true,
    squidInstance: undefined,
    route: undefined,
    requestId: '',
  },
}

export default createReducer(DEFAULT_STATE, builder =>
  builder
    .addCase(
      setBridgeState,
      (state, { payload: { tokenIn, tokenOut, chainIdOut, listChainIn, listTokenIn, listTokenOut, loadingToken } }) => {
        if (tokenIn !== undefined) {
          state.bridge.tokenInfoIn = tokenIn?.multichainInfo
          state.bridge.currencyIn = tokenIn
        }
        if (tokenOut !== undefined) {
          state.bridge.tokenInfoOut = tokenOut?.multichainInfo
          state.bridge.currencyOut = tokenOut
        }

        if (chainIdOut !== undefined) state.bridge.chainIdOut = chainIdOut
        if (listChainIn !== undefined) state.bridge.listChainIn = listChainIn
        if (listTokenIn !== undefined) state.bridge.listTokenIn = listTokenIn
        if (listTokenOut !== undefined) state.bridge.listTokenOut = listTokenOut
        if (loadingToken !== undefined) state.bridge.loadingToken = loadingToken
      },
    )
    .addCase(setBridgePoolInfo, (state, { payload: { poolValueOutMap } }) => {
      state.bridge.poolValueOutMap = poolValueOutMap
    })
    .addCase(resetBridgeState, state => {
      state.bridge.tokenInfoIn = undefined
      state.bridge.tokenInfoOut = undefined
      state.bridge.currencyIn = undefined
      state.bridge.currencyOut = undefined
      state.bridge.chainIdOut = undefined
      state.bridge.listTokenIn = []
      state.bridge.listTokenOut = []
    })
    // for swap cross chain below
    .addCase(setCrossChainState, (state, { payload: { chains, tokens, loadingToken, squidInstance } }) => {
      state.crossChain.chains = chains
      state.crossChain.tokens = tokens
      state.crossChain.loadingToken = loadingToken
      state.crossChain.squidInstance = squidInstance
    })
    .addCase(selectCurrencyCrossChain, (state, { payload: { currencyIn, currencyOut } }) => {
      if (currencyIn !== undefined) state.crossChain.currencyIn = currencyIn
      if (currencyOut !== undefined) state.crossChain.currencyOut = currencyOut
    })
    .addCase(setInputAmountCrossChain, (state, { payload: inputAmount }) => {
      state.crossChain.inputAmount = inputAmount
    })
    .addCase(selectDestChainCrossChain, (state, { payload: chainIdOut }) => {
      state.crossChain.chainIdOut = chainIdOut
    })
    .addCase(setRoute, (state, { payload }) => {
      state.crossChain.route = payload?.route
      state.crossChain.requestId = payload?.requestId || ''
    }),
)
