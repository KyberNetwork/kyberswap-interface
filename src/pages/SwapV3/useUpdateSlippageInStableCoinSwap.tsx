import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { usePrevious } from 'react-use'

import { DEFAULT_SLIPPAGE, DEFAULT_SLIPPAGE_STABLE_PAIR_SWAP } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useStableCoins } from 'hooks/Tokens'
import { AppState } from 'state'
import { Field } from 'state/swap/actions'
import { useUserSlippageTolerance } from 'state/user/hooks'

const useUpdateSlippageInStableCoinSwap = () => {
  const { chainId } = useActiveWeb3React()
  const { isStableCoin } = useStableCoins(chainId)

  const [searchParams] = useSearchParams()
  const [slippage, setSlippage] = useUserSlippageTolerance()

  const inputTokenFromParam = searchParams.get('inputCurrency') ?? ''
  const outputTokenFromParam = searchParams.get('outputCurrency') ?? ''

  const inputCurrencyId = useSelector((state: AppState) => state.swap[Field.INPUT].currencyId) || inputTokenFromParam
  const outputCurrencyId = useSelector((state: AppState) => state.swap[Field.OUTPUT].currencyId) || outputTokenFromParam

  const previousInputCurrencyId = usePrevious(inputCurrencyId)
  const previousOutputCurrencyId = usePrevious(outputCurrencyId)
  const rawSlippageRef = useRef(slippage)
  rawSlippageRef.current = slippage

  useEffect(() => {
    const isStableCoinPreviousSwap = isStableCoin(previousInputCurrencyId) && isStableCoin(previousOutputCurrencyId)
    const isStableCoinSwap = isStableCoin(inputCurrencyId) && isStableCoin(outputCurrencyId)

    if (isStableCoinPreviousSwap === isStableCoinSwap) {
      return
    }

    if (isStableCoinSwap && rawSlippageRef.current > DEFAULT_SLIPPAGE_STABLE_PAIR_SWAP) {
      setSlippage(DEFAULT_SLIPPAGE_STABLE_PAIR_SWAP)
      return
    }

    if (!isStableCoinSwap && rawSlippageRef.current > DEFAULT_SLIPPAGE) {
      setSlippage(DEFAULT_SLIPPAGE)
    }
  }, [
    isStableCoin,
    chainId,
    inputCurrencyId,
    outputCurrencyId,
    previousInputCurrencyId,
    previousOutputCurrencyId,
    setSlippage,
  ])
}

export default useUpdateSlippageInStableCoinSwap
