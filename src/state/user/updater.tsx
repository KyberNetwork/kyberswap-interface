import { useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'

import { kyberswapDexes } from 'constants/dexes'
import { ELASTIC_NOT_SUPPORTED } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import useLiquiditySources from 'hooks/useAggregatorStats'

import { AppDispatch } from '../index'
import { updateAllDexes, updateMatchesDarkMode } from './actions'

export default function Updater(): null {
  const dispatch = useDispatch<AppDispatch>()

  const { chainId } = useActiveWeb3React()
  const { data: dexes } = useLiquiditySources(chainId)

  // filterout kyberswap dexes, will hardcode
  const normalizeDexes = useMemo(() => {
    const temp =
      dexes?.map(item => ({ ...item, id: item.dexId })).filter(item => !item.dexId.includes('kyberswap')) || []
    const isSupportkSElastic = !ELASTIC_NOT_SUPPORTED[chainId || 1]
    return [...temp, ...kyberswapDexes.filter(item => (isSupportkSElastic ? true : item.id !== 'kyberswapv2'))]
  }, [dexes, chainId])

  useEffect(() => {
    if (chainId && normalizeDexes.length) {
      dispatch(
        updateAllDexes({
          chainId,
          dexes: normalizeDexes,
        }),
      )
    }
  }, [normalizeDexes, chainId, dispatch])

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
