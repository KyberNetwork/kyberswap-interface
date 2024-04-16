import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { createReducer } from '@reduxjs/toolkit'
import { getRecentConnectionMeta, setRecentConnectionMeta } from 'connection/meta'
import { RecentConnectionMeta } from 'connection/types'

import {
  DEFAULT_DEADLINE_FROM_NOW,
  DEFAULT_SLIPPAGE,
  DEFAULT_SLIPPAGE_STABLE_PAIR_SWAP,
  INITIAL_ALLOWED_SLIPPAGE,
  MAX_NORMAL_SLIPPAGE_IN_BIPS,
} from 'constants/index'
import { SupportedLocale } from 'constants/locales'
import { updateVersion } from 'state/global/actions'

import {
  SerializedPair,
  SerializedToken,
  addSerializedPair,
  addSerializedToken,
  changeViewMode,
  clearRecentConnectionMeta,
  permitError,
  permitUpdate,
  pinSlippageControl,
  removeSerializedPair,
  removeSerializedToken,
  revokePermit,
  setCrossChainSetting,
  setPaymentToken,
  setRecentConnectionDisconnected,
  toggleFavoriteToken,
  toggleHolidayMode,
  toggleMyEarningChart,
  toggleTradeRoutes,
  toggleUseAggregatorForZap,
  updateAcceptedTermVersion,
  updateChainId,
  updatePoolDegenMode,
  updatePoolSlippageTolerance,
  updateRecentConnectionMeta,
  updateUserDeadline,
  updateUserDegenMode,
  updateUserLocale,
  updateUserSlippageTolerance,
} from './actions'

const currentTimestamp = () => new Date().getTime()
const AUTO_DISABLE_DEGEN_MODE_MINUTES = 30

export enum VIEW_MODE {
  GRID = 'grid',
  LIST = 'list',
}

export type CrossChainSetting = {
  isSlippageControlPinned: boolean
  slippageTolerance: number
  enableExpressExecution: boolean
}

export interface UserState {
  recentConnectionMeta?: RecentConnectionMeta

  // the timestamp of the last updateVersion action
  lastUpdateVersionTimestamp?: number

  userLocale: SupportedLocale | null

  userDegenMode: boolean
  userDegenModeAutoDisableTimestamp: number
  poolDegenMode: boolean
  poolDegenModeAutoDisableTimestamp: number
  useAggregatorForZap: boolean

  // user defined slippage tolerance in bips, used in SWAP page
  userSlippageTolerance: number // For SWAP page
  poolSlippageTolerance: number // For POOL and other pages
  // deadline set by user in minutes, used in all txns
  userDeadline: number

  tokens: {
    [chainId: number]: {
      [address: string]: SerializedToken
    }
  }

  pairs: {
    [chainId: number]: {
      // keyed by token0Address:token1Address
      [key: string]: SerializedPair
    }
  }

  timestamp: number
  favoriteTokensByChainId?: Partial<
    Record<
      ChainId,
      {
        includeNativeToken: boolean
        addresses: string[]
      }
    >
  >
  favoriteTokensByChainIdv2: Partial<
    Record<
      ChainId,
      {
        [address: string]: boolean
      }
    >
  >
  readonly chainId: ChainId
  acceptedTermVersion: number | null
  viewMode: VIEW_MODE
  paymentToken: Token | null
  holidayMode: boolean
  permitData: {
    [account: string]: {
      [chainId: number]: {
        [address: string]: {
          rawSignature?: string
          deadline?: number
          value?: string
          errorCount?: number
        } | null
      }
    }
  }

  isSlippageControlPinned: boolean

  crossChain: CrossChainSetting
  myEarningChart: boolean
  showTradeRoutes: boolean
}

function pairKey(token0Address: string, token1Address: string) {
  return `${token0Address};${token1Address}`
}

export const CROSS_CHAIN_SETTING_DEFAULT = {
  isSlippageControlPinned: true,
  slippageTolerance: INITIAL_ALLOWED_SLIPPAGE,
  enableExpressExecution: false,
}

const initialState: UserState = {
  recentConnectionMeta: getRecentConnectionMeta(),
  userDegenMode: false, // For SWAP page
  userDegenModeAutoDisableTimestamp: 0,
  poolDegenMode: false, // For POOL and other pages
  poolDegenModeAutoDisableTimestamp: 0,
  useAggregatorForZap: true,
  userLocale: null,
  userSlippageTolerance: INITIAL_ALLOWED_SLIPPAGE,
  poolSlippageTolerance: INITIAL_ALLOWED_SLIPPAGE,
  userDeadline: DEFAULT_DEADLINE_FROM_NOW,
  tokens: {},
  pairs: {},
  timestamp: currentTimestamp(),
  favoriteTokensByChainId: {},
  favoriteTokensByChainIdv2: {},
  chainId: ChainId.MAINNET,
  acceptedTermVersion: null,
  viewMode: VIEW_MODE.GRID,
  holidayMode: true,
  permitData: {},
  isSlippageControlPinned: true,
  crossChain: CROSS_CHAIN_SETTING_DEFAULT,
  myEarningChart: true,
  paymentToken: null,
  showTradeRoutes: true,
}

export default createReducer(initialState, builder =>
  builder
    .addCase(updateVersion, state => {
      // slippage isnt being tracked in local storage, reset to default
      // noinspection SuspiciousTypeOfGuard
      if (typeof state.userSlippageTolerance !== 'number') {
        state.userSlippageTolerance = INITIAL_ALLOWED_SLIPPAGE
      }

      if (typeof state.isSlippageControlPinned !== 'boolean') {
        state.isSlippageControlPinned = initialState.isSlippageControlPinned
      }

      // deadline isnt being tracked in local storage, reset to default
      // noinspection SuspiciousTypeOfGuard
      if (typeof state.userDeadline !== 'number') {
        state.userDeadline = DEFAULT_DEADLINE_FROM_NOW
      }

      state.lastUpdateVersionTimestamp = currentTimestamp()
    })
    .addCase(updateUserDegenMode, (state, action) => {
      state.userDegenMode = action.payload.userDegenMode
      if (action.payload.userDegenMode) {
        state.userDegenModeAutoDisableTimestamp = Date.now() + AUTO_DISABLE_DEGEN_MODE_MINUTES * 60 * 1000
      } else {
        // If max slippage <= 19.99%, no need update slippage.
        if (state.userSlippageTolerance <= MAX_NORMAL_SLIPPAGE_IN_BIPS) {
          return
        }
        // Else, update to default slippage.
        if (action.payload.isStablePairSwap) {
          state.userSlippageTolerance = Math.min(state.userSlippageTolerance, DEFAULT_SLIPPAGE_STABLE_PAIR_SWAP)
        } else {
          state.userSlippageTolerance = Math.min(state.userSlippageTolerance, DEFAULT_SLIPPAGE)
        }
      }
      state.timestamp = currentTimestamp()
    })
    .addCase(updatePoolDegenMode, (state, action) => {
      state.poolDegenMode = action.payload.poolDegenMode
      if (action.payload.poolDegenMode) {
        state.poolDegenModeAutoDisableTimestamp = Date.now() + AUTO_DISABLE_DEGEN_MODE_MINUTES * 60 * 1000
      } else {
        // If max slippage <= 19.99%, no need update slippage.
        if (state.poolSlippageTolerance <= MAX_NORMAL_SLIPPAGE_IN_BIPS) {
          return
        }
        // Else, update to default slippage.
        if (action.payload.isStablePairSwap) {
          state.poolSlippageTolerance = Math.min(state.poolSlippageTolerance, DEFAULT_SLIPPAGE_STABLE_PAIR_SWAP)
        } else {
          state.poolSlippageTolerance = Math.min(state.poolSlippageTolerance, DEFAULT_SLIPPAGE)
        }
      }
      state.timestamp = currentTimestamp()
    })
    .addCase(updateUserLocale, (state, action) => {
      state.userLocale = action.payload.userLocale
      state.timestamp = currentTimestamp()
    })
    .addCase(updateUserSlippageTolerance, (state, action) => {
      state.userSlippageTolerance = action.payload.userSlippageTolerance
      state.timestamp = currentTimestamp()
    })
    .addCase(updatePoolSlippageTolerance, (state, action) => {
      state.poolSlippageTolerance = action.payload.poolSlippageTolerance
      state.timestamp = currentTimestamp()
    })
    .addCase(updateUserDeadline, (state, action) => {
      state.userDeadline = action.payload.userDeadline
      state.timestamp = currentTimestamp()
    })
    .addCase(addSerializedToken, (state, { payload: { serializedToken } }) => {
      state.tokens[serializedToken.chainId] = state.tokens[serializedToken.chainId] || {}
      state.tokens[serializedToken.chainId][serializedToken.address] = serializedToken
      state.timestamp = currentTimestamp()
    })
    .addCase(removeSerializedToken, (state, { payload: { address, chainId } }) => {
      state.tokens[chainId] = state.tokens[chainId] || {}
      delete state.tokens[chainId][address]
      state.timestamp = currentTimestamp()
    })
    .addCase(addSerializedPair, (state, { payload: { serializedPair } }) => {
      if (
        serializedPair.token0.chainId === serializedPair.token1.chainId &&
        serializedPair.token0.address !== serializedPair.token1.address
      ) {
        const chainId = serializedPair.token0.chainId
        state.pairs[chainId] = state.pairs[chainId] || {}
        state.pairs[chainId][pairKey(serializedPair.token0.address, serializedPair.token1.address)] = serializedPair
      }
      state.timestamp = currentTimestamp()
    })
    .addCase(removeSerializedPair, (state, { payload: { chainId, tokenAAddress, tokenBAddress } }) => {
      if (state.pairs[chainId]) {
        // just delete both keys if either exists
        delete state.pairs[chainId][pairKey(tokenAAddress, tokenBAddress)]
        delete state.pairs[chainId][pairKey(tokenBAddress, tokenAAddress)]
      }
      state.timestamp = currentTimestamp()
    })
    .addCase(toggleFavoriteToken, (state, { payload: { chainId, address, newValue } }) => {
      if (!state.favoriteTokensByChainIdv2) {
        state.favoriteTokensByChainIdv2 = {}
      }

      if (!state.favoriteTokensByChainIdv2[chainId]) {
        state.favoriteTokensByChainIdv2[chainId] = {}
      }

      const favoriteTokens = state.favoriteTokensByChainIdv2[chainId]
      const lowercaseAddress = address.toLowerCase()
      if (favoriteTokens) {
        favoriteTokens[lowercaseAddress] = newValue !== undefined ? newValue : !favoriteTokens[lowercaseAddress]
      }
    })
    .addCase(updateChainId, (state, { payload: chainId }) => {
      state.chainId = chainId
    })
    .addCase(updateAcceptedTermVersion, (state, { payload: acceptedTermVersion }) => {
      state.acceptedTermVersion = acceptedTermVersion
    })
    .addCase(changeViewMode, (state, { payload: viewType }) => {
      state.viewMode = viewType
    })
    .addCase(toggleHolidayMode, state => {
      const oldMode = state.holidayMode
      state.holidayMode = !oldMode
    })
    .addCase(permitUpdate, (state, { payload: { chainId, address, rawSignature, deadline, value, account } }) => {
      if (!state.permitData) state.permitData = {}
      if (!state.permitData[account]) state.permitData[account] = {}
      if (!state.permitData[account][chainId]) state.permitData[account][chainId] = {}

      state.permitData[account][chainId][address] = {
        rawSignature,
        deadline,
        value,
        errorCount: state.permitData[account][chainId][address]?.errorCount || 0,
      }
    })
    .addCase(revokePermit, (state, { payload: { chainId, address, account } }) => {
      if (
        !state.permitData[account] ||
        !state.permitData[account][chainId] ||
        !state.permitData[account][chainId][address]
      )
        return

      state.permitData[account][chainId][address] = null
    })
    .addCase(permitError, (state, { payload: { chainId, address, account } }) => {
      if (!state.permitData?.[account]?.[chainId]?.[address]) return
      const { errorCount } = state.permitData[account][chainId][address] || {}
      state.permitData[account][chainId][address] = {
        rawSignature: undefined,
        deadline: undefined,
        value: undefined,
        errorCount: (errorCount || 0) + 1,
      }
    })
    .addCase(pinSlippageControl, (state, { payload }) => {
      state.isSlippageControlPinned = payload
    })
    .addCase(setCrossChainSetting, (state, { payload }) => {
      const setting = state.crossChain || CROSS_CHAIN_SETTING_DEFAULT
      state.crossChain = { ...setting, ...payload }
    })
    .addCase(toggleMyEarningChart, state => {
      state.myEarningChart = !state.myEarningChart
    })
    .addCase(toggleUseAggregatorForZap, state => {
      if (state.useAggregatorForZap === undefined) {
        state.useAggregatorForZap = false
      } else {
        state.useAggregatorForZap = !state.useAggregatorForZap
      }
    })
    .addCase(setPaymentToken, (state, { payload }) => {
      state.paymentToken = payload
    })
    .addCase(updateRecentConnectionMeta, (state, { payload: meta }: { payload: RecentConnectionMeta }) => {
      setRecentConnectionMeta(meta)
      state.recentConnectionMeta = meta
    })
    .addCase(setRecentConnectionDisconnected, state => {
      if (!state.recentConnectionMeta) return

      const disconnectedMeta = { ...state.recentConnectionMeta, disconnected: true }
      setRecentConnectionMeta(disconnectedMeta)
      state.recentConnectionMeta = disconnectedMeta
    })
    .addCase(clearRecentConnectionMeta, state => {
      setRecentConnectionMeta(undefined)
      state.recentConnectionMeta = undefined
    })
    .addCase(toggleTradeRoutes, state => {
      state.showTradeRoutes = !state.showTradeRoutes
    }),
)
