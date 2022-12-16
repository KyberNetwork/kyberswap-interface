import { WETH } from '@kyberswap/ks-sdk-core'
import { useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { ETHER_ADDRESS } from 'constants/index'
import { isEVM } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { AppState } from 'state'
import { useAllDexes, useExcludeDexes } from 'state/customizeDexes/hooks'
import {
  getMetaAggregatorRouteFailure,
  getMetaAggregatorRouteRequest,
  getMetaAggregatorRouteSuccess,
} from 'state/swap/actions'
import { useInputCurrency, useOutputCurrency } from 'state/swap/hooks'
import useParsedAmountFromInputCurrency from 'state/swap/hooks/useParsedAmountFromInputCurrency'
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

const useMetaAggregatorRouteFetcher = () => {
  const dispatch = useDispatch()
  const { chainId } = useActiveWeb3React()
  const currencyIn = useInputCurrency()
  const currencyOut = useOutputCurrency()
  const feeConfig = useSelector((state: AppState) => state.swap.feeConfig)
  const abortControllerRef = useRef(new AbortController())
  const parsedAmount = useParsedAmountFromInputCurrency()

  const amountIn = parsedAmount?.quotient?.toString() || ''
  const dexes = useDexes()
  const saveGas = String(useSelector((state: AppState) => state.swap.saveGas))
  const { chargeFeeBy = '', feeReceiver = '', feeAmount = '' } = feeConfig || {}
  const isInBps = feeConfig?.isInBps !== undefined ? (feeConfig.isInBps ? '1' : '0') : ''

  const fetcher = useCallback(async () => {
    if (!currencyIn || !currencyOut || !amountIn) {
      return
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
      saveGas,
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

    dispatch(getMetaAggregatorRouteRequest())
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
        dispatch(getMetaAggregatorRouteSuccess(response))
      }
    } catch (e) {
      console.error(e)
      dispatch(getMetaAggregatorRouteFailure())
    }
  }, [
    amountIn,
    chainId,
    chargeFeeBy,
    currencyIn,
    currencyOut,
    dexes,
    dispatch,
    feeAmount,
    feeReceiver,
    isInBps,
    saveGas,
  ])

  return fetcher
}

export default useMetaAggregatorRouteFetcher
