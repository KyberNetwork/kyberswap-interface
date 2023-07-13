import { ChainId, Currency, CurrencyAmount, Price, WETH } from '@kyberswap/ks-sdk-core'
import { debounce } from 'lodash'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import routeApi from 'services/route'
import { GetRouteParams } from 'services/route/types/getRoute'

import useGetSwapFeeConfig, { SwapFeeConfig } from 'components/SwapForm/hooks/useGetSwapFeeConfig'
import useSelectedDexes from 'components/SwapForm/hooks/useSelectedDexes'
import {
  AGGREGATOR_API_PATHS,
  ETHER_ADDRESS,
  INPUT_DEBOUNCE_TIME,
  SWAP_FEE_RECEIVER_ADDRESS,
  ZERO_ADDRESS_SOLANA,
} from 'constants/index'
import { NETWORKS_INFO, isEVM } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useDebounce from 'hooks/useDebounce'
import { useKyberswapGlobalConfig } from 'hooks/useKyberSwapConfig'
import { useAppDispatch } from 'state/hooks'
import { ChargeFeeBy } from 'types/route'
import { Aggregator } from 'utils/aggregator'

export type ArgsGetRoute = {
  isSaveGas: boolean
  parsedAmount: CurrencyAmount<Currency> | undefined
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined

  customChain?: ChainId
  isProcessingSwap?: boolean
}

export const getRouteTokenAddressParam = (currency: Currency) =>
  currency.isNative
    ? isEVM(currency.chainId)
      ? ETHER_ADDRESS
      : WETH[currency.chainId].address
    : currency.wrapped.address

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

const useGetRoute = (args: ArgsGetRoute) => {
  const { aggregatorDomain, isEnableAuthenAggregator } = useKyberswapGlobalConfig()
  const { isSaveGas, parsedAmount, currencyIn, currencyOut, customChain, isProcessingSwap } = args
  const { chainId: currentChain } = useActiveWeb3React()
  const chainId = customChain || currentChain

  const [trigger, _result] = routeApi.useLazyGetRouteQuery()

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
          await trigger(args)
          dismissSwapModalFlag.current = false
        },
        INPUT_DEBOUNCE_TIME,
        {
          leading: true,
        },
      ),
    [trigger],
  )

  const fetcher = useCallback(async () => {
    const amountIn = parsedAmount?.quotient?.toString() || ''

    if (
      !currencyIn ||
      !currencyOut ||
      !amountIn ||
      !parsedAmount?.currency?.equals(currencyIn) ||
      chainId === ChainId.SOLANA
    ) {
      return undefined
    }

    const tokenInAddress = getRouteTokenAddressParam(currencyIn)
    const tokenOutAddress = getRouteTokenAddressParam(currencyOut)

    const swapFeeConfig = await getSwapFeeConfig(chainId, tokenInAddress, tokenOutAddress)

    const feeConfigParams = getFeeConfigParams(swapFeeConfig, tokenInAddress, tokenOutAddress)

    const params: GetRouteParams = {
      tokenIn: tokenInAddress,
      tokenOut: tokenOutAddress,
      amountIn,
      saveGas: String(isSaveGas),
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
    isSaveGas,
    parsedAmount?.currency,
    parsedAmount?.quotient,
    triggerDebounced,
  ])

  return { fetcher, result }
}

export const useGetRouteSolana = (args: ArgsGetRoute) => {
  const { parsedAmount, currencyIn, currencyOut, customChain } = args
  const { account } = useActiveWeb3React()
  const controller = useRef(new AbortController())

  const { aggregatorAPI } = useKyberswapGlobalConfig()
  const [price, setPrice] = useState<Price<Currency, Currency> | null>(null)

  const debounceAmount = useDebounce(parsedAmount, INPUT_DEBOUNCE_TIME)

  const fetcherWithoutDebounce = useCallback(async () => {
    const amountIn = debounceAmount?.quotient?.toString() || ''

    if (
      !currencyIn ||
      !currencyOut ||
      !amountIn ||
      !debounceAmount?.currency?.equals(currencyIn) ||
      customChain !== ChainId.SOLANA
    ) {
      setPrice(null)
      return
    }
    controller.current.abort()
    controller.current = new AbortController()
    const to = account ?? ZERO_ADDRESS_SOLANA
    const signal = controller.current.signal
    const result = await Aggregator.baseTradeSolana({
      aggregatorAPI,
      currencyAmountIn: debounceAmount,
      currencyOut,
      to,
      signal,
    })
    setPrice(result)
  }, [currencyIn, currencyOut, debounceAmount, account, aggregatorAPI, customChain])

  const fetcher = useMemo(() => debounce(fetcherWithoutDebounce, INPUT_DEBOUNCE_TIME), [fetcherWithoutDebounce])

  return { fetcher, result: price }
}

export default useGetRoute
