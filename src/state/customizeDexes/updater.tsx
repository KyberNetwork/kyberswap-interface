import { useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'

import { KYBERSWAP_KS_DEXES_TO_UI_DEXES, KYBERSWAP_UI_DEXES } from 'constants/dexes'
import { useActiveWeb3React } from 'hooks'
import useLiquiditySources from 'hooks/useAggregatorStats'
import { AppDispatch } from 'state/index'

import { updateAllDexes } from '.'

export default function Updater(): null {
  const dispatch = useDispatch<AppDispatch>()

  const { chainId } = useActiveWeb3React()
  const { data: dexes } = useLiquiditySources(chainId)

  // filterout kyberswap dexes, will hardcode
  const normalizeDexes = useMemo(() => {
    const dexesFormatted = dexes?.map(item => ({ ...item, id: item.dexId })) || []
    const dexesOutsideKyberswap = dexesFormatted.filter(item => !item.dexId.includes('kyberswap'))
    const dexesKyberswap = (
      [
        ...new Set(
          dexesFormatted
            .filter(item => item.dexId.includes('kyberswap'))
            .map(dex => KYBERSWAP_KS_DEXES_TO_UI_DEXES[dex.id]),
        ),
      ].filter(Boolean) as string[]
    ).map(uiDexKey => KYBERSWAP_UI_DEXES[uiDexKey])

    return [...dexesOutsideKyberswap, ...dexesKyberswap]
  }, [dexes])

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

  return null
}
