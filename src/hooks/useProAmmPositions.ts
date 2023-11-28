import { defaultAbiCoder } from '@ethersproject/abi'
import { getCreate2Address } from '@ethersproject/address'
import { BigNumber } from '@ethersproject/bignumber'
import { keccak256 } from '@ethersproject/solidity'
import { computePoolAddress } from '@kyberswap/ks-sdk-elastic'
import { useMemo } from 'react'

import { useActiveWeb3React } from 'hooks'
import { useDepositedNfts, useElasticFarms, useJoinedPositions } from 'state/farms/elastic/hooks'
import { Result, useSingleCallResult, useSingleContractMultipleData } from 'state/multicall/hooks'
import { PositionDetails } from 'types/position'

import { useProAmmNFTPositionManagerReadingContract } from './useContract'

interface UseProAmmPositionsResults {
  loading: boolean
  positions: PositionDetails[] | undefined
}

export function useProAmmPositionsFromTokenIds(tokenIds: BigNumber[] | undefined): UseProAmmPositionsResults {
  const positionManager = useProAmmNFTPositionManagerReadingContract()
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

        return {
          tokenId: tokenId,
          poolId: getCreate2Address(
            networkInfo.elastic.coreFactory,
            keccak256(
              ['bytes'],
              [
                defaultAbiCoder.encode(
                  ['address', 'address', 'uint24'],
                  [result.info.token0, result.info.token1, result.info.fee],
                ),
              ],
            ),
            networkInfo.elastic.initCodeHash,
          ),
          feeGrowthInsideLast: result.pos.feeGrowthInsideLast,
          nonce: result.pos.nonce,
          liquidity: result.pos.liquidity,
          operator: result.pos.operator,
          tickLower: result.pos.tickLower,
          tickUpper: result.pos.tickUpper,
          rTokenOwed: result.pos.rTokenOwed,
          fee: result.info.fee,
          token0: result.info.token0,
          token1: result.info.token1,
        }
      })
    }
    return undefined
  }, [loading, error, results, tokenIds, networkInfo])

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

export function useProAmmPositionsFromTokenId(tokenId: BigNumber | undefined): UseProAmmPositionResults {
  const position = useProAmmPositionsFromTokenIds(tokenId ? [tokenId] : undefined)
  return {
    loading: position.loading,
    position: position.positions?.[0],
  }
}

export function useProAmmPositions(account: string | null | undefined): UseProAmmPositionsResults {
  const positionManager = useProAmmNFTPositionManagerReadingContract()
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
      return tokenIdResults
        .map(({ result }) => result)
        .filter((result): result is Result => !!result)
        .map(result => BigNumber.from(result[0]))
    }
    return []
  }, [account, tokenIdResults])

  const { positions, loading: positionsLoading } = useProAmmPositionsFromTokenIds(tokenIds)

  return useMemo(() => {
    return {
      loading: someTokenIdsLoading || balanceLoading || positionsLoading,
      positions,
    }
  }, [someTokenIdsLoading, balanceLoading, positionsLoading, positions])
}

export const useFarmPositions = () => {
  const { networkInfo } = useActiveWeb3React()

  const { farms, loading } = useElasticFarms()
  const userFarmInfo = useJoinedPositions()
  const depositedPositions = useDepositedNfts()

  const farmingPools = useMemo(() => farms?.map(farm => farm.pools).flat() || [], [farms])

  const farmPositions: PositionDetails[] = useMemo(() => {
    return Object.values(depositedPositions)
      .flat()
      .map(pos => {
        const poolAddress = computePoolAddress({
          factoryAddress: networkInfo.elastic.coreFactory,
          tokenA: pos.pool.token0,
          tokenB: pos.pool.token1,
          fee: pos.pool.fee,
          initCodeHashManualOverride: networkInfo.elastic.initCodeHash,
        })
        const pool = farmingPools.filter(pool => pool.poolAddress.toLowerCase() === poolAddress.toLowerCase())

        const joinedLiquidity = Object.values(userFarmInfo)
          .map(item => Object.values(item.joinedPositions).flat())
          .flat()
          .filter(joinedPos => joinedPos.nftId.toString() === pos.nftId.toString())
          .reduce(
            (acc, cur) =>
              acc.gt(BigNumber.from(cur.liquidity.toString())) ? acc : BigNumber.from(cur.liquidity.toString()),
            BigNumber.from(0),
          )

        return {
          nonce: BigNumber.from('1'),
          tokenId: pos.nftId,
          operator: '0x0000000000000000000000000000000000000000',
          poolId: poolAddress,
          tickLower: pos.tickLower,
          tickUpper: pos.tickUpper,
          liquidity: BigNumber.from(pos.liquidity.toString()),
          // not used
          feeGrowthInsideLast: BigNumber.from(0),
          stakedLiquidity: joinedLiquidity,
          // not used
          rTokenOwed: BigNumber.from(0),
          token0: pos.pool.token0.address,
          token1: pos.pool.token1.address,
          fee: pos.pool.fee,
          endTime: pool?.[0]?.endTime,
          rewardPendings: [],
        }
      })
  }, [farmingPools, networkInfo, userFarmInfo, depositedPositions])

  return useMemo(() => {
    return {
      farms,
      userFarmInfo,
      farmPositions,
      loading: loading,
    }
  }, [loading, farmPositions, farms, userFarmInfo])
}
