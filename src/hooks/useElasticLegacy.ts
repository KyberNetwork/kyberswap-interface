import { ChainId } from '@kyberswap/ks-sdk-core'
import { useEffect, useState } from 'react'

import { useActiveWeb3React } from 'hooks'

// const farmIds: { [key: number]: string } = {
//   [ChainId.MAINNET]: '0xb85ebe2e4ea27526f817ff33fb55fb240057c03f',
//   [ChainId.AVAXMAINNET]: '0xbdec4a045446f583dc564c0a227ffd475b329bf0',
//   [ChainId.MATIC]: '0xbdec4a045446f583dc564c0a227ffd475b329bf0',
//   [ChainId.OPTIMISM]: '0xb85ebe2e4ea27526f817ff33fb55fb240057c03f',
// }

export const config: {
  [chainId: number]: {
    subgraphUrl: string
    farmContract?: string
    positionManagerContract: string
  }
} = {
  [ChainId.MAINNET]: {
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/viet-nv/kyberswap-elastic-ethereum',
    farmContract: '0xb85ebe2e4ea27526f817ff33fb55fb240057c03f',
    positionManagerContract: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
  },
  [ChainId.BSCMAINNET]: {
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-bsc',
    farmContract: '',
    positionManagerContract: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
  },
  [ChainId.ARBITRUM]: {
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/viet-nv/kyberswap-elastic-arbitrum-one',
    farmContract: '0xbdec4a045446f583dc564c0a227ffd475b329bf0',
    positionManagerContract: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
  },
  [ChainId.AVAXMAINNET]: {
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/viet-nv/kyberswap-elastic-avalanche',
    farmContract: '0xbdec4a045446f583dc564c0a227ffd475b329bf0',
    positionManagerContract: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
  },
  [ChainId.OPTIMISM]: {
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/viet-nv/kyberswap-elastic-optimism',
    farmContract: '0xb85ebe2e4ea27526f817ff33fb55fb240057c03f',
    positionManagerContract: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
  },
  [ChainId.MATIC]: {
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/viet-nv/kyberswap-elastic-matic',
    farmContract: '0xbdec4a045446f583dc564c0a227ffd475b329bf0',
    positionManagerContract: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
  },
  [ChainId.FANTOM]: {
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/viet-nv/kyberswap-elastic-fantom',
    farmContract: '',
    positionManagerContract: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
  },

  [ChainId.BTTC]: {
    subgraphUrl: 'https://bttc-graph.kyberengineering.io/subgraphs/name/viet-nv/kyberswap-elastic-bttc',
    farmContract: '',
    positionManagerContract: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
  },

  [ChainId.CRONOS]: {
    subgraphUrl: 'https://cronos-graph.kyberengineering.io/subgraphs/name/viet-nv/kyberswap-elastic-cronos',
    farmContract: '',
    positionManagerContract: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
  },

  [ChainId.VELAS]: {
    subgraphUrl: 'https://velas-graph.kyberengineering.io/subgraphs/name/viet-nv/kyberswap-elastic-velas',
    farmContract: '',
    positionManagerContract: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
  },

  [ChainId.OASIS]: {
    subgraphUrl: 'https://oasis-graph.kyberengineering.io/subgraphs/name/viet-nv/kyberswap-elastic-oasis',
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
  positions(first: 1000, where: {owner: "${user.toLowerCase()}", liquidity_gt: 0}) {
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

  useEffect(() => {
    const getData = () => {
      if (!account || !config[chainId]) return
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

  return {
    loading,
    positions,
    farmPositions,
  }
}
