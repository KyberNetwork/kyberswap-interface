import { ChainId, Currency, CurrencyAmount, Price, WETH } from '@kyberswap/ks-sdk-core'
import { debounce } from 'lodash'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import routeApi from 'services/route'
import { GetRouteParams } from 'services/route/types/getRoute'

import useGetTokenFeeScore from 'components/SwapForm/hooks/useGetTokenFeeScore'
import useSelectedDexes from 'components/SwapForm/hooks/useSelectedDexes'
import { ETHER_ADDRESS, INPUT_DEBOUNCE_TIME, ZERO_ADDRESS_SOLANA } from 'constants/index'
import { NETWORKS_INFO, isEVM } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useDebounce from 'hooks/useDebounce'
import { useKyberswapGlobalConfig } from 'hooks/useKyberSwapConfig'
import { FeeConfig } from 'types/route'
import { Aggregator } from 'utils/aggregator'

export type ArgsGetRoute = {
  isSaveGas: boolean
  parsedAmount: CurrencyAmount<Currency> | undefined
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  feeConfig: FeeConfig | undefined
  customChain?: ChainId
  isProcessingSwap?: boolean
}

export type TokenScoreByChainId = Record<
  ChainId,
  Record<
    string /* token0-token1 */,
    {
      tokenToTakeFee: string
      feePercent: number
      savedAt: number
    }
  >
>

export const getRouteTokenAddressParam = (currency: Currency) =>
  currency.isNative
    ? isEVM(currency.chainId)
      ? ETHER_ADDRESS
      : WETH[currency.chainId].address
    : currency.wrapped.address

const useGetRoute = (args: ArgsGetRoute) => {
  const { aggregatorDomain, isEnableAuthenAggregator } = useKyberswapGlobalConfig()
  const { isSaveGas, parsedAmount, currencyIn, currencyOut, feeConfig, customChain, isProcessingSwap } = args
  const { chainId: currentChain } = useActiveWeb3React()
  const chainId = customChain || currentChain

  const [trigger, _result] = routeApi.useLazyGetRouteQuery()

  const getTokenScore = useGetTokenFeeScore()

  const dexes = useSelectedDexes()
  const isInBps = feeConfig?.isInBps !== undefined ? (feeConfig.isInBps ? '1' : '0') : ''

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

    const { tokenToTakeFee, feePercent } = await getTokenScore(chainId, tokenInAddress, tokenOutAddress)
    console.log({ tokenToTakeFee, feePercent })

    const chargeFeeBy =
      tokenToTakeFee === tokenInAddress ? 'currency_in' : tokenToTakeFee === tokenOutAddress ? 'currency_out' : ''
    const feeAmount = String(feePercent)

    const feeConfig: Pick<GetRouteParams, 'feeAmount' | 'feeReceiver' | 'isInBps' | 'chargeFeeBy'> | undefined =
      chargeFeeBy
        ? {
            feeAmount,
            chargeFeeBy,
            isInBps: '1',
            feeReceiver: '0x9f4cf329f4cf376b7aded854d6054859dd102a2a',
          }
        : {
            feeAmount: '',
            chargeFeeBy: '',
            isInBps: '',
            feeReceiver: '',
          }

    const params: GetRouteParams = {
      tokenIn: tokenInAddress,
      tokenOut: tokenOutAddress,
      amountIn,
      saveGas: String(isSaveGas),
      includedSources: dexes,
      gasInclude: 'true', // default
      gasPrice: '', // default
      ...feeConfig,
    }

    ;(Object.keys(params) as (keyof typeof params)[]).forEach(key => {
      if (!params[key]) {
        delete params[key]
      }
    })

    const url = `${aggregatorDomain}/${NETWORKS_INFO[chainId].aggregatorRoute}/api/v1/routes`

    triggerDebounced({
      url,
      params,
      authentication: isEnableAuthenAggregator,
    })

    return undefined
  }, [
    parsedAmount?.quotient,
    parsedAmount?.currency,
    currencyIn,
    currencyOut,
    chainId,
    isSaveGas,
    dexes,
    getTokenScore,
    aggregatorDomain,
    triggerDebounced,
    isEnableAuthenAggregator,
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
