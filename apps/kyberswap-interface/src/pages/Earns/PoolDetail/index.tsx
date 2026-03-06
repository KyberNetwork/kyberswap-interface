import { useSearchParams } from 'react-router-dom'
import { usePoolDetailQuery, usePoolsExplorerQuery } from 'services/zapEarn'

import { EARN_DEXES, Exchange } from 'pages/Earns/constants'

import AddLiquidity from './components/AddLiquidity'
import PoolHeader from './components/PoolHeader'
import PoolInformation from './components/PoolInformation'
import PoolLiquidityWidget from './components/PoolLiquidityWidget'
import { PoolDetailWrapper } from './styled'

const PoolDetail = () => {
  const [searchParams] = useSearchParams()

  const exchange = searchParams.get('exchange') || ''
  const poolAddress = searchParams.get('poolAddress') || ''
  const chainId = Number(searchParams.get('poolChainId') || 0)
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
  const token0Symbol = pool?.tokens?.[0]?.symbol || poolDetail?.tokens?.[0]?.symbol
  const token1Symbol = pool?.tokens?.[1]?.symbol || poolDetail?.tokens?.[1]?.symbol
  const pairLabel = token0Symbol && token1Symbol ? `${token0Symbol}/${token1Symbol}` : undefined
  const protocol = exchange ? EARN_DEXES[exchange as Exchange]?.name || exchange : undefined

  return (
    <PoolDetailWrapper>
      <PoolHeader pool={pool} poolDetail={poolDetail} chainId={chainId} exchange={exchange} />
      <AddLiquidity
        form={
          <PoolLiquidityWidget
            exchange={exchange}
            poolAddress={poolAddress}
            chainId={chainId}
            tickLower={tickLower}
            tickUpper={tickUpper}
          />
        }
        token0Symbol={token0Symbol}
        token1Symbol={token1Symbol}
        protocol={protocol}
        pairLabel={pairLabel}
      >
        <PoolInformation pool={pool} poolDetail={poolDetail} />
      </AddLiquidity>
    </PoolDetailWrapper>
  )
}

export default PoolDetail
