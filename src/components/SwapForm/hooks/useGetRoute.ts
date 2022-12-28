import { Currency, CurrencyAmount, WETH } from '@kyberswap/ks-sdk-core'
import { useCallback, useRef } from 'react'

import { ETHER_ADDRESS } from 'constants/index'
import { isEVM } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useDebounce from 'hooks/useDebounce'
import { useAllDexes, useExcludeDexes } from 'state/customizeDexes/hooks'
import { FeeConfig, RouteSummary } from 'types/metaAggregator'
import { asyncCallWithMinimumTime } from 'utils/fetchWaiting'
import getMetaAggregatorRoute, { Params } from 'utils/getMetaAggregatorRoutes'

const MINIMUM_LOADING_TIME = 1_500

const useDexes = () => {
  const allDexes = useAllDexes()
  const [excludeDexes] = useExcludeDexes()

  const selectedDexes = allDexes?.filter(item => !excludeDexes.includes(item.id)).map(item => item.id)

  const dexes =
    selectedDexes?.length === allDexes?.length
      ? ''
      : selectedDexes?.join(',').replace('kyberswapv1', 'kyberswap,kyberswap-static') || ''

  return dexes
}

type Args = {
  isSaveGas: boolean
  parsedAmount: CurrencyAmount<Currency> | undefined
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  feeConfig: FeeConfig | undefined
  setLoading: (value: boolean) => void
  setResult: (value: RouteSummary) => void
}
const useGetRoute = (args: Args) => {
  const { isSaveGas, parsedAmount, currencyIn, currencyOut, feeConfig, setLoading, setResult } = args
  const { chainId } = useActiveWeb3React()

  const abortControllerRef = useRef(new AbortController())

  const amountIn = useDebounce(parsedAmount?.quotient?.toString() || '', 200)

  const dexes = useDexes()
  const { chargeFeeBy = '', feeReceiver = '', feeAmount = '' } = feeConfig || {}
  const isInBps = feeConfig?.isInBps !== undefined ? (feeConfig.isInBps ? '1' : '0') : ''

  const fetcher = useCallback(async () => {
    if (!currencyIn || !currencyOut || !amountIn) {
      return undefined
    }

    const tokenInAddress = currencyIn.isNative
      ? isEVM(currencyIn.chainId)
        ? ETHER_ADDRESS
        : WETH[currencyIn.chainId].address
      : currencyIn.wrapped.address

    const tokenOutAddress = currencyOut.isNative
      ? isEVM(currencyOut.chainId)
        ? ETHER_ADDRESS
        : WETH[currencyOut.chainId].address
      : currencyOut.wrapped.address

    const params: Params = {
      tokenIn: tokenInAddress,
      tokenOut: tokenOutAddress,
      amountIn,
      saveGas: String(isSaveGas),
      dexes,
      gasInclude: 'true', // default
      gasPrice: '', // default

      feeAmount,
      chargeFeeBy,
      isInBps,
      feeReceiver,

      debug: 'false',
      useMeta: 'true',
    }

    setLoading(true)

    try {
      // abort the previous request
      abortControllerRef.current.abort()

      // setup a new signal
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      const response = await asyncCallWithMinimumTime(
        () => getMetaAggregatorRoute(chainId, params, currencyIn, currencyOut, abortController.signal),
        MINIMUM_LOADING_TIME,
      )

      if (!abortController.signal.aborted) {
        setResult(response.routeSummary)
        setLoading(false)
      }
    } catch (e) {
      console.error(e)
    }

    return undefined
  }, [
    amountIn,
    chainId,
    chargeFeeBy,
    currencyIn,
    currencyOut,
    dexes,
    feeAmount,
    feeReceiver,
    isInBps,
    isSaveGas,
    setLoading,
    setResult,
  ])

  return fetcher
}

export default useGetRoute
