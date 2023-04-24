import { useEffect, useMemo } from 'react'

import { NativeCurrencies } from 'constants/tokens'
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
    selectCurrencyIn(NativeCurrencies[chainId] as any) // todo
  }, [chainId, selectCurrencyIn])

  useEffect(() => {
    if (chainId === chainIdOut || !chainIdOut) selectDestChain(listChainOut[0])
  }, [chainId, listChainOut, chainIdOut, selectDestChain])

  useEffect(() => {
    chainIdOut && selectCurrencyOut(NativeCurrencies[chainIdOut] as any) // todo
  }, [selectCurrencyOut, chainIdOut])

  return { ...rest, listTokenIn, listChainOut, listTokenOut, chains, chainIdOut, currencyIn, currencyOut }
}
export default useDefaultTokenChain
