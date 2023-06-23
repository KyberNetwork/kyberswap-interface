import { useMemo } from 'react'
import { Flex } from 'rebass'
import { useGetClassicEarningQuery } from 'services/earning'

import { useActiveWeb3React } from 'hooks'
import { chainIdByRoute } from 'pages/MyEarnings/utils'
import { useAppSelector } from 'state/hooks'

import SinglePool from './SinglePool'

const ClassicPools = () => {
  const { account = '' } = useActiveWeb3React()
  const selectedChainIds = useAppSelector(state => state.myEarnings.selectedChains)
  const classicEarningQueryResponse = useGetClassicEarningQuery({ account, chainIds: selectedChainIds })
  const data = classicEarningQueryResponse.data

  const pools = useMemo(() => {
    if (!data) {
      return []
    }

    const pools = Object.keys(data).flatMap(chainRoute => {
      const chainId = chainIdByRoute[chainRoute]
      if (!data[chainRoute].positions?.length) {
        return []
      }

      const poolEarnings = data[chainRoute].positions.map(pos => ({
        chainId,
        poolEarning: pos,
      }))

      return poolEarnings
    })

    return pools
  }, [data])

  console.log({ pools })

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {pools.map(pool => (
        <SinglePool
          key={`${pool.chainId}-${pool.poolEarning.id}`}
          chainId={pool.chainId}
          poolEarning={pool.poolEarning}
        />
      ))}
    </Flex>
  )
}

export default ClassicPools
