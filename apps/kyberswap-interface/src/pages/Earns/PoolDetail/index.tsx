import { useSearchParams } from 'react-router-dom'
import { usePoolDetailQuery, usePoolsExplorerQuery } from 'services/zapEarn'

import { NETWORKS_INFO } from 'constants/networks'
import AddLiquidity from 'pages/Earns/PoolDetail/AddLiquidity'
import PoolHeader from 'pages/Earns/PoolDetail/components/PoolHeader'
import PoolInformation from 'pages/Earns/PoolDetail/components/PoolInformation'
import { PoolDetailWrapper } from 'pages/Earns/PoolDetail/styled'
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'

const PoolDetail = () => {
  const [searchParams] = useSearchParams()

  const exchange = searchParams.get('exchange') || ''
  const poolAddress = searchParams.get('poolAddress') || ''
  const chainId = Number(searchParams.get('poolChainId') || 0)
  const positionId = searchParams.get('positionId') || undefined
  const tickLower = searchParams.get('tickLower')
  const tickUpper = searchParams.get('tickUpper')

  const { data: poolDetail } = usePoolDetailQuery({ chainId, address: poolAddress }, { skip: !chainId || !poolAddress })

  const { data: explorerData } = usePoolsExplorerQuery(
    {
      chainId,
      page: 1,
      limit: 20,
      interval: '24h',
      protocol: exchange,
      q: poolAddress,
    },
    { skip: !chainId || !poolAddress || !exchange },
  )

  const pool = explorerData?.data?.pools?.find(item => item.address.toLowerCase() === poolAddress.toLowerCase())
  const chainName = chainId ? NETWORKS_INFO[chainId as keyof typeof NETWORKS_INFO]?.name : undefined
  const protocol = exchange ? EARN_DEXES[exchange as Exchange]?.name || exchange : undefined

  return (
    <PoolDetailWrapper>
      <PoolHeader pool={pool} poolDetail={poolDetail} chainId={chainId} exchange={exchange} />
      <AddLiquidity
        pool={pool}
        poolDetail={poolDetail}
        route={{
          exchange,
          poolAddress,
          chainId,
          positionId,
          tickLower,
          tickUpper,
        }}
      >
        <PoolInformation pool={pool} poolDetail={poolDetail} chainName={chainName} dexName={protocol} />
      </AddLiquidity>
    </PoolDetailWrapper>
  )
}

export default PoolDetail
