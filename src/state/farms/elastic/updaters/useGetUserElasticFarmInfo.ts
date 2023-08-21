import { gql, useLazyQuery } from '@apollo/client'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { isEVM } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useKyberSwapConfig } from 'state/application/hooks'
import { useAppSelector } from 'state/hooks'
import { usePoolBlocks } from 'state/prommPools/hooks'

import { setPoolFeeData } from '..'

const POOL_FEE_HISTORY = gql`
  query poolFees($block: Int!, $poolIds: [String]!) {
    pools(block: { number: $block }, where: { id_in: $poolIds }) {
      id
      feesUSD
    }
  }
`

const defaultChainData = {
  loading: false,
  farms: null,
  poolFeeLast24h: {},
}
const useGetUserFarmingInfo = () => {
  const dispatch = useDispatch()
  const { chainId } = useActiveWeb3React()
  const { elasticClient } = useKyberSwapConfig()

  const elasticFarm = useAppSelector(state => state.elasticFarm[chainId || 1]) || defaultChainData

  const { blockLast24h } = usePoolBlocks()
  const [getPoolInfo, { data: poolFeeData }] = useLazyQuery(POOL_FEE_HISTORY, {
    client: elasticClient,
    fetchPolicy: 'network-only',
  })

  useEffect(() => {
    if (poolFeeData?.pools?.length) {
      const poolFeeMap = poolFeeData.pools.reduce(
        (acc: { [id: string]: number }, cur: { id: string; feesUSD: string }) => {
          return {
            ...acc,
            [cur.id]: Number(cur.feesUSD),
          }
        },
        {} as { [id: string]: number },
      )

      dispatch(setPoolFeeData({ chainId, data: poolFeeMap }))
    }
  }, [poolFeeData, chainId, dispatch])

  useEffect(() => {
    if (!isEVM(chainId)) return
    const poolIds = elasticFarm.farms?.map(item => item.pools.map(p => p.poolAddress.toLowerCase())).flat()

    if (blockLast24h && poolIds?.length) {
      getPoolInfo({
        variables: {
          block: Number(blockLast24h),
          poolIds,
        },
      })
    }
  }, [elasticFarm.farms, blockLast24h, getPoolInfo, chainId])
}

export default useGetUserFarmingInfo
