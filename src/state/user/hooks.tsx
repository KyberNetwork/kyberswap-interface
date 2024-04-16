import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { INITIAL_ALLOWED_SLIPPAGE, TERM_FILES_PATH } from 'constants/index'
import { LOCALE_INFO, SupportedLocale } from 'constants/locales'
import { GAS_TOKENS } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
import {
  useDynamicFeeFactoryContract,
  useOldStaticFeeFactoryContract,
  useStaticFeeFactoryContract,
} from 'hooks/useContract'
import usePageLocation from 'hooks/usePageLocation'
import { AppDispatch, AppState } from 'state'
import { useKyberSwapConfig } from 'state/application/hooks'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { useSingleContractMultipleData } from 'state/multicall/hooks'
import { useUserLiquidityPositions } from 'state/pools/hooks'
import { useCheckStablePairSwap } from 'state/swap/hooks'
import {
  SerializedToken,
  ToggleFavoriteTokenPayload,
  addSerializedPair,
  addSerializedToken,
  changeViewMode,
  pinSlippageControl,
  removeSerializedToken,
  setCrossChainSetting,
  setPaymentToken,
  toggleFavoriteToken as toggleFavoriteTokenAction,
  toggleHolidayMode,
  toggleMyEarningChart,
  toggleTopTrendingTokens,
  toggleTradeRoutes,
  toggleUseAggregatorForZap,
  updateAcceptedTermVersion,
  updatePoolDegenMode,
  updatePoolSlippageTolerance,
  updateTokenAnalysisSettings,
  updateUserDeadline,
  updateUserDegenMode,
  updateUserLocale,
  updateUserSlippageTolerance,
} from 'state/user/actions'
import { CROSS_CHAIN_SETTING_DEFAULT, CrossChainSetting, VIEW_MODE } from 'state/user/reducer'
import { isAddress } from 'utils'

const MAX_FAVORITE_LIMIT = 12

function serializeToken(token: Token | WrappedTokenInfo): SerializedToken {
  return {
    chainId: token.chainId,
    address: token.address,
    decimals: token.decimals,
    symbol: token.symbol,
    name: token.name,
    logoURI: token instanceof WrappedTokenInfo ? token.logoURI : undefined,
  }
}

function deserializeToken(serializedToken: SerializedToken): Token {
  return serializedToken?.logoURI
    ? new WrappedTokenInfo({
        chainId: serializedToken.chainId,
        address: serializedToken.address,
        name: serializedToken.name ?? '',
        symbol: serializedToken.symbol ?? '',
        decimals: serializedToken.decimals,
        logoURI: serializedToken.logoURI,
      })
    : new Token(
        serializedToken.chainId,
        serializedToken.address,
        serializedToken.decimals,
        serializedToken.symbol,
        serializedToken.name,
      )
}

export function useUserLocale(): SupportedLocale | null {
  const userLocale = useAppSelector(state => state.user.userLocale)
  if (Object.keys(LOCALE_INFO).includes(userLocale)) return userLocale
  return 'en-US'
}

export function useUserLocaleManager(): [SupportedLocale | null, (newLocale: SupportedLocale) => void] {
  const dispatch = useAppDispatch()
  const locale = useUserLocale()

  const setLocale = useCallback(
    (newLocale: SupportedLocale) => {
      dispatch(updateUserLocale({ userLocale: newLocale }))
    },
    [dispatch],
  )

  return [locale, setLocale]
}

export function useIsAcceptedTerm(): [boolean, (isAcceptedTerm: boolean) => void] {
  const dispatch = useAppDispatch()
  const acceptedTermVersion = useSelector<AppState, AppState['user']['acceptedTermVersion']>(
    state => state.user.acceptedTermVersion,
  )

  const isAcceptedTerm = !!acceptedTermVersion && acceptedTermVersion === TERM_FILES_PATH.VERSION

  const setIsAcceptedTerm = useCallback(
    (isAcceptedTerm: boolean) => {
      dispatch(updateAcceptedTermVersion(isAcceptedTerm ? TERM_FILES_PATH.VERSION : null))
    },
    [dispatch],
  )

  return [isAcceptedTerm, setIsAcceptedTerm]
}

export function useDegenModeManager(): [boolean, () => void] {
  const [swapDegenMode, toggleSwapDegenMode] = useSwapDegenMode()
  const [poolDegenMode, togglePoolDegenMode] = usePoolDegenMode()

  const { isSwapPage } = usePageLocation()
  if (isSwapPage) {
    return [swapDegenMode, toggleSwapDegenMode]
  }
  return [poolDegenMode, togglePoolDegenMode]
}

export function useSwapDegenMode(): [boolean, () => void] {
  const dispatch = useDispatch<AppDispatch>()
  const isStablePairSwap = useCheckStablePairSwap()

  const userDegenMode = useSelector<AppState, AppState['user']['userDegenMode']>(state => state.user.userDegenMode)
  const toggleUserDegenMode = useCallback(() => {
    dispatch(updateUserDegenMode({ userDegenMode: !userDegenMode, isStablePairSwap }))
  }, [userDegenMode, dispatch, isStablePairSwap])

  return [userDegenMode, toggleUserDegenMode]
}

export function usePoolDegenMode(): [boolean, () => void] {
  const dispatch = useDispatch<AppDispatch>()
  const isStablePairSwap = useCheckStablePairSwap()

  const poolDegenMode = useSelector<AppState, AppState['user']['poolDegenMode']>(state => state.user.poolDegenMode)
  const togglePoolDegenMode = useCallback(() => {
    dispatch(updatePoolDegenMode({ poolDegenMode: !poolDegenMode, isStablePairSwap }))
  }, [poolDegenMode, dispatch, isStablePairSwap])

  return [poolDegenMode, togglePoolDegenMode]
}

export function useAggregatorForZapSetting(): [boolean, () => void] {
  const dispatch = useDispatch<AppDispatch>()
  const isUseAggregatorForZap = useSelector<AppState, AppState['user']['useAggregatorForZap']>(
    state => state.user.useAggregatorForZap,
  )

  const toggle = useCallback(() => {
    dispatch(toggleUseAggregatorForZap())
  }, [dispatch])

  return [isUseAggregatorForZap === undefined ? true : isUseAggregatorForZap, toggle]
}

export function useUserSlippageTolerance(): [number, (slippage: number) => void] {
  const [swapSlippageTolerance, setSwapSlippageTolerance] = useSwapSlippageTolerance()
  const [poolSlippageTolerance, setPoolSlippageTolerance] = usePoolSlippageTolerance()

  const { isSwapPage } = usePageLocation()
  if (isSwapPage) {
    return [swapSlippageTolerance, setSwapSlippageTolerance]
  }
  return [poolSlippageTolerance, setPoolSlippageTolerance]
}

export function useSwapSlippageTolerance(): [number, (slippage: number) => void] {
  const dispatch = useDispatch<AppDispatch>()
  const userSlippageTolerance = useSelector<AppState, AppState['user']['userSlippageTolerance']>(state => {
    return state.user.userSlippageTolerance
  })
  const setUserSlippageTolerance = useCallback(
    (userSlippageTolerance: number) => {
      dispatch(updateUserSlippageTolerance({ userSlippageTolerance }))
    },
    [dispatch],
  )
  return [userSlippageTolerance, setUserSlippageTolerance]
}

export function usePoolSlippageTolerance(): [number, (slippage: number) => void] {
  const dispatch = useDispatch<AppDispatch>()
  const poolSlippageTolerance = useSelector<AppState, AppState['user']['poolSlippageTolerance']>(state => {
    return state.user.poolSlippageTolerance || INITIAL_ALLOWED_SLIPPAGE
  })
  const setPoolSlippageTolerance = useCallback(
    (poolSlippageTolerance: number) => {
      dispatch(updatePoolSlippageTolerance({ poolSlippageTolerance }))
    },
    [dispatch],
  )
  return [poolSlippageTolerance, setPoolSlippageTolerance]
}

export function useUserTransactionTTL(): [number, (slippage: number) => void] {
  const dispatch = useDispatch<AppDispatch>()
  const userDeadline = useSelector<AppState, AppState['user']['userDeadline']>(state => {
    return state.user.userDeadline
  })

  const setUserDeadline = useCallback(
    (userDeadline: number) => {
      dispatch(updateUserDeadline({ userDeadline }))
    },
    [dispatch],
  )

  return [userDeadline, setUserDeadline]
}

export function useAddUserToken(): (token: Token) => void {
  const dispatch = useDispatch<AppDispatch>()
  return useCallback(
    (token: Token) => {
      dispatch(addSerializedToken({ serializedToken: serializeToken(token) }))
    },
    [dispatch],
  )
}

export function useRemoveUserAddedToken(): (chainId: number, address: string) => void {
  const dispatch = useDispatch<AppDispatch>()
  return useCallback(
    (chainId: number, address: string) => {
      dispatch(removeSerializedToken({ chainId, address }))
    },
    [dispatch],
  )
}

export function useUserAddedTokens(customChain?: ChainId): Token[] {
  const { chainId: currentChain } = useActiveWeb3React()
  const serializedTokensMap = useSelector<AppState, AppState['user']['tokens']>(({ user: { tokens } }) => tokens)
  const chainId = customChain || currentChain
  return useMemo(() => {
    if (!chainId) return []
    return Object.values(serializedTokensMap[chainId] ?? {})
      .map(deserializeToken)
      .filter(e => !(!e.symbol && !e.decimals && !e.name))
  }, [serializedTokensMap, chainId])
}

export function usePairAdderByTokens(): (token0: Token, token1: Token) => void {
  const dispatch = useDispatch<AppDispatch>()

  return useCallback(
    (token0: Token, token1: Token) => {
      dispatch(
        addSerializedPair({
          serializedPair: {
            token0: serializeToken(token0),
            token1: serializeToken(token1),
          },
        }),
      )
    },
    [dispatch],
  )
}

export function useToV2LiquidityTokens(
  tokenCouples: [Token, Token][],
): { liquidityTokens: []; tokens: [Token, Token] }[] {
  const oldStaticContract = useOldStaticFeeFactoryContract()
  const staticContract = useStaticFeeFactoryContract()
  const dynamicContract = useDynamicFeeFactoryContract()

  const addresses = useMemo(
    () => tokenCouples.map(([tokenA, tokenB]) => [tokenA.address, tokenB.address]),
    [tokenCouples],
  )

  const result1 = useSingleContractMultipleData(staticContract, 'getPools', addresses)
  const result2 = useSingleContractMultipleData(dynamicContract, 'getPools', addresses)
  const result3 = useSingleContractMultipleData(oldStaticContract, 'getPools', addresses)
  const result = useMemo(
    () =>
      result1?.map((call, index) => {
        return {
          ...call,
          result: [
            call.result?.[0].concat(result2?.[index]?.result?.[0] || []).concat(result3?.[index]?.result?.[0] || []),
          ],
        }
      }),
    [result1, result2, result3],
  )
  return useMemo(
    () =>
      result.map((result, index) => {
        return {
          tokens: tokenCouples[index],
          liquidityTokens:
            result?.result?.[0]?.map(
              (address: string) => new Token(tokenCouples[index][0].chainId, address, 18, 'DMM-LP', 'DMM LP'),
            ) ?? [],
        }
      }),
    [tokenCouples, result],
  )
}

export function useLiquidityPositionTokenPairs(): [Token, Token][] {
  const { chainId } = useActiveWeb3React()
  const allTokens = useAllTokens()

  const { data: userLiquidityPositions } = useUserLiquidityPositions()

  // get pairs that has liquidity
  const generatedPairs: [Token, Token][] = useMemo(() => {
    if (userLiquidityPositions?.liquidityPositions) {
      const result: [Token, Token][] = []

      userLiquidityPositions?.liquidityPositions.forEach(position => {
        const token0Address = isAddress(chainId, position.pool.token0.id)
        const token1Address = isAddress(chainId, position.pool.token1.id)

        if (token0Address && token1Address && allTokens[token0Address] && allTokens[token1Address]) {
          result.push([allTokens[token0Address], allTokens[token1Address]])
        }
      })

      return result
    }

    return []
  }, [chainId, allTokens, userLiquidityPositions])

  // pairs saved by users
  const savedSerializedPairs = useSelector<AppState, AppState['user']['pairs']>(({ user: { pairs } }) => pairs)

  const userPairs: [Token, Token][] = useMemo(() => {
    if (!savedSerializedPairs) return []
    const forChain = savedSerializedPairs[chainId]
    if (!forChain) return []

    return Object.keys(forChain).map(pairId => {
      return [deserializeToken(forChain[pairId].token0), deserializeToken(forChain[pairId].token1)]
    })
  }, [savedSerializedPairs, chainId])

  const combinedList = useMemo(() => userPairs.concat(generatedPairs), [generatedPairs, userPairs])

  return useMemo(() => {
    // dedupes pairs of tokens in the combined list
    const keyed = combinedList.reduce<{ [key: string]: [Token, Token] }>((memo, [tokenA, tokenB]) => {
      const sorted = tokenA.sortsBefore(tokenB)
      const key = sorted ? `${tokenA.address}:${tokenB.address}` : `${tokenB.address}:${tokenA.address}`
      if (memo[key]) return memo
      memo[key] = sorted ? [tokenA, tokenB] : [tokenB, tokenA]
      return memo
    }, {})

    return Object.keys(keyed).map(key => keyed[key])
  }, [combinedList])
}

export function useUpdateTokenAnalysisSettings(): (payload: string) => void {
  const dispatch = useDispatch<AppDispatch>()
  return useCallback((payload: string) => dispatch(updateTokenAnalysisSettings(payload)), [dispatch])
}

export function useToggleTopTrendingTokens(): () => void {
  const dispatch = useDispatch<AppDispatch>()
  return useCallback(() => dispatch(toggleTopTrendingTokens()), [dispatch])
}

export const useUserFavoriteTokens = (customChain?: ChainId) => {
  const { chainId: currentChain } = useActiveWeb3React()
  const chainId = customChain || currentChain
  const dispatch = useDispatch<AppDispatch>()
  const { favoriteTokensByChainIdv2: favoriteTokensByChainId } = useSelector((state: AppState) => state.user)
  const { commonTokens } = useKyberSwapConfig(chainId)

  const favoriteTokens = useMemo(() => {
    if (!chainId) return undefined
    const favoritedTokens = favoriteTokensByChainId?.[chainId] || {}
    const favoritedTokenAddresses = (commonTokens || [])
      .filter(address => favoritedTokens[address.toLowerCase()] !== false)
      .concat(Object.keys(favoritedTokens).filter(address => favoritedTokens[address]))

    return [...new Set(favoritedTokenAddresses.map(a => a.toLowerCase()))]
  }, [chainId, favoriteTokensByChainId, commonTokens])

  const toggleFavoriteToken = useCallback(
    (payload: ToggleFavoriteTokenPayload) => {
      if (!favoriteTokens) return
      const address = payload.address.toLowerCase()
      // Is adding favorite and reached max limit
      if (favoriteTokens.indexOf(address) < 0 && favoriteTokens.length >= MAX_FAVORITE_LIMIT) {
        return
      }
      const newValue = favoriteTokens.indexOf(address) < 0

      dispatch(toggleFavoriteTokenAction({ ...payload, newValue }))
    },
    [dispatch, favoriteTokens],
  )

  return { favoriteTokens, toggleFavoriteToken }
}

export const useViewMode: () => [VIEW_MODE, (mode: VIEW_MODE) => void] = () => {
  const dispatch = useAppDispatch()
  const viewMode = useAppSelector(state => state.user.viewMode || VIEW_MODE.GRID)

  const setViewMode = useCallback((mode: VIEW_MODE) => dispatch(changeViewMode(mode)), [dispatch])

  return [viewMode, setViewMode]
}

export const usePaymentToken: () => [Token | null, (paymentToken: Token | null) => void] = () => {
  const dispatch = useAppDispatch()
  const { chainId } = useActiveWeb3React()
  const paymentToken = useAppSelector(state => state.user.paymentToken)
  const p = useMemo(() => {
    if (chainId !== ChainId.ZKSYNC) return null
    if (!GAS_TOKENS.map(item => item.address.toLowerCase()).includes(paymentToken?.address.toLowerCase())) return null
    return paymentToken
  }, [paymentToken, chainId])

  const updatePaymentToken = useCallback((pt: Token | null) => dispatch(setPaymentToken(pt)), [dispatch])

  return [p, updatePaymentToken]
}

export const useHolidayMode: () => [boolean, () => void] = () => {
  const dispatch = useAppDispatch()
  // const holidayMode = useAppSelector(state => (state.user.holidayMode === undefined ? true : state.user.holidayMode))

  const toggle = useCallback(() => {
    dispatch(toggleHolidayMode())
  }, [dispatch])

  // return [isChristmasTime() ? holidayMode : false, toggle]
  return [false, toggle]
}

export const useCrossChainSetting = () => {
  const dispatch = useAppDispatch()
  const setting = useAppSelector(state => state.user.crossChain) || CROSS_CHAIN_SETTING_DEFAULT
  const setSetting = useCallback(
    (data: CrossChainSetting) => {
      dispatch(setCrossChainSetting(data))
    },
    [dispatch],
  )
  const setExpressExecutionMode = useCallback(
    (enableExpressExecution: boolean) => {
      setSetting({ ...setting, enableExpressExecution })
    },
    [setSetting, setting],
  )

  const setRawSlippage = useCallback(
    (slippageTolerance: number) => {
      setSetting({ ...setting, slippageTolerance })
    },
    [setSetting, setting],
  )

  const toggleSlippageControlPinned = useCallback(() => {
    setSetting({ ...setting, isSlippageControlPinned: !setting.isSlippageControlPinned })
  }, [setSetting, setting])

  return { setting, setExpressExecutionMode, setRawSlippage, toggleSlippageControlPinned }
}

export const useSlippageSettingByPage = () => {
  const dispatch = useDispatch()
  const { isCrossChain } = usePageLocation()
  const [rawSlippageTolerance, setRawSlippageTolerance] = useUserSlippageTolerance()

  const isPinSlippageSwap = useAppSelector(state => state.user.isSlippageControlPinned)
  const togglePinSlippageSwap = () => {
    dispatch(pinSlippageControl(!isSlippageControlPinned))
  }

  const {
    setting: { slippageTolerance: rawSlippageSwapCrossChain, isSlippageControlPinned: isPinSlippageCrossChain },
    setRawSlippage: setRawSlippageCrossChain,
    toggleSlippageControlPinned: togglePinnedSlippageCrossChain,
  } = useCrossChainSetting()

  const rawSlippage = isCrossChain ? rawSlippageSwapCrossChain : rawSlippageTolerance
  const setRawSlippage = isCrossChain ? setRawSlippageCrossChain : setRawSlippageTolerance
  const isSlippageControlPinned = isCrossChain ? isPinSlippageCrossChain : isPinSlippageSwap
  const togglePinSlippage = isCrossChain ? togglePinnedSlippageCrossChain : togglePinSlippageSwap

  return {
    rawSlippage,
    setRawSlippage,
    isSlippageControlPinned,
    togglePinSlippage,
  }
}

export const usePermitData: (
  address?: string,
) => { rawSignature?: string; deadline?: number; value?: string; errorCount?: number } | null = address => {
  const { chainId, account } = useActiveWeb3React()
  const permitData = useAppSelector(state => state.user.permitData)

  return address && account && permitData ? permitData[account]?.[chainId]?.[address] : null
}

export const useShowMyEarningChart: () => [boolean, () => void] = () => {
  const dispatch = useAppDispatch()

  const isShowMyEarningChart = useAppSelector(state =>
    state.user.myEarningChart === undefined ? true : state.user.myEarningChart,
  )
  const toggle = useCallback(() => {
    dispatch(toggleMyEarningChart())
  }, [dispatch])
  return [isShowMyEarningChart, toggle]
}

export function useShowTradeRoutes(): boolean {
  const showTradeRoutes = useSelector((state: AppState) => state.user.showTradeRoutes)
  return showTradeRoutes
}

export function useToggleTradeRoutes(): () => void {
  const dispatch = useDispatch<AppDispatch>()
  return useCallback(() => dispatch(toggleTradeRoutes()), [dispatch])
}
