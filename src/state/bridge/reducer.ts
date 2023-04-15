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

export type CrossChainState = {
  chains: ChainId[]
  chainIdOut: ChainId | undefined
  tokens: WrappedTokenInfo[]
  currencyIn: WrappedTokenInfo | undefined
  currencyOut: WrappedTokenInfo | undefined
  loadingToken: boolean
  squidInstance: Squid | undefined
  route: RouteData | undefined
}
export interface BridgeState {
  // todo refactor struct
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

  crossChain: CrossChainState
}

const DEFAULT_STATE: BridgeState = {
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
          state.tokenInfoIn = tokenIn?.multichainInfo
          state.currencyIn = tokenIn
        }
        if (tokenOut !== undefined) {
          state.tokenInfoOut = tokenOut?.multichainInfo
          state.currencyOut = tokenOut
        }

        if (chainIdOut !== undefined) state.chainIdOut = chainIdOut
        if (listChainIn !== undefined) state.listChainIn = listChainIn
        if (listTokenIn !== undefined) state.listTokenIn = listTokenIn
        if (listTokenOut !== undefined) state.listTokenOut = listTokenOut
        if (loadingToken !== undefined) state.loadingToken = loadingToken
      },
    )
    .addCase(setBridgePoolInfo, (state, { payload: { poolValueOutMap } }) => {
      state.poolValueOutMap = poolValueOutMap
    })
    .addCase(resetBridgeState, state => {
      state.tokenInfoIn = undefined
      state.tokenInfoOut = undefined
      state.currencyIn = undefined
      state.currencyOut = undefined
      state.chainIdOut = undefined
      state.listTokenIn = []
      state.listTokenOut = []
    })
    .addCase(setHistoryURL, (state, action) => {
      state.historyURL = action.payload
    })
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
