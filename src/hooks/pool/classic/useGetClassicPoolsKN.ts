import useSWRImmutable from 'swr/immutable'

import { POOL_FARM_BASE_URL } from 'constants/env'
import { NETWORKS_INFO, isEVM } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useKyberSwapConfig } from 'state/application/hooks'
import { get24hValue } from 'utils'
import { toFixed } from 'utils/numbers'

import { ClassicPoolData, CommonReturn } from './type'

export type ClassicPool = {
  id: string
  fee: string
  feeUSD: string
  feesUsdOneDayAgo: string
  feesUsdTwoDaysAgo: string
  feeUSD0: string
  feeUSD1: string
  feeAmount0: string
  feeAmount1: string
  token0: {
    id: string
    symbol: string
    name: string
    decimals: string
    priceUSD: string
  }
  token1: {
    id: string
    symbol: string
    name: string
    decimals: string
    priceUSD: string
  }
  reserve0: string
  reserve1: string
  vReserve0: string
  vReserve1: string
  totalSupply: string
  pair: string
  reserveUSD: string
  volumeUsd: string
  volumeUsdOneDayAgo: string
  volumeUsdTwoDaysAgo: string
  amp: string
  apr: string
  farmApr: string
}

type Response = {
  code: number
  message: string
  data?: {
    pools: Array<ClassicPool>
  }
}

const useGetClassicPoolsKN = (): CommonReturn => {
  const { chainId } = useActiveWeb3React()
  const { isEnableKNProtocol } = useKyberSwapConfig()

  const chainRoute = !isEVM(chainId) || NETWORKS_INFO[chainId].poolFarmRoute

  const { isValidating, error, data } = useSWRImmutable<Response>(
    `${POOL_FARM_BASE_URL}/${chainRoute}/api/v1/classic/pools?includeLowTvl=true&page=1&perPage=10000&thisParamToForceRefresh=${isEnableKNProtocol}`,
    async (url: string) => {
      if (!isEnableKNProtocol) {
        return Promise.resolve({})
      }
      return fetch(url).then(resp => resp.json())
    },
    {
      refreshInterval: isEnableKNProtocol ? 0 : 60_000,
    },
  )

  const poolData: ClassicPoolData[] | undefined = data?.data?.pools.map(pool => {
    const oneDayVolumeUSD = toFixed(get24hValue(pool.volumeUsd, pool.volumeUsdOneDayAgo))
    const oneDayFeeUSD = toFixed(get24hValue(pool.feeUSD, pool.feesUsdOneDayAgo))

    return {
      id: pool.id,
      amp: pool.amp,
      fee: Number(pool.fee),
      reserve0: pool.reserve0,
      reserve1: pool.reserve1,
      vReserve0: pool.vReserve0,
      vReserve1: pool.vReserve1,

      totalSupply: pool.totalSupply,
      reserveUSD: pool.reserveUSD,
      volumeUSD: pool.volumeUsd,
      feeUSD: pool.feeUSD,
      oneDayVolumeUSD,
      oneDayVolumeUntracked: '0',
      oneDayFeeUSD,
      oneDayFeeUntracked: '0',

      token0: {
        id: pool.token0.id,
        symbol: pool.token0.symbol,
        decimals: pool.token0.decimals,
        name: pool.token0.name,
      },
      token1: {
        id: pool.token1.id,
        symbol: pool.token1.symbol,
        decimals: pool.token1.decimals,
        name: pool.token1.name,
      },
    }
  })

  return {
    loading: isValidating,
    error: error,
    data: poolData || [],
  }
}

export default useGetClassicPoolsKN
