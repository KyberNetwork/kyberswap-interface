import { RouteData, Squid } from '@0xsquid/sdk'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { createReducer } from '@reduxjs/toolkit'

import { MultiChainTokenInfo } from 'pages/Bridge/type'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

import {
  resetBridgeState,
  selectCurrencyCrossChain,
  selectDestChainCrossChain,
  setBridgePoolInfo,
  setBridgeState,
  setCrossChainState,
  setHistoryURL,
  setRoute,
} from './actions'

export type PoolBridgeValue = undefined | string | number | null
export type PoolValueOutMap = { [address: string]: PoolBridgeValue }

export type SwapCrossChainState = {
  chains: ChainId[]
  chainIdOut: ChainId | undefined
  tokens: WrappedTokenInfo[]
  currencyIn: WrappedTokenInfo | undefined
  currencyOut: WrappedTokenInfo | undefined
  loadingToken: boolean
  squidInstance: Squid | undefined
  route: RouteData | undefined
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

  historyURL: string
}
interface CrossChainState {
  bridge: BridgeState
  crossChain: SwapCrossChainState
}

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
    historyURL: '',
  },

  crossChain: {
    chains: [],
    tokens: [],
    currencyIn: undefined,
    currencyOut: undefined,
    chainIdOut: undefined,
    loadingToken: true,
    squidInstance: undefined,
    route: undefined,
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
    .addCase(setHistoryURL, (state, action) => {
      state.bridge.historyURL = action.payload
    })
    // for swap cross chain below
    .addCase(setCrossChainState, (state, { payload: { chains, tokens, loadingToken, squidInstance } }) => {
      state.crossChain.chains = chains
      state.crossChain.tokens = tokens
      state.crossChain.loadingToken = loadingToken
      state.crossChain.squidInstance = squidInstance
    })
    .addCase(selectCurrencyCrossChain, (state, { payload: { currencyIn, currencyOut } }) => {
      state.crossChain.currencyIn = currencyIn
      state.crossChain.currencyOut = currencyOut
    })
    .addCase(selectDestChainCrossChain, (state, { payload: chainIdOut }) => {
      state.crossChain.chainIdOut = chainIdOut
    })
    .addCase(setRoute, (state, { payload: route }) => {
      state.crossChain.route = route
    }),
)
