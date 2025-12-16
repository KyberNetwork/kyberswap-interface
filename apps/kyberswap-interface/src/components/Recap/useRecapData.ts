import { ChainId } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import { NETWORKS_INFO } from 'constants/networks'

export default function useRecapData() {
  const data = useMemo(
    () => ({
      totalVolume: 80530000000,
      totalUsers: 2500000,
      tradingVolume: 26865,
      txCount: 1786,
      top: 20,
      topChains: [ChainId.BASE, ChainId.MAINNET, ChainId.BSCMAINNET].map(chainId => ({
        chainId,
        name: NETWORKS_INFO[chainId].name,
        icon: NETWORKS_INFO[chainId].icon,
      })),
      topTokens: [
        {
          symbol: 'ETH',
          logo: 'https://storage.googleapis.com/ks-setting-1d682dca/8fca1ea5-2637-48bc-bb08-c734065442fe1693634037115.png',
        },
        {
          symbol: 'BNB',
          logo: 'https://storage.googleapis.com/ks-setting-1d682dca/d15d102e-6c7c-42f7-9dc4-79f3b1f9cc9b.png',
        },
        {
          symbol: 'ALGO',
          logo: 'https://assets.coingecko.com/coins/images/4380/standard/download.png?1696504978',
        },
        {
          symbol: 'DOGE',
          logo: 'https://assets.coingecko.com/coins/images/5/standard/dogecoin.png?1696501409',
        },
        {
          symbol: 'UNI',
          logo: 'https://ipfs.io/ipfs/QmXttGpZrECX5qCyXbBQiqgQNytVGeZW5Anewvh2jc4psg/',
        },
      ],
      totalRewards: 1276,
    }),
    [],
  )

  return { data, loading: false }
}
