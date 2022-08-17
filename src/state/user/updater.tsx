import { useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'

import { extractUniqueDEXes } from 'components/swapv2/LiquiditySourcesPanel'
import { useActiveWeb3React } from 'hooks'
import useAggregatorStats from 'hooks/useAggregatorStats'

import { AppDispatch } from '../index'
import { updateAllDexes, updateMatchesDarkMode } from './actions'

export default function Updater(): null {
  const dispatch = useDispatch<AppDispatch>()

  const { chainId } = useActiveWeb3React()
  const { data } = useAggregatorStats(chainId)
  const dexIDs = useMemo(() => Object.keys(data?.pools || []), [data])

  const dexes = useMemo(() => extractUniqueDEXes(dexIDs), [dexIDs])

  useEffect(() => {
    if (chainId && dexes.length) {
      updateAllDexes({
        chainId,
        dexes,
      })
    }
  }, [dexes, chainId])

  // keep dark mode in sync with the system
  useEffect(() => {
    const darkHandler = (match: MediaQueryListEvent) => {
      dispatch(updateMatchesDarkMode({ matchesDarkMode: match.matches }))
    }

    const match = window?.matchMedia('(prefers-color-scheme: dark)')
    dispatch(updateMatchesDarkMode({ matchesDarkMode: match.matches }))

    if (match?.addListener) {
      match?.addListener(darkHandler)
    } else if (match?.addEventListener) {
      match?.addEventListener('change', darkHandler)
    }

    return () => {
      if (match?.removeListener) {
        match?.removeListener(darkHandler)
      } else if (match?.removeEventListener) {
        match?.removeEventListener('change', darkHandler)
      }
    }
  }, [dispatch])

  return null
}
