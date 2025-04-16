import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import debounce from 'lodash.debounce'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import routeApi from 'services/route'
import { GetRouteParams } from 'services/route/types/getRoute'

import useGetFeeConfig from 'components/SwapForm/hooks/useGetFeeConfig'
import useGetSwapFeeConfig, { SwapFeeConfig } from 'components/SwapForm/hooks/useGetSwapFeeConfig'
import useSelectedDexes from 'components/SwapForm/hooks/useSelectedDexes'
import { AGGREGATOR_API } from 'constants/env'
import {
  SAFE_APP_CLIENT_ID,
  SAFE_APP_FEE_RECEIVER_ADDRESS,
  AGGREGATOR_API_PATHS,
  ETHER_ADDRESS,
  INPUT_DEBOUNCE_TIME,
  SWAP_FEE_RECEIVER_ADDRESS,
} from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useKyberswapGlobalConfig } from 'hooks/useKyberSwapConfig'
import { useSessionInfo } from 'state/authen/hooks'
import { useAppDispatch } from 'state/hooks'
import { ChargeFeeBy } from 'types/route'
import { isInSafeApp } from 'utils'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

export type ArgsGetRoute = {
  parsedAmount: CurrencyAmount<Currency> | undefined
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined

  customChain?: ChainId
  isProcessingSwap?: boolean
  clientId?: string
}

export const getRouteTokenAddressParam = (currency: Currency) =>
  currency.isNative ? ETHER_ADDRESS : currency.wrapped.address

const getFeeConfigParams = (
  swapFeeConfig: SwapFeeConfig | undefined,
  tokenIn: string,
  tokenOut: string,
): Pick<GetRouteParams, 'feeAmount' | 'feeReceiver' | 'isInBps' | 'chargeFeeBy'> => {
  if (!swapFeeConfig) {
    return {
      feeAmount: '',
      chargeFeeBy: ChargeFeeBy.NONE,
      isInBps: '',
      feeReceiver: '',
    }
  }

  const chargeFeeBy =
    swapFeeConfig.token === tokenIn
      ? ChargeFeeBy.CURRENCY_IN
      : swapFeeConfig.token === tokenOut
      ? ChargeFeeBy.CURRENCY_OUT
      : ChargeFeeBy.NONE

  if (!chargeFeeBy || !swapFeeConfig.feeBips) {
    return {
      feeAmount: '',
      chargeFeeBy: ChargeFeeBy.NONE,
      isInBps: '',
      feeReceiver: '',
    }
  }

  return {
    feeAmount: String(swapFeeConfig.feeBips),
    chargeFeeBy,
    isInBps: '1',
    feeReceiver: SWAP_FEE_RECEIVER_ADDRESS,
  }
}

// default use aggregator, utils the first time sign-in successfully (guest/sign in eth) => use meta
export const useRouteApiDomain = () => {
  const { aggregatorDomain } = useKyberswapGlobalConfig()
  const { authenticationSuccess } = useSessionInfo()
  return authenticationSuccess ? aggregatorDomain : AGGREGATOR_API
}

const useGetRoute = (args: ArgsGetRoute) => {
  const { isEnableAuthenAggregator } = useKyberswapGlobalConfig()
  const { parsedAmount, currencyIn, currencyOut, customChain, isProcessingSwap, clientId } = args
  const { chainId: currentChain } = useActiveWeb3React()
  const chainId = customChain || currentChain

  const feeConfigFromUrl = useGetFeeConfig()

  const [trigger, _result] = routeApi.useLazyGetRouteQuery()
  const aggregatorDomain = useRouteApiDomain()

  const getSwapFeeConfig = useGetSwapFeeConfig()

  const dexes = useSelectedDexes()

  // If user has just dismissed swap modal, we want to set current route summary = undefined by setting this flag = true.
  // After receive new route summary, we reset this flag to false.s
  const dismissSwapModalFlag = useRef(false)
  const result: typeof _result = useMemo(() => {
    if (dismissSwapModalFlag.current) {
      return {
        ..._result,
        data: undefined,
      } as typeof _result
    }
    return _result
  }, [_result])

  const dispatch = useAppDispatch()
  useEffect(() => {
    if (!parsedAmount) {
      dispatch(routeApi.util.resetApiState())
    }
  }, [dispatch, parsedAmount])

  useEffect(() => {
    if (!isProcessingSwap) {
      dismissSwapModalFlag.current = true
    }
  }, [isProcessingSwap])

  const triggerDebounced = useMemo(
    () =>
      debounce(
        async (args: { url: string; params: GetRouteParams; authentication: boolean }) => {
          await trigger({ ...args, clientId })
          dismissSwapModalFlag.current = false
        },
        INPUT_DEBOUNCE_TIME,
        {
          leading: true,
        },
      ),
    [trigger, clientId],
  )

  const safeAppFeeConfig = useMemo(() => {
    let chargeFeeBy = ChargeFeeBy.CURRENCY_IN
    const isCurrencyInStatble = currencyIn instanceof WrappedTokenInfo && currencyIn.isStable
    const isCurrencyOutStatble = currencyOut instanceof WrappedTokenInfo && currencyOut.isStable

    // case 0: stable is highest priority
    if (isCurrencyOutStatble) {
      if (isCurrencyInStatble) {
        if (currencyIn.cmcRank && currencyOut.cmcRank) {
          if (currencyIn.cmcRank < currencyOut.cmcRank) chargeFeeBy = ChargeFeeBy.CURRENCY_IN
          else chargeFeeBy = ChargeFeeBy.CURRENCY_OUT
        }
      } else chargeFeeBy = ChargeFeeBy.CURRENCY_OUT
    }
    // Case 1: Output currency is native
    else if (currencyOut?.isNative) {
      chargeFeeBy = ChargeFeeBy.CURRENCY_OUT
    }
    // Case 2: Both are wrapped tokens
    else if (currencyIn instanceof WrappedTokenInfo && currencyOut instanceof WrappedTokenInfo) {
      // Case 2.1: Whitelist check
      if (!currencyIn.isWhitelisted && currencyOut.isWhitelisted) chargeFeeBy = ChargeFeeBy.CURRENCY_OUT
      // Case 2.2: CMC rank comparison (highest priority)
      else if (currencyIn.cmcRank && currencyOut.cmcRank) {
        if (currencyOut.cmcRank < currencyIn.cmcRank) chargeFeeBy = ChargeFeeBy.CURRENCY_OUT
      }
      // Case 2.3: CGK rank comparison (only if CMC rank isn't available for both)
      else if (currencyIn.cgkRank && currencyOut.cgkRank) {
        if (currencyOut.cgkRank < currencyIn.cgkRank) chargeFeeBy = ChargeFeeBy.CURRENCY_OUT
      }
      // Case 2.4: Output has rank but input doesn't
      else if (currencyOut.cmcRank || currencyOut.cgkRank) chargeFeeBy = ChargeFeeBy.CURRENCY_OUT
    }
    return {
      feeAmount: '10',
      chargeFeeBy,
      isInBps: '1',
      feeReceiver: SAFE_APP_FEE_RECEIVER_ADDRESS,
      enableTip: false,
      clientId: SAFE_APP_CLIENT_ID,
    }
  }, [currencyIn, currencyOut])

  const fetcher = useCallback(async () => {
    const amountIn = parsedAmount?.quotient?.toString() || ''

    if (!currencyIn || !currencyOut || !amountIn || !parsedAmount?.currency?.equals(currencyIn)) {
      return undefined
    }

    const tokenInAddress = getRouteTokenAddressParam(currencyIn)
    const tokenOutAddress = getRouteTokenAddressParam(currencyOut)

    const swapFeeConfig = await getSwapFeeConfig(chainId, tokenInAddress, tokenOutAddress)
    const feeConfigParams = isInSafeApp
      ? safeAppFeeConfig
      : feeConfigFromUrl || getFeeConfigParams(swapFeeConfig, tokenInAddress, tokenOutAddress)

    const params: GetRouteParams = {
      tokenIn: tokenInAddress,
      tokenOut: tokenOutAddress,
      tokenInDecimals: currencyIn.decimals,
      tokenOutDecimals: currencyOut.decimals,
      amountIn,
      includedSources: dexes,
      gasInclude: 'true', // default
      gasPrice: '', // default
      chainId,
      ...feeConfigParams,
    }

    ;(Object.keys(params) as (keyof typeof params)[]).forEach(key => {
      if (!params[key]) {
        delete params[key]
      }
    })
    const url = `${aggregatorDomain}/${NETWORKS_INFO[chainId].aggregatorRoute}${AGGREGATOR_API_PATHS.GET_ROUTE}`

    triggerDebounced({
      url,
      params,
      authentication: isEnableAuthenAggregator,
    })

    return undefined
  }, [
    safeAppFeeConfig,
    aggregatorDomain,
    chainId,
    currencyIn,
    currencyOut,
    dexes,
    getSwapFeeConfig,
    isEnableAuthenAggregator,
    parsedAmount?.currency,
    parsedAmount?.quotient,
    triggerDebounced,
    feeConfigFromUrl,
  ])

  return { fetcher, result }
}

export default useGetRoute
