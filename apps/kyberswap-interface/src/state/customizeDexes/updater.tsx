import { ChainId } from '@kyberswap/ks-sdk-core'
import { useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import ksSettingApi from 'services/ksSetting'

import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { AppDispatch } from 'state/index'

import { Dex, updateAllDexes } from '.'

export default function Updater({ customChainId }: { customChainId?: ChainId }): null {
  const dispatch = useDispatch<AppDispatch>()

  const { chainId: walletChainId } = useActiveWeb3React()
  const chainId = customChainId || walletChainId
  const { data: dexes } = ksSettingApi.useGetDexListQuery({ chainId: NETWORKS_INFO[chainId].ksSettingRoute })

  // filterout kyberswap dexes, will hardcode
  const normalizeDexes = useMemo(() => {
    const dexesFormatted: Dex[] = dexes?.map(item => ({ ...item, id: item.dexId, sortId: item.id })) || []

    return dexesFormatted
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
