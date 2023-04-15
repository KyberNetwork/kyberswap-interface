import { useEffect, useMemo } from 'react'

import { useActiveWeb3React } from 'hooks'
import useDebug from 'hooks/useDebug'
import { useCrossChainHandlers, useCrossChainState } from 'state/bridge/hooks'

const useDefaultTokenChain = () => {
  const { chainId } = useActiveWeb3React()
  const [{ chains, tokens, currencyIn, currencyOut, chainIdOut, ...rest }] = useCrossChainState()
  const { selectCurrency, selectDestChain } = useCrossChainHandlers()
  const listChainOut = useMemo(() => chains.filter(e => e !== chainId), [chains, chainId])

  const listTokenOut = useMemo(() => tokens.filter(e => e.chainId === chainIdOut), [tokens, chainIdOut])
  const listTokenIn = useMemo(() => tokens.filter(e => e.chainId === chainId), [tokens, chainId])

  useEffect(() => {
    selectCurrency({ currencyIn: listTokenIn[0], currencyOut })
  }, [chainId, currencyOut, listTokenIn, selectCurrency])

  useEffect(() => {
    if (chainId === chainIdOut || !chainIdOut) selectDestChain(listChainOut[0])
  }, [chainId, listChainOut, chainIdOut, selectDestChain])

  useEffect(() => {
    selectCurrency({ currencyIn, currencyOut: listTokenOut[0] })
  }, [chainIdOut, selectCurrency, currencyIn, listTokenOut])
  useDebug({ currencyIn })
  return { ...rest, listTokenIn, listChainOut, listTokenOut, chains, chainIdOut, currencyIn, currencyOut }
}
export default useDefaultTokenChain
