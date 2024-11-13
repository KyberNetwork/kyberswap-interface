import { ChainId } from '@kyberswap/ks-sdk-core'
import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePrevious } from 'react-use'

import { DEFAULT_SLIPPAGE, DEFAULT_SLIPPAGE_CORRELATED_PAIR, DEFAULT_SLIPPAGE_STABLE_PAIR_SWAP } from 'constants/index'
import { useStableCoins } from 'hooks/Tokens'
import { useCheckCorrelatedPair, useInputCurrency, useOutputCurrency } from 'state/swap/hooks'
import { useUserSlippageTolerance } from 'state/user/hooks'

const useUpdateSlippageInStableCoinSwap = (chainId: ChainId) => {
  const { isStableCoin } = useStableCoins(chainId)

  const [searchParams] = useSearchParams()
  const [slippage, setSlippage] = useUserSlippageTolerance()

  const inputTokenFromParam = searchParams.get('inputCurrency') ?? ''
  const outputTokenFromParam = searchParams.get('outputCurrency') ?? ''

  const inputCurrency = useInputCurrency()
  const outputCurrencty = useOutputCurrency()

  const inputCurrencyId = inputCurrency?.wrapped.address || inputTokenFromParam
  const outputCurrencyId = outputCurrencty?.wrapped.address || outputTokenFromParam

  const isCorrelatedPair = useCheckCorrelatedPair()

  const previousInputCurrencyId = usePrevious(inputCurrencyId)
  const previousOutputCurrencyId = usePrevious(outputCurrencyId)
  const isCorrelatedPairPrev = useCheckCorrelatedPair(previousInputCurrencyId, previousOutputCurrencyId)
  const rawSlippageRef = useRef(slippage)
  rawSlippageRef.current = slippage

  useEffect(() => {
    if (
      !previousInputCurrencyId ||
      !previousOutputCurrencyId ||
      (inputCurrencyId === previousInputCurrencyId && outputCurrencyId === previousOutputCurrencyId)
    )
      return

    const isStableCoinPreviousSwap = isStableCoin(previousInputCurrencyId) && isStableCoin(previousOutputCurrencyId)
    const isStableCoinSwap = isStableCoin(inputCurrencyId) && isStableCoin(outputCurrencyId)

    if ((isStableCoinPreviousSwap || isStableCoinSwap) && isStableCoinPreviousSwap === isStableCoinSwap) {
      return
    }

    if ((isCorrelatedPair || isStableCoinPreviousSwap) && isCorrelatedPairPrev === isCorrelatedPair) {
      return
    }

    if (isStableCoinSwap && rawSlippageRef.current > DEFAULT_SLIPPAGE_STABLE_PAIR_SWAP) {
      setSlippage(DEFAULT_SLIPPAGE_STABLE_PAIR_SWAP)
      return
    }

    if (isCorrelatedPair && rawSlippageRef.current > DEFAULT_SLIPPAGE_CORRELATED_PAIR) {
      setSlippage(DEFAULT_SLIPPAGE_CORRELATED_PAIR)
      return
    }

    if (!isStableCoinSwap && rawSlippageRef.current > DEFAULT_SLIPPAGE) {
      setSlippage(DEFAULT_SLIPPAGE)
    }
  }, [
    isStableCoin,
    isCorrelatedPair,
    chainId,
    isCorrelatedPairPrev,
    inputCurrencyId,
    outputCurrencyId,
    previousInputCurrencyId,
    previousOutputCurrencyId,
    setSlippage,
  ])
}

export default useUpdateSlippageInStableCoinSwap
