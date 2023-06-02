import { ChainId } from '@kyberswap/ks-sdk-core'
import { createReducer } from '@reduxjs/toolkit'

import { SUGGESTED_BASES } from 'constants/bases'
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
  permitError,
  permitUpdate,
  pinSlippageControl,
  removeSerializedPair,
  removeSerializedToken,
  revokePermit,
  toggleFavoriteToken,
  toggleHolidayMode,
  toggleKyberAIBanner,
  toggleKyberAIWidget,
  toggleLiveChart,
  toggleTokenInfo,
  toggleTradeRoutes,
  updateAcceptedTermVersion,
  updateChainId,
  updateIsUserManuallyDisconnect,
  updateMatchesDarkMode,
  updateTokenAnalysisSettings,
  updateUserDarkMode,
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

interface UserState {
  // the timestamp of the last updateVersion action
  lastUpdateVersionTimestamp?: number

  userDarkMode: boolean | null // the user's choice for dark mode or light mode
  matchesDarkMode: boolean // whether the dark mode media query matches

  userLocale: SupportedLocale | null

  userDegenMode: boolean
  userDegenModeAutoDisableTimestamp: number

  // user defined slippage tolerance in bips, used in all txns
  userSlippageTolerance: number

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
  showLiveCharts: {
    [chainId: number]: boolean
  }
  showTradeRoutes: boolean
  showTokenInfo: boolean
  showKyberAIBanner: boolean
  kyberAIDisplaySettings: {
    [k: string]: boolean
  }
  favoriteTokensByChainId: Partial<
    Record<
      ChainId,
      {
        includeNativeToken: boolean
        addresses: string[]
      }
    >
  >
  readonly chainId: ChainId
  isUserManuallyDisconnect: boolean
  acceptedTermVersion: number | null
  viewMode: VIEW_MODE
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
  kyberAIWidget: boolean
}

function pairKey(token0Address: string, token1Address: string) {
  return `${token0Address};${token1Address}`
}

export const getFavoriteTokenDefault = (chainId: ChainId) => ({
  addresses: SUGGESTED_BASES[chainId].map(e => e.address),
  includeNativeToken: true,
})

export const defaultShowLiveCharts: { [chainId in ChainId]: boolean } = {
  [ChainId.MAINNET]: true,
  [ChainId.MATIC]: true,
  [ChainId.BSCMAINNET]: true,
  [ChainId.CRONOS]: true,
  [ChainId.AVAXMAINNET]: true,
  [ChainId.FANTOM]: true,
  [ChainId.ARBITRUM]: true,
  [ChainId.AURORA]: true,
  [ChainId.BTTC]: false,
  [ChainId.VELAS]: true,
  [ChainId.OASIS]: true,
  [ChainId.OPTIMISM]: true,
  [ChainId.SOLANA]: true,
  [ChainId.ZKSYNC]: true,

  [ChainId.GÖRLI]: false,
  [ChainId.MUMBAI]: false,
  [ChainId.BSCTESTNET]: false,
  [ChainId.AVAXTESTNET]: false,
}

const initialState: UserState = {
  userDarkMode: null, // default to system preference
  matchesDarkMode: true,
  userDegenMode: false,
  userDegenModeAutoDisableTimestamp: 0,
  userLocale: null,
  userSlippageTolerance: INITIAL_ALLOWED_SLIPPAGE,
  userDeadline: DEFAULT_DEADLINE_FROM_NOW,
  tokens: {},
  pairs: {},
  timestamp: currentTimestamp(),
  showLiveCharts: { ...defaultShowLiveCharts },
  showTradeRoutes: true,
  showTokenInfo: true,
  showKyberAIBanner: true,
  kyberAIDisplaySettings: {
    numberOfTrades: true,
    numberOfHolders: true,
    tradingVolume: true,
    netflowToWhaleWallets: true,
    netflowToCEX: true,
    volumeOfTransfers: true,
    top10Holders: true,
    top25Holders: true,
    liveCharts: true,
    supportResistanceLevels: true,
    liveDEXTrades: true,
    fundingRateOnCEX: true,
    liquidationsOnCEX: true,
  },
  favoriteTokensByChainId: {},
  chainId: ChainId.MAINNET,
  isUserManuallyDisconnect: false,
  acceptedTermVersion: null,
  viewMode: VIEW_MODE.GRID,
  holidayMode: true,
  permitData: {},
  isSlippageControlPinned: true,
  kyberAIWidget: true,
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
    .addCase(updateUserDarkMode, (state, action) => {
      state.userDarkMode = action.payload.userDarkMode
      state.timestamp = currentTimestamp()
    })
    .addCase(updateMatchesDarkMode, (state, action) => {
      state.matchesDarkMode = action.payload.matchesDarkMode
      state.timestamp = currentTimestamp()
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
    .addCase(updateUserLocale, (state, action) => {
      state.userLocale = action.payload.userLocale
      state.timestamp = currentTimestamp()
    })
    .addCase(updateUserSlippageTolerance, (state, action) => {
      state.userSlippageTolerance = action.payload.userSlippageTolerance
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
    .addCase(toggleLiveChart, (state, { payload: { chainId } }) => {
      if (typeof state.showLiveCharts?.[chainId] !== 'boolean') {
        state.showLiveCharts = { ...defaultShowLiveCharts }
      }
      state.showLiveCharts[chainId] = !state.showLiveCharts[chainId]
    })
    .addCase(toggleTradeRoutes, state => {
      state.showTradeRoutes = !state.showTradeRoutes
    })
    .addCase(toggleTokenInfo, state => {
      state.showTokenInfo = !state.showTokenInfo
    })
    .addCase(toggleKyberAIBanner, state => {
      state.showKyberAIBanner = !state.showKyberAIBanner
    })
    .addCase(toggleFavoriteToken, (state, { payload: { chainId, isNative, address } }) => {
      if (!state.favoriteTokensByChainId) {
        state.favoriteTokensByChainId = {}
      }

      let favoriteTokens = state.favoriteTokensByChainId[chainId]
      if (!favoriteTokens) {
        favoriteTokens = getFavoriteTokenDefault(chainId)
        state.favoriteTokensByChainId[chainId] = favoriteTokens
      }

      if (isNative) {
        const previousValue = favoriteTokens.includeNativeToken
        favoriteTokens.includeNativeToken = !previousValue
        return
      }

      if (address) {
        // this is intentionally added, to remove compiler error
        const index = favoriteTokens.addresses.findIndex(addr => addr === address)
        if (index === -1) {
          favoriteTokens.addresses.push(address)
          return
        }
        favoriteTokens.addresses.splice(index, 1)
      }
    })
    .addCase(updateChainId, (state, { payload: chainId }) => {
      state.chainId = chainId
    })
    .addCase(updateIsUserManuallyDisconnect, (state, { payload: isUserManuallyDisconnect }) => {
      state.isUserManuallyDisconnect = isUserManuallyDisconnect
    })
    .addCase(updateAcceptedTermVersion, (state, { payload: acceptedTermVersion }) => {
      state.acceptedTermVersion = acceptedTermVersion
    })
    .addCase(updateTokenAnalysisSettings, (state, { payload }) => {
      if (!state.kyberAIDisplaySettings) {
        state.kyberAIDisplaySettings = {}
      }
      state.kyberAIDisplaySettings[payload] = !state.kyberAIDisplaySettings[payload] ?? false
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
    .addCase(toggleKyberAIWidget, state => {
      state.kyberAIWidget = !state.kyberAIWidget
    }),
)
