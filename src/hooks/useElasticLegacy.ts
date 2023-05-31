import { ChainId } from '@kyberswap/ks-sdk-core'
import { Interface } from 'ethers/lib/utils'
import { useEffect, useRef, useState } from 'react'

import TickReaderABI from 'constants/abis/v2/ProAmmTickReader.json'
import { EVMNetworkInfo } from 'constants/networks/type'
import { useActiveWeb3React } from 'hooks'

import { useMulticallContract } from './useContract'

const tickReaderInterface = new Interface(TickReaderABI.abi)

export const config: {
  [chainId: number]: {
    subgraphUrl: string
    farmContract?: string
    positionManagerContract: string
  }
} = {
  [ChainId.MAINNET]: {
    subgraphUrl:
      'https://ethereum-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-ethereum-legacy',
    farmContract: '0xb85ebe2e4ea27526f817ff33fb55fb240057c03f',
    positionManagerContract: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
  },
  [ChainId.BSCMAINNET]: {
    subgraphUrl: 'https://bsc-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-bsc-legacy',
    farmContract: '',
    positionManagerContract: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
  },
  [ChainId.ARBITRUM]: {
    subgraphUrl:
      'https://arbitrum-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-arbitrum-legacy',
    farmContract: '0xbdec4a045446f583dc564c0a227ffd475b329bf0',
    positionManagerContract: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
  },
  [ChainId.AVAXMAINNET]: {
    subgraphUrl:
      'https://avalanche-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-avalanche-legacy',
    farmContract: '0xbdec4a045446f583dc564c0a227ffd475b329bf0',
    positionManagerContract: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
  },
  [ChainId.OPTIMISM]: {
    subgraphUrl:
      'https://optimism-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-optimism-legacy',
    farmContract: '0xb85ebe2e4ea27526f817ff33fb55fb240057c03f',
    positionManagerContract: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
  },
  [ChainId.MATIC]: {
    subgraphUrl:
      'https://polygon-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-polygon-legacy',
    farmContract: '0xbdec4a045446f583dc564c0a227ffd475b329bf0',
    positionManagerContract: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
  },
  [ChainId.FANTOM]: {
    subgraphUrl: 'https://fantom-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-fantom-legacy',
    farmContract: '',
    positionManagerContract: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
  },

  [ChainId.BTTC]: {
    subgraphUrl: 'https://bttc-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-bttc-legacy',
    farmContract: '',
    positionManagerContract: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
  },

  [ChainId.CRONOS]: {
    subgraphUrl: 'https://cronos-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-cronos-legacy',
    farmContract: '',
    positionManagerContract: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
  },

  [ChainId.VELAS]: {
    subgraphUrl: 'https://velas-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-velas-legacy',
    farmContract: '',
    positionManagerContract: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
  },

  [ChainId.OASIS]: {
    subgraphUrl: 'https://oasis-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-oasis-legacy',
    farmContract: '',
    positionManagerContract: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
  },
}

const query = (user: string) => `
{
  depositedPositions(first: 1000, where: {user: "${user.toLowerCase()}"}) {
    user
    farm {
      id
    }
    position {
      id
      owner
      tickLower {
        tickIdx
      }
      tickUpper {
        tickIdx
      }
      liquidity
      token0 {
        id
        symbol
        decimals
        name
      }
      token1 {
        id
        symbol
        decimals
        name
      }
      pool {
        id
        feeTier
        sqrtPrice
        liquidity
        reinvestL
        tick
      }
    }
  }
  positions(first: 1000, where: {owner: "${user.toLowerCase()}"}) {
    id
    liquidity
    owner
    tickLower {
      tickIdx
    }
    tickUpper {
      tickIdx
    }
    token0 {
      id
      symbol
      decimals
      name
    }
    token1 {
      id
      symbol
      decimals
      name
    }
    pool {
      id
      feeTier
      sqrtPrice
      liquidity
      reinvestL
      tick
    }
  }
}`

interface Token {
  id: string
  symbol: string
  decimals: string
  name: string
}
export interface Position {
  id: string
  owner: string
  liquidity: string
  token0: Token
  token1: Token
  tickLower: {
    tickIdx: string
  }
  tickUpper: {
    tickIdx: string
  }
  pool: {
    id: string
    feeTier: string
    sqrtPrice: string
    liquidity: string
    reinvestL: string
    tick: string
  }
}

export default function useElasticLegacy(interval = true) {
  const { chainId, account } = useActiveWeb3React()
  const [loading, setLoading] = useState(false)
  const [positions, setPositions] = useState<Position[]>([])
  const [farmPositions, setFarmPostions] = useState<Position[]>([])
  const previousChainIdRef = useRef(chainId)

  useEffect(() => {
    if (previousChainIdRef.current !== chainId) {
      setPositions([])
      setFarmPostions([])
    }
    const getData = () => {
      if (!account || !config[chainId]) {
        setLoading(false)
        return
      }
      fetch(config[chainId].subgraphUrl, {
        method: 'POST',
        body: JSON.stringify({
          query: query(account),
        }),
      })
        .then(res => res.json())
        .then(
          (res: {
            data: {
              positions: Position[]
              depositedPositions: {
                user: string
                farm: { id: string }
                position: Position
              }[]
            }
          }) => {
            setPositions(res.data.positions)
            const farmPositions = res.data.depositedPositions.filter(
              item => item.farm.id === config[chainId].farmContract && item.user !== item.position.owner,
            )

            setFarmPostions(farmPositions.map(item => item.position))
          },
        )
        .finally(() => setLoading(false))
    }

    setLoading(true)
    getData()
    const i =
      interval &&
      setInterval(() => {
        getData()
      }, 15_000)

    return () => (i ? clearInterval(i) : undefined)
  }, [chainId, account, interval])

  useEffect(() => {
    previousChainIdRef.current = chainId
  }, [chainId])

  return {
    loading,
    positions: positions.filter(item => item.liquidity !== '0'),
    allPositions: positions,
    farmPositions,
  }
}

export function usePositionFees(positions: Position[]) {
  const [feeRewards, setFeeRewards] = useState<{
    [tokenId: string]: [string, string]
  }>(() => positions.reduce((acc, item) => ({ ...acc, [item.id]: ['0', '0'] }), {}))

  const multicallContract = useMulticallContract()

  const { chainId, networkInfo } = useActiveWeb3React()

  useEffect(() => {
    const getData = async () => {
      if (!multicallContract) return
      const fragment = tickReaderInterface.getFunction('getTotalFeesOwedToPosition')
      const callParams = positions.map(item => {
        return {
          target: (networkInfo as EVMNetworkInfo).elastic.tickReader,
          callData: tickReaderInterface.encodeFunctionData(fragment, [
            config[chainId].positionManagerContract,
            item.pool.id,
            item.id,
          ]),
        }
      })

      const { returnData } = await multicallContract?.callStatic.tryBlockAndAggregate(false, callParams)
      setFeeRewards(
        returnData.reduce(
          (
            acc: { [tokenId: string]: [string, string] },
            item: { success: boolean; returnData: string },
            index: number,
          ) => {
            if (item.success) {
              const tmp = tickReaderInterface.decodeFunctionResult(fragment, item.returnData)
              return {
                ...acc,
                [positions[index].id]: [tmp.token0Owed.toString(), tmp.token1Owed.toString()],
              }
            }
            return { ...acc, [positions[index].id]: ['0', '0'] }
          },
          {} as { [tokenId: string]: [string, string] },
        ),
      )
    }

    getData()
    // eslint-disable-next-line
  }, [chainId, multicallContract, networkInfo, positions.length])

  return feeRewards
}
