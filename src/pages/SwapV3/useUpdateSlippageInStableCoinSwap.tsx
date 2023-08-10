import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
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
  const inputCurrencyId = useSelector((state: AppState) => state.swap[Field.INPUT].currencyId)
  const previousInputCurrencyId = usePrevious(inputCurrencyId)
  const outputCurrencyId = useSelector((state: AppState) => state.swap[Field.OUTPUT].currencyId)
  const previousOutputCurrencyId = usePrevious(outputCurrencyId)
  const [slippage, setSlippage] = useUserSlippageTolerance()

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
