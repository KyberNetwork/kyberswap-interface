import { ChainId } from '@kyberswap/ks-sdk-core'
import { useEffect, useRef } from 'react'

import { useDefaultSlippageByPair, usePairCategory } from 'state/swap/hooks'
import { useUserSlippageTolerance } from 'state/user/hooks'

const useUpdateSlippageInStableCoinSwap = (chainId: ChainId) => {
  const [slippage, setSlippage] = useUserSlippageTolerance()

  const cat = usePairCategory(chainId)

  const defaultSlippage = useDefaultSlippageByPair(chainId)

  const rawSlippageRef = useRef(slippage)
  rawSlippageRef.current = slippage

  useEffect(() => {
    if (!cat) return

    if (rawSlippageRef.current > defaultSlippage) {
      setSlippage(defaultSlippage)
      return
    }
  }, [defaultSlippage, cat, setSlippage])
}

export default useUpdateSlippageInStableCoinSwap
