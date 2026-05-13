import { useMemo } from 'react'

import { useActiveWeb3React } from 'hooks'
import { Result, useSingleCallResult, useSingleContractMultipleData } from 'state/multicall/hooks'
import { PositionDetails } from 'types/position'
import { bigNumberToBigInt } from 'utils/migration'
import { encodeAbiParameters, getContractAddress, keccak256, parseAbiParameters } from 'utils/viem'

import { useProAmmNFTPositionManagerReadingContract } from './useContract'

interface UseProAmmPositionsResults {
  loading: boolean
  positions: PositionDetails[] | undefined
}

export function useProAmmPositionsFromTokenIds(
  tokenIds: bigint[] | undefined,
  customContract?: string,
  customFactory?: string,
  customInitCodeHash?: string,
): UseProAmmPositionsResults {
  const positionManager = useProAmmNFTPositionManagerReadingContract(customContract)
  const { networkInfo } = useActiveWeb3React()

  const inputs = useMemo(() => (tokenIds ? tokenIds.map(tokenId => [tokenId]) : []), [tokenIds])
  const results = useSingleContractMultipleData(positionManager, 'positions', inputs)

  const loading = useMemo(() => results.some(({ loading }) => loading), [results])
  const error = useMemo(() => results.some(({ error }) => error), [results])

  const positions = useMemo(() => {
    if (!loading && !error && tokenIds) {
      return results.map((call, i) => {
        const tokenId = tokenIds[i]
        const result = call.result as Result

        // The multicall bridge wraps viem bigint values as ethers BigNumber for legacy callers;
        // convert each uint256-shaped field back to bigint for the migrated PositionDetails shape.
        return {
          tokenId: tokenId,
          poolId: getContractAddress({
            from: (customFactory || networkInfo.elastic.coreFactory) as `0x${string}`,
            opcode: 'CREATE2',
            salt: keccak256(
              encodeAbiParameters(parseAbiParameters('address, address, uint24'), [
                result.info.token0 as `0x${string}`,
                result.info.token1 as `0x${string}`,
                result.info.fee,
              ]),
            ),
            bytecodeHash: (customInitCodeHash || networkInfo.elastic.initCodeHash) as `0x${string}`,
          }),
          feeGrowthInsideLast: bigNumberToBigInt(result.pos.feeGrowthInsideLast),
          nonce: bigNumberToBigInt(result.pos.nonce),
          liquidity: bigNumberToBigInt(result.pos.liquidity),
          operator: result.pos.operator,
          tickLower: result.pos.tickLower,
          tickUpper: result.pos.tickUpper,
          rTokenOwed: bigNumberToBigInt(result.pos.rTokenOwed),
          fee: result.info.fee,
          token0: result.info.token0,
          token1: result.info.token1,
        }
      })
    }
    return undefined
  }, [loading, error, results, tokenIds, networkInfo, customInitCodeHash, customFactory])

  return useMemo(() => {
    return {
      loading,
      positions: positions?.map((position, i) => ({ ...position, tokenId: inputs[i][0] })),
    }
  }, [loading, positions, inputs])
}

interface UseProAmmPositionResults {
  loading: boolean
  position: PositionDetails | undefined
}

export function useProAmmPositionsFromTokenId(tokenId: bigint | undefined): UseProAmmPositionResults {
  const position = useProAmmPositionsFromTokenIds(tokenId ? [tokenId] : undefined)
  return {
    loading: position.loading,
    position: position.positions?.[0],
  }
}

export function useProAmmPositions(
  account: string | null | undefined,
  customContract?: string,
  customFactory?: string,
  customInitCodeHash?: string,
): UseProAmmPositionsResults {
  const positionManager = useProAmmNFTPositionManagerReadingContract(customContract)
  const { loading: balanceLoading, result: balanceResult } = useSingleCallResult(positionManager, 'balanceOf', [
    account ?? undefined,
  ])

  // we don't expect any account balance to ever exceed the bounds of max safe int
  const accountBalance: number | undefined = balanceResult?.[0]?.toNumber()

  const tokenIdsArgs = useMemo(() => {
    if (accountBalance && account) {
      const tokenRequests = []
      for (let i = 0; i < accountBalance; i++) {
        tokenRequests.push([account, i])
      }
      return tokenRequests
    }
    return []
  }, [account, accountBalance])

  const tokenIdResults = useSingleContractMultipleData(positionManager, 'tokenOfOwnerByIndex', tokenIdsArgs)

  const someTokenIdsLoading = useMemo(() => tokenIdResults.some(({ loading }) => loading), [tokenIdResults])
  const tokenIds = useMemo(() => {
    if (account) {
      // Multicall bridge wraps uint256 outputs as BigNumber; unwrap back to bigint for downstream callers.
      return tokenIdResults
        .map(({ result }) => result)
        .filter((result): result is Result => !!result)
        .map(result => bigNumberToBigInt(result[0]))
    }
    return []
  }, [account, tokenIdResults])

  const { positions, loading: positionsLoading } = useProAmmPositionsFromTokenIds(
    tokenIds,
    customContract,
    customFactory,
    customInitCodeHash,
  )

  return useMemo(() => {
    return {
      loading: someTokenIdsLoading || balanceLoading || positionsLoading,
      positions,
    }
  }, [someTokenIdsLoading, balanceLoading, positionsLoading, positions])
}
