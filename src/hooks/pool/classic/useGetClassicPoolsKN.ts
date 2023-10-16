import { Token, WETH } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import { useGetPoolClassicQuery } from 'services/knprotocol'

import { ZERO_ADDRESS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useKyberSwapConfig } from 'state/application/hooks'
import { get24hValue } from 'utils'
import { toString } from 'utils/numbers'

import { ClassicPoolData, CommonReturn } from './type'

const useGetClassicPoolsKN = (): CommonReturn => {
  const { chainId } = useActiveWeb3React()
  const { isEnableKNProtocol } = useKyberSwapConfig()

  const { currentData, error, isFetching } = useGetPoolClassicQuery(chainId, { skip: !isEnableKNProtocol })
  const poolData: ClassicPoolData[] | undefined = useMemo(
    () =>
      currentData?.data?.pools.map(pool => {
        const oneDayVolumeUSD = toString(get24hValue(pool.volumeUsd, pool.volumeUsdOneDayAgo))
        const oneDayFeeUSD = toString(get24hValue(pool.feeUSD, pool.feesUsdOneDayAgo))

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

          token0:
            pool.token0.id === ZERO_ADDRESS
              ? WETH[chainId]
              : new Token(chainId, pool.token0.id, Number(pool.token0.decimals), pool.token0.symbol, pool.token0.name),
          token1:
            pool.token1.id === ZERO_ADDRESS
              ? WETH[chainId]
              : new Token(chainId, pool.token1.id, Number(pool.token1.decimals), pool.token1.symbol, pool.token1.name),
        }
      }) ?? [],
    [currentData?.data?.pools, chainId],
  )
  const fetchError = useMemo(
    () =>
      //https://redux-toolkit.js.org/rtk-query/usage-with-typescript#error-result-example
      error
        ? 'status' in error
          ? new Error('error' in error ? error.error : JSON.stringify(error.data))
          : new Error(error.message)
        : undefined,
    [error],
  )

  return {
    loading: isFetching,
    error: fetchError,
    data: poolData,
  }
}

export default useGetClassicPoolsKN
