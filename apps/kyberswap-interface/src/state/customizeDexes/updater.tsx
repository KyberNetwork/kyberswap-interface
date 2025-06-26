import { ChainId } from '@kyberswap/ks-sdk-core'
import { useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import ksSettingApi, { Dex as ApiDex } from 'services/ksSetting'

import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import store, { AppDispatch } from 'state/index'

import { Dex, updateAllDexes } from '.'

export default function Updater({ customChainId }: { customChainId?: ChainId }): null {
  const dispatch = useDispatch<AppDispatch>()
  const [allDexes, setAllDexes] = useState<ApiDex[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const { chainId: walletChainId } = useActiveWeb3React()
  const chainId = customChainId || walletChainId

  // Fetch all pages
  useEffect(() => {
    if (!chainId) return

    const fetchAllDexes = async () => {
      setIsLoading(true)
      try {
        let page = 1
        let allData: ApiDex[] = []
        let hasMore = true

        while (hasMore) {
          const response = await store
            .dispatch(
              ksSettingApi.endpoints.getDexList.initiate({
                page,
                chainId: NETWORKS_INFO[chainId].ksSettingRoute,
              }),
            )
            .unwrap()

          allData = [...allData, ...response]

          // Check if there are more pages (adjust this logic based on your API response structure)
          hasMore = response.length === 100 // or however you determine if there are more pages
          page++
        }

        setAllDexes(allData)
      } catch (error) {
        console.error('Error fetching all dexes:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllDexes()
  }, [chainId])

  const normalizeDexes = useMemo(() => {
    const dexesFormatted: Dex[] =
      allDexes?.map(item => ({
        ...item,
        id: item.dexId,
        sortId: item.id,
      })) || []
    return dexesFormatted
  }, [allDexes])

  useEffect(() => {
    if (chainId && normalizeDexes.length && !isLoading) {
      dispatch(
        updateAllDexes({
          chainId,
          dexes: normalizeDexes,
        }),
      )
    }
  }, [normalizeDexes, chainId, dispatch, isLoading])

  return null
}
