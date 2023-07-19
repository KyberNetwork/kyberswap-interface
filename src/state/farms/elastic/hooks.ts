import { defaultAbiCoder } from '@ethersproject/abi'
import { ChainId, Currency, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { FeeAmount, Position, computePoolAddress } from '@kyberswap/ks-sdk-elastic'
import { t } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { ELASTIC_FARM_TYPE, FARM_TAB } from 'constants/index'
import { CONTRACT_NOT_FOUND_MSG } from 'constants/messages'
import { isEVM as isEVMNetwork } from 'constants/networks'
import { EVMNetworkInfo } from 'constants/networks/type'
import { useActiveWeb3React } from 'hooks'
import { useTokens } from 'hooks/Tokens'
import { useProAmmNFTPositionManagerContract, useProMMFarmContract } from 'hooks/useContract'
import { usePools } from 'hooks/usePools'
import { FarmingPool, NFTPosition } from 'state/farms/elastic/types'
import { useAppSelector } from 'state/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import {
  TRANSACTION_TYPE,
  TransactionExtraInfoHarvestFarm,
  TransactionExtraInfoStakeFarm,
} from 'state/transactions/type'
import { PositionDetails } from 'types/position'
import { calculateGasMargin, isAddressString } from 'utils'

import { defaultChainData } from '.'

export { default as FarmUpdater } from './updaters'

export const useElasticFarms = (customChainId?: ChainId) => {
  const { chainId: activeChainId } = useActiveWeb3React()
  const chainId = customChainId || activeChainId
  const isEVM = isEVMNetwork(chainId)
  const elasticFarm = useAppSelector(state => state.elasticFarm[chainId])
  return useMemo(() => (isEVM ? elasticFarm || defaultChainData : defaultChainData), [isEVM, elasticFarm])
}

export const useFilteredFarms = () => {
  const { isEVM, networkInfo, chainId } = useActiveWeb3React()

  const [searchParams] = useSearchParams()
  const filteredToken0Id = searchParams.get('token0') || undefined
  const filteredToken1Id = searchParams.get('token1') || undefined

  const { farms, loading, userFarmInfo } = useElasticFarms()

  const type = searchParams.get('type')
  const activeTab: string = type || FARM_TAB.ACTIVE

  const search: string = searchParams.get('search')?.toLowerCase() || ''
  const elasticType: string = searchParams.get('elasticType') || ELASTIC_FARM_TYPE.ALL

  const filteredFarms = useMemo(() => {
    if (elasticType === ELASTIC_FARM_TYPE.STATIC) return []
    const now = Date.now() / 1000

    // filter active/ended farm
    let result = farms
      ?.map(farm => {
        const pools = farm.pools.filter(pool =>
          activeTab === FARM_TAB.MY_FARMS
            ? true
            : activeTab === FARM_TAB.ACTIVE
            ? pool.endTime >= now
            : pool.endTime < now,
        )
        return { ...farm, pools }
      })
      .filter(farm => !!farm.pools.length)

    const searchAddress = isAddressString(chainId, search)
    // filter by address
    if (searchAddress) {
      if (isEVM)
        result = result?.map(farm => {
          farm.pools = farm.pools.filter(pool => {
            const poolAddress = computePoolAddress({
              factoryAddress: (networkInfo as EVMNetworkInfo).elastic.coreFactory,
              tokenA: pool.token0.wrapped,
              tokenB: pool.token1.wrapped,
              fee: pool.pool.fee,
              initCodeHashManualOverride: (networkInfo as EVMNetworkInfo).elastic.initCodeHash,
            })
            return [poolAddress, pool.pool.token1.address, pool.pool.token0.address].includes(searchAddress)
          })
          return farm
        })
    } else {
      // filter by symbol and name of token
      result = result?.map(farm => {
        farm.pools = farm.pools.filter(pool => {
          return (
            pool.token0.symbol?.toLowerCase().includes(search) ||
            pool.token1.symbol?.toLowerCase().includes(search) ||
            pool.token0.name?.toLowerCase().includes(search) ||
            pool.token1.name?.toLowerCase().includes(search)
          )
        })
        return farm
      })
    }

    if (filteredToken0Id || filteredToken1Id) {
      if (filteredToken1Id && filteredToken0Id) {
        result = result?.map(farm => {
          farm.pools = farm.pools.filter(pool => {
            return (
              (pool.token0.wrapped.address.toLowerCase() === filteredToken0Id.toLowerCase() &&
                pool.token1.wrapped.address.toLowerCase() === filteredToken1Id.toLowerCase()) ||
              (pool.token1.wrapped.address.toLowerCase() === filteredToken0Id.toLowerCase() &&
                pool.token0.wrapped.address.toLowerCase() === filteredToken1Id.toLowerCase())
            )
          })
          return farm
        })
      } else {
        const address = filteredToken1Id || filteredToken0Id
        result = result?.map(farm => {
          farm.pools = farm.pools.filter(pool => {
            return (
              pool.token0.wrapped.address.toLowerCase() === address?.toLowerCase() ||
              pool.token1.wrapped.address.toLowerCase() === address?.toLowerCase()
            )
          })
          return farm
        })
      }
    }

    if (activeTab === FARM_TAB.MY_FARMS && isEVM) {
      result = result?.map(item => {
        if (!userFarmInfo?.[item.id].depositedPositions.length) {
          return { ...item, pools: [] }
        }
        const stakedPools = userFarmInfo?.[item.id].depositedPositions.map(pos =>
          computePoolAddress({
            factoryAddress: (networkInfo as EVMNetworkInfo).elastic.coreFactory,
            tokenA: pos.pool.token0,
            tokenB: pos.pool.token1,
            fee: pos.pool.fee,
            initCodeHashManualOverride: (networkInfo as EVMNetworkInfo).elastic.initCodeHash,
          }).toLowerCase(),
        )

        const pools = item.pools.filter(pool => stakedPools.includes(pool.poolAddress.toLowerCase()))
        return { ...item, pools }
      })
    }

    return result?.filter(farm => !!farm.pools.length) || []
  }, [
    farms,
    search,
    activeTab,
    chainId,
    userFarmInfo,
    isEVM,
    networkInfo,
    filteredToken0Id,
    filteredToken1Id,
    elasticType,
  ])

  return {
    farms,
    loading,
    userFarmInfo,
    filteredFarms,
  }
}

export type StakeParam = {
  nftId: BigNumber
  position: NFTPosition | Position
  stakedLiquidity: string
  poolAddress: string
}

const getTransactionExtraInfo = (
  positions: Position[] | NFTPosition[],
  poolIds: string[],
  nftIds: string[],
): TransactionExtraInfoStakeFarm => {
  if (!positions[0]?.amount0) {
    return { pairs: [] }
  }
  const pairs = positions.map((item, index) => {
    const { amount0, amount1 } = item
    return {
      tokenAddressIn: amount0.currency.address,
      tokenAddressOut: amount1.currency.address,
      tokenSymbolIn: amount0.currency.symbol ?? '',
      tokenSymbolOut: amount1.currency.symbol ?? '',
      tokenAmountIn: amount0.toSignificant(6),
      tokenAmountOut: amount1.toSignificant(6),
      poolAddress: poolIds[index],
      nftId: nftIds[index],
    }
  })
  return { pairs }
}

export const useFarmAction = (address: string) => {
  const addTransactionWithType = useTransactionAdder()
  const contract = useProMMFarmContract(address)
  const posManager = useProAmmNFTPositionManagerContract()

  const approve = useCallback(async () => {
    if (!posManager) {
      throw new Error(CONTRACT_NOT_FOUND_MSG)
    }
    const estimateGas = await posManager.estimateGas.setApprovalForAll(address, true)
    const tx = await posManager.setApprovalForAll(address, true, {
      gasLimit: calculateGasMargin(estimateGas),
    })
    addTransactionWithType({
      hash: tx.hash,
      type: TRANSACTION_TYPE.APPROVE,
      extraInfo: {
        summary: `Elastic Farm`,
        contract: address,
      },
    })

    return tx.hash
  }, [addTransactionWithType, address, posManager])

  // Deposit
  const deposit = useCallback(
    async (positionDetails: PositionDetails[], positions: Position[]) => {
      const nftIds = positionDetails.map(e => e.tokenId)
      if (!contract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }

      const estimateGas = await contract.estimateGas.deposit(nftIds)
      const tx = await contract.deposit(nftIds, {
        gasLimit: calculateGasMargin(estimateGas),
      })
      addTransactionWithType({
        hash: tx.hash,
        type: TRANSACTION_TYPE.ELASTIC_DEPOSIT_LIQUIDITY,
        extraInfo: getTransactionExtraInfo(
          positions,
          positionDetails.map(e => e.poolId),
          positionDetails.map(e => e.tokenId.toString()),
        ),
      })

      return tx.hash
    },
    [addTransactionWithType, contract],
  )

  const withdraw = useCallback(
    async (positionDetails: PositionDetails[], positions: Position[]) => {
      if (!contract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }
      const nftIds = positionDetails.map(e => e.tokenId)
      const estimateGas = await contract.estimateGas.withdraw(nftIds)
      const tx = await contract.withdraw(nftIds, {
        gasLimit: calculateGasMargin(estimateGas),
      })
      addTransactionWithType({
        hash: tx.hash,
        type: TRANSACTION_TYPE.ELASTIC_WITHDRAW_LIQUIDITY,
        extraInfo: getTransactionExtraInfo(
          positions,
          positionDetails.map(e => e.poolId),
          positionDetails.map(e => e.tokenId.toString()),
        ),
      })

      return tx.hash
    },
    [addTransactionWithType, contract],
  )

  const emergencyWithdraw = useCallback(
    async (nftIds: BigNumber[]) => {
      if (!contract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }
      const estimateGas = await contract.estimateGas.emergencyWithdraw(nftIds)
      const tx = await contract.emergencyWithdraw(nftIds, {
        gasLimit: calculateGasMargin(estimateGas),
      })
      addTransactionWithType({
        hash: tx.hash,
        type: TRANSACTION_TYPE.ELASTIC_FORCE_WITHDRAW_LIQUIDITY,
        extraInfo: { contract: address },
      })

      return tx.hash
    },
    [addTransactionWithType, contract, address],
  )

  const depositAndJoin = useCallback(
    async (pid: BigNumber, selectedNFTs: StakeParam[]) => {
      if (!contract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }

      const nftIds = selectedNFTs.map(item => item.nftId)

      const estimateGas = await contract.estimateGas.depositAndJoin(pid, nftIds)
      const tx = await contract.depositAndJoin(pid, nftIds, {
        gasLimit: calculateGasMargin(estimateGas),
      })
      addTransactionWithType({
        hash: tx.hash,
        type: TRANSACTION_TYPE.STAKE,
        extraInfo: getTransactionExtraInfo(
          selectedNFTs.map(e => e.position),
          selectedNFTs.map(e => e.poolAddress),
          nftIds.map(e => e.toString()),
        ),
      })

      return tx.hash
    },
    [addTransactionWithType, contract],
  )

  const stake = useCallback(
    async (pid: BigNumber, selectedNFTs: StakeParam[]) => {
      if (!contract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }

      const nftIds = selectedNFTs.map(item => item.nftId)
      const liqs = selectedNFTs.map(item => BigNumber.from(item.position.liquidity.toString()))

      const estimateGas = await contract.estimateGas.join(pid, nftIds, liqs)
      const tx = await contract.join(pid, nftIds, liqs, {
        gasLimit: calculateGasMargin(estimateGas),
      })
      addTransactionWithType({
        hash: tx.hash,
        type: TRANSACTION_TYPE.STAKE,
        extraInfo: getTransactionExtraInfo(
          selectedNFTs.map(e => e.position),
          selectedNFTs.map(e => e.poolAddress),
          nftIds.map(e => e.toString()),
        ),
      })

      return tx.hash
    },
    [addTransactionWithType, contract],
  )

  const unstake = useCallback(
    async (pid: BigNumber, selectedNFTs: StakeParam[]) => {
      if (!contract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }
      try {
        const nftIds = selectedNFTs.map(item => item.nftId)
        const liqs = selectedNFTs.map(item => BigNumber.from(item.stakedLiquidity))
        const estimateGas = await contract.estimateGas.exit(pid, nftIds, liqs)
        const tx = await contract.exit(pid, nftIds, liqs, {
          gasLimit: calculateGasMargin(estimateGas),
        })
        addTransactionWithType({
          hash: tx.hash,
          type: TRANSACTION_TYPE.UNSTAKE,
          extraInfo: getTransactionExtraInfo(
            selectedNFTs.map(e => e.position),
            selectedNFTs.map(e => e.poolAddress),
            nftIds.map(e => e.toString()),
          ),
        })

        return tx.hash
      } catch (e) {
        console.log(e)
      }
    },
    [addTransactionWithType, contract],
  )

  const harvest = useCallback(
    async (
      nftIds: BigNumber[],
      poolIds: BigNumber[],
      farm: FarmingPool | undefined,
      farmRewards: CurrencyAmount<Currency>[],
    ) => {
      if (!contract) return

      const encodeData = poolIds.map(id => defaultAbiCoder.encode(['tupple(uint256[] pIds)'], [{ pIds: [id] }]))

      try {
        const estimateGas = await contract.estimateGas.harvestMultiplePools(nftIds, encodeData)
        const tx = await contract.harvestMultiplePools(nftIds, encodeData, {
          gasLimit: calculateGasMargin(estimateGas),
        })
        const extraInfo: TransactionExtraInfoHarvestFarm = {
          tokenAddressIn: farm?.token0?.wrapped.address,
          tokenAddressOut: farm?.token1?.wrapped.address,
          tokenSymbolIn: farm?.token0?.symbol,
          tokenSymbolOut: farm?.token1?.symbol,
          contract: farm?.id,
          rewards:
            farmRewards?.map(reward => ({
              tokenSymbol: reward.currency.symbol ?? '',
              tokenAmount: reward.toSignificant(6),
              tokenAddress: reward.currency.wrapped.address,
            })) ?? [],
        }
        addTransactionWithType({ hash: tx.hash, type: TRANSACTION_TYPE.HARVEST, extraInfo })
        return tx
      } catch (e) {
        console.log(e)
      }
    },
    [addTransactionWithType, contract],
  )

  return { deposit, withdraw, approve, stake, unstake, harvest, emergencyWithdraw, depositAndJoin }
}

const filterOptions = [
  {
    code: 'in_rage',
    value: t`In range`,
  },
  {
    code: 'out_range',
    value: t`Out of range`,
  },
  {
    code: 'all',
    value: t`All positions`,
  },
] as const
export const usePositionFilter = (positions: PositionDetails[], validPools: string[], includeClosedPos = false) => {
  const [activeFilter, setActiveFilter] = useState<typeof filterOptions[number]['code']>('all')

  const tokenList = useMemo(() => {
    if (!positions) return []
    return positions?.map(pos => [pos.token0, pos.token1]).flat()
  }, [positions])

  const tokens = useTokens(tokenList)

  const poolKeys = useMemo(() => {
    if (!tokens) return []
    return positions?.map(
      pos =>
        [tokens[pos.token0], tokens[pos.token1], pos.fee] as [
          Token | undefined,
          Token | undefined,
          FeeAmount | undefined,
        ],
    )
  }, [tokens, positions])

  const pools = usePools(poolKeys)

  const eligiblePositions = useMemo(() => {
    return positions
      ?.filter(pos => validPools?.includes(pos.poolId.toLowerCase()))
      .filter(pos => {
        // remove closed position
        if (!includeClosedPos && pos.liquidity.eq(0)) return false

        const pool = pools.find(
          p =>
            p[1]?.token0.address.toLowerCase() === pos.token0.toLowerCase() &&
            p[1]?.token1.address.toLowerCase() === pos.token1.toLowerCase() &&
            p[1]?.fee === pos.fee,
        )

        if (activeFilter === 'out_range') {
          if (pool && pool[1]) {
            return pool[1].tickCurrent < pos.tickLower || pool[1].tickCurrent > pos.tickUpper
          }
          return true
        } else if (activeFilter === 'in_rage') {
          if (pool && pool[1]) {
            return pool[1].tickCurrent >= pos.tickLower && pool[1].tickCurrent <= pos.tickUpper
          }
          return true
        }
        return true
      })
  }, [positions, validPools, activeFilter, pools, includeClosedPos])

  return {
    activeFilter,
    setActiveFilter,
    eligiblePositions,
    filterOptions,
  }
}
