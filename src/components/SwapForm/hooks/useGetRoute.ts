import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import debounce from 'lodash/debounce'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import routeApi from 'services/route'
import { GetRouteParams } from 'services/route/types/getRoute'

import useGetFeeConfig from 'components/SwapForm/hooks/useGetFeeConfig'
import useGetSwapFeeConfig, { SwapFeeConfig } from 'components/SwapForm/hooks/useGetSwapFeeConfig'
import useSelectedDexes from 'components/SwapForm/hooks/useSelectedDexes'
import { AGGREGATOR_API } from 'constants/env'
import { AGGREGATOR_API_PATHS, ETHER_ADDRESS, INPUT_DEBOUNCE_TIME, SWAP_FEE_RECEIVER_ADDRESS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useKyberswapGlobalConfig } from 'hooks/useKyberSwapConfig'
import { useSessionInfo } from 'state/authen/hooks'
import { useAppDispatch } from 'state/hooks'
import { ChargeFeeBy } from 'types/route'

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

  const fetcher = useCallback(async () => {
    const amountIn = parsedAmount?.quotient?.toString() || ''

    if (!currencyIn || !currencyOut || !amountIn || !parsedAmount?.currency?.equals(currencyIn)) {
      return undefined
    }

    const tokenInAddress = getRouteTokenAddressParam(currencyIn)
    const tokenOutAddress = getRouteTokenAddressParam(currencyOut)

    const swapFeeConfig = await getSwapFeeConfig(chainId, tokenInAddress, tokenOutAddress)
    const feeConfigParams = feeConfigFromUrl || getFeeConfigParams(swapFeeConfig, tokenInAddress, tokenOutAddress)

    const params: GetRouteParams = {
      tokenIn: tokenInAddress,
      tokenOut: tokenOutAddress,
      amountIn,
      includedSources: dexes,
      gasInclude: 'true', // default
      gasPrice: '', // default
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
