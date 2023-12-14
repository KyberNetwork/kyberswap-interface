import { ChainId } from '@kyberswap/ks-sdk-core'
import { useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import ksSettingApi from 'services/ksSetting'

import { isKyberSwapDex } from 'components/swapv2/LiquiditySourcesPanel'
import { KYBERSWAP_KS_DEXES_TO_UI_DEXES, KYBERSWAP_UI_DEXES_CUSTOM } from 'constants/dexes'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { AppDispatch } from 'state/index'
import { uniqueArray } from 'utils/array'

import { Dex, updateAllDexes } from '.'

export default function Updater({ customChainId }: { customChainId?: ChainId }): null {
  const dispatch = useDispatch<AppDispatch>()

  const { chainId: walletChainId } = useActiveWeb3React()
  const chainId = customChainId || walletChainId
  const { data: dexes } = ksSettingApi.useGetDexListQuery({ chainId: NETWORKS_INFO[chainId].ksSettingRoute })

  // filterout kyberswap dexes, will hardcode
  const normalizeDexes = useMemo(() => {
    const dexesFormatted: Dex[] = dexes?.map(item => ({ ...item, id: item.dexId, sortId: item.id })) || []
    const dexesOutsideKyberswap = dexesFormatted.filter(item => !isKyberSwapDex(item.id))
    const dexesKyberswap = uniqueArray(
      dexesFormatted.filter(dex => KYBERSWAP_KS_DEXES_TO_UI_DEXES[dex.id]),
      dex => KYBERSWAP_KS_DEXES_TO_UI_DEXES[dex.id],
    )
    const dexesUIKyberswap = dexesKyberswap.map(dex => {
      const custom = KYBERSWAP_UI_DEXES_CUSTOM[KYBERSWAP_KS_DEXES_TO_UI_DEXES[dex.id] || ''] || dex
      return {
        ...custom,
        sortId: dex.sortId,
        logoURL: 'https://kyberswap.com/favicon.ico',
      }
    })

    return [...dexesOutsideKyberswap, ...dexesUIKyberswap]
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
