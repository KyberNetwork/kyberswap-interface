import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'

import { useActiveWeb3React } from 'hooks'
import { AppState } from 'state'
import { useAppDispatch } from 'state/hooks'

import { Dex, updateExcludeDex } from '.'

export const useAllDexes: (customChainId?: ChainId) => Dex[] = (customChainId?: ChainId) => {
  const { chainId: walletChainId } = useActiveWeb3React()
  const chainId = customChainId || walletChainId
  const dexes = useSelector<AppState, AppState['customizeDexes']['allDexes']>(state => state.customizeDexes.allDexes)

  return useMemo(() => {
    if (!chainId) return []
    return dexes[chainId] || []
  }, [chainId, dexes])
}

export const useExcludeDexes = (customChainId?: ChainId): [string[], (value: string[]) => void] => {
  const { chainId: walletChainId } = useActiveWeb3React()
  const chainId = customChainId || walletChainId
  const dispatch = useAppDispatch()
  const excludeDexes = useSelector<AppState, AppState['customizeDexes']['excludeDexes']>(
    state => state.customizeDexes.excludeDexes,
  )

  const excludeDexesByChainId: string[] = useMemo(() => {
    if (!chainId) return []
    return excludeDexes?.[chainId] || []
  }, [chainId, excludeDexes])

  const setExcludeDexes = useCallback(
    (dexes: string[]) => {
      if (chainId) dispatch(updateExcludeDex({ chainId, dexes }))
    },
    [chainId, dispatch],
  )

  return [excludeDexesByChainId, setExcludeDexes]
}
