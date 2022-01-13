import { BigNumber } from '@ethersproject/bignumber'
import { useMemo } from 'react'
import { useSingleContractMultipleData, Result } from 'state/multicall/hooks'
import { PositionDetails } from 'types/position'
import { useProAmmNFTPositionManagerContract } from './useContract'
//           { "internalType": "uint96", "name": "nonce", "type": "uint96" },
//           { "internalType": "address", "name": "operator", "type": "address" },
//           { "internalType": "uint80", "name": "poolId", "type": "uint80" },
//           { "internalType": "int24", "name": "tickLower", "type": "int24" },
//           { "internalType": "int24", "name": "tickUpper", "type": "int24" },
//           { "internalType": "uint128", "name": "liquidity", "type": "uint128" },
//           { "internalType": "uint256", "name": "rTokenOwed", "type": "uint256" },
//           { "internalType": "uint256", "name": "feeGrowthInsideLast", "type": "uint256" }
interface UseProAmmPositionsResults {
  loading: boolean
  positions: PositionDetails[] | undefined
}

function useProAmmPositionsFromTokenIds(tokenIds: BigNumber[] | undefined): UseProAmmPositionsResults {
  const positionManager = useProAmmNFTPositionManagerContract()
  const inputs = useMemo(() => (tokenIds ? tokenIds.map(tokenId => [BigNumber.from(tokenId)]) : []), [tokenIds])
  const results = useSingleContractMultipleData(positionManager, 'positions', inputs)

  const loading = useMemo(() => results.some(({ loading }) => loading), [results])
  const error = useMemo(() => results.some(({ error }) => error), [results])

  const positions = useMemo(() => {
    if (!loading && !error && tokenIds) {
      return results.map((call, i) => {
        const tokenId = tokenIds[i]
        const result = call.result as Result
        return {
          tokenId: tokenId,
          poolId: result.pos.rTokenOwed,
          feeGrowthInsideLast: result.pos.feeGrowthInsideLast,
          nonce: result.pos.nonce,
          liquidity: result.pos.liquidity,
          operator: result.pos.operator,
          tickLower: result.pos.tickLower,
          tickUpper: result.pos.tickUpper,
          rTokenOwed: result.pos.rTokenOwed,
          fee: result.info.fee,
          token0: result.info.token0,
          token1: result.info.token1
        }
      })
    }
    return undefined
  }, [loading, error, results, tokenIds])

  return {
    loading,
    positions: positions?.map((position, i) => ({ ...position, tokenId: inputs[i][0] }))
  }
}

interface UseProAmmPositionResults {
  loading: boolean
  position: PositionDetails | undefined
}

export function useProAmmPositionsFromTokenId(tokenId: BigNumber | undefined): UseProAmmPositionResults {
  const position = useProAmmPositionsFromTokenIds(tokenId ? [tokenId] : undefined)
  return {
    loading: position.loading,
    position: position.positions?.[0]
  }
}
