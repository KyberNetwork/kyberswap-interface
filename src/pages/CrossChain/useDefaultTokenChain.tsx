import { useEffect, useMemo } from 'react'

import { useActiveWeb3React } from 'hooks'
import { useCrossChainHandlers, useCrossChainState } from 'state/crossChain/hooks'

const useDefaultTokenChain = () => {
  const { chainId } = useActiveWeb3React()
  const [{ chains, tokens, currencyIn, currencyOut, chainIdOut, ...rest }] = useCrossChainState()
  const { selectCurrencyIn, selectDestChain, selectCurrencyOut } = useCrossChainHandlers()
  const listChainOut = useMemo(() => chains.filter(e => e !== chainId), [chains, chainId])

  const listTokenOut = useMemo(() => tokens.filter(e => e.chainId === chainIdOut), [tokens, chainIdOut])
  const listTokenIn = useMemo(() => tokens.filter(e => e.chainId === chainId), [tokens, chainId])

  useEffect(() => {
    selectCurrencyIn(listTokenIn[0])
  }, [listTokenIn, selectCurrencyIn])

  useEffect(() => {
    if (chainId === chainIdOut || !chainIdOut) selectDestChain(listChainOut[0])
  }, [chainId, listChainOut, chainIdOut, selectDestChain])

  useEffect(() => {
    selectCurrencyOut(listTokenOut[0])
  }, [selectCurrencyOut, listTokenOut])

  return { ...rest, listTokenIn, listChainOut, listTokenOut, chains, chainIdOut, currencyIn, currencyOut }
}
export default useDefaultTokenChain
