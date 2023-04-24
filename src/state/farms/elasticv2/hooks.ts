import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import FarmV2ABI from 'constants/abis/v2/farmv2.json'
import { FARM_TAB } from 'constants/index'
import { CONTRACT_NOT_FOUND_MSG } from 'constants/messages'
import { NETWORKS_INFO } from 'constants/networks'
import { EVMNetworkInfo } from 'constants/networks/type'
import { useActiveWeb3React } from 'hooks'
import { useContract, useProAmmNFTPositionManagerContract } from 'hooks/useContract'
import { useAppSelector } from 'state/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { calculateGasMargin, isAddressString } from 'utils'

import { defaultChainData } from '.'
import { UserFarmV2Info } from './types'

export const useElasticFarmsV2 = () => {
  const { chainId } = useActiveWeb3React()
  const elasticFarm = useAppSelector(state => state.elasticFarmV2[chainId] || defaultChainData)
  return elasticFarm || {}
}

export const useUserFarmV2Info = (fId: number): UserFarmV2Info[] => {
  const { userInfo } = useElasticFarmsV2()
  return useMemo(() => userInfo?.filter(item => item.fId === fId) || [], [fId, userInfo])
}

export enum SORT_FIELD {
  FID = 'fId',
  STAKED_TVL = 'staked_tvl',
  APR = 'apr',
  END_TIME = 'end_time',
  MY_DEPOSIT = 'my_deposit',
  MY_REWARD = 'my_reward',
}

export enum SORT_DIRECTION {
  ASC = 'asc',
  DESC = 'desc',
}

export const useFilteredFarmsV2 = () => {
  const { isEVM, chainId } = useActiveWeb3React()

  const [searchParams] = useSearchParams()
  const { farms, userInfo, loading } = useElasticFarmsV2()

  const type = searchParams.get('type')
  const activeTab: string = type || FARM_TAB.ACTIVE
  const search: string = searchParams.get('search')?.toLowerCase() || ''
  const filteredToken0Id = searchParams.get('token0') || undefined
  const filteredToken1Id = searchParams.get('token1') || undefined
  const stakedOnly = searchParams.get('stakedOnly') === 'true'

  const sortField = searchParams.get('orderBy') || SORT_FIELD.MY_DEPOSIT
  const sortDirection = searchParams.get('orderDirection') || SORT_DIRECTION.DESC

  const filteredFarms = useMemo(() => {
    const now = Date.now() / 1000

    // Filter Active/Ended farms
    let result = farms?.filter(farm =>
      activeTab === FARM_TAB.MY_FARMS
        ? true
        : activeTab === FARM_TAB.ACTIVE
        ? farm.endTime >= now && !farm.isSettled
        : farm.endTime < now || farm.isSettled,
    )

    // Filter by search value
    const searchAddress = isAddressString(chainId, search)
    if (searchAddress) {
      if (isEVM)
        result = result?.filter(farm => {
          return [farm.poolAddress, farm.token0.address, farm.token1.address]
            .map(item => item.toLowerCase())
            .includes(searchAddress.toLowerCase())
        })
    } else {
      result = result?.filter(farm => {
        return (
          farm.token0.symbol?.toLowerCase().includes(search) ||
          farm.token1.symbol?.toLowerCase().includes(search) ||
          farm.token0.name?.toLowerCase().includes(search) ||
          farm.token1.name?.toLowerCase().includes(search)
        )
      })
    }

    // Filter by input output token
    if (filteredToken0Id || filteredToken1Id) {
      if (filteredToken1Id && filteredToken0Id) {
        result = result?.filter(farm => {
          return (
            (farm.token0.address.toLowerCase() === filteredToken0Id.toLowerCase() &&
              farm.token1.address.toLowerCase() === filteredToken1Id.toLowerCase()) ||
            (farm.token0.address.toLowerCase() === filteredToken1Id.toLowerCase() &&
              farm.token1.address.toLowerCase() === filteredToken0Id.toLowerCase())
          )
        })
      } else {
        const address = filteredToken1Id || filteredToken0Id
        result = result?.filter(farm => {
          return (
            farm.token0.address.toLowerCase() === address?.toLowerCase() ||
            farm.token1.address.toLowerCase() === address?.toLowerCase()
          )
        })
      }
    }

    if (stakedOnly) {
      result = result?.filter(item => userInfo?.map(i => i.fId).includes(item.fId))
    }
    return (result || []).sort((a, b) => {
      const apr_a = a.ranges.reduce((m, cur) => (m > (cur.apr || 0) ? m : cur.apr || 0), 0)
      const apr_b = b.ranges.reduce((m, cur) => (m > (cur.apr || 0) ? m : cur.apr || 0), 0)

      const userDepositedUsdInA =
        userInfo?.filter(item => item.fId === a.fId).reduce((total, item) => item.stakedUsdValue + total, 0) || 0
      const userDepositedUsdInB =
        userInfo?.filter(item => item.fId === b.fId).reduce((total, item) => item.stakedUsdValue + total, 0) || 0

      const userRewardsInA =
        userInfo?.filter(item => item.fId === a.fId).reduce((total, item) => item.unclaimedRewardsUsd + total, 0) || 0
      const userRewardsInB =
        userInfo?.filter(item => item.fId === b.fId).reduce((total, item) => item.unclaimedRewardsUsd + total, 0) || 0

      switch (sortField) {
        case SORT_FIELD.STAKED_TVL:
          return sortDirection === SORT_DIRECTION.DESC ? b.tvl - a.tvl : a.tvl - b.tvl
        case SORT_FIELD.END_TIME:
          return sortDirection === SORT_DIRECTION.DESC ? b.endTime - a.endTime : a.endTime - b.endTime
        case SORT_FIELD.APR:
          return sortDirection === SORT_DIRECTION.DESC ? apr_b - apr_a : apr_a - apr_b
        case SORT_FIELD.MY_DEPOSIT:
          return sortDirection === SORT_DIRECTION.DESC
            ? userDepositedUsdInB - userDepositedUsdInA
            : userDepositedUsdInA - userDepositedUsdInB
        case SORT_FIELD.MY_REWARD:
          return sortDirection === SORT_DIRECTION.DESC
            ? userRewardsInB - userRewardsInA
            : userRewardsInA - userRewardsInB
        default:
          return sortDirection === SORT_DIRECTION.DESC ? apr_b - apr_a : apr_a - apr_b
      }
    })
  }, [
    sortDirection,
    sortField,
    stakedOnly,
    userInfo,
    farms,
    activeTab,
    chainId,
    filteredToken0Id,
    filteredToken1Id,
    isEVM,
    search,
  ])

  return {
    filteredFarms,
    farms,
    userInfo,
    loading,
  }
}

export const useFarmV2Action = () => {
  const { chainId, account } = useActiveWeb3React()
  const address = (NETWORKS_INFO[chainId] as EVMNetworkInfo).elastic?.farmV2Contract
  const addTransactionWithType = useTransactionAdder()
  const farmContract = useContract(address, FarmV2ABI)
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
        summary: `Elastic Farm v2`,
        contract: address,
      },
    })
    return tx.hash
  }, [posManager, address, addTransactionWithType])

  //Deposit
  const deposit = useCallback(
    async (fId: number, rangeId: number, nftIds: number[]) => {
      if (!farmContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }
      try {
        const estimateGas = await farmContract.estimateGas.deposit(fId, rangeId, nftIds, account)
        const tx = await farmContract.deposit(fId, rangeId, nftIds, account, {
          gasLimit: calculateGasMargin(estimateGas),
        })
        addTransactionWithType({
          hash: tx.hash,
          type: TRANSACTION_TYPE.ELASTIC_DEPOSIT_LIQUIDITY,
        })
        return tx.hash
      } catch (e) {
        throw e
      }
    },
    [farmContract, addTransactionWithType, account],
  )

  const updateLiquidity = useCallback(
    async (fId: number, rangeId: number, nftIds: number[]) => {
      if (!farmContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }
      try {
        const estimateGas = await farmContract.estimateGas.addLiquidity(fId, rangeId, nftIds)
        const tx = await farmContract.addLiquidity(fId, rangeId, nftIds, {
          gasLimit: calculateGasMargin(estimateGas),
        })
        addTransactionWithType({
          hash: tx.hash,
          type: TRANSACTION_TYPE.ELASTIC_DEPOSIT_LIQUIDITY,
        })
        return tx.hash
      } catch (e) {
        throw e
      }
    },
    [addTransactionWithType, farmContract],
  )

  const withdraw = useCallback(
    async (fId: number, nftIds: number[]) => {
      if (!farmContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }
      try {
        const estimateGas = await farmContract.estimateGas.withdraw(fId, nftIds)
        const tx = await farmContract.withdraw(fId, nftIds, {
          gasLimit: calculateGasMargin(estimateGas),
        })

        addTransactionWithType({
          hash: tx.hash,
          type: TRANSACTION_TYPE.ELASTIC_WITHDRAW_LIQUIDITY,
        })
        return tx.hash
      } catch (e) {
        throw e
      }
    },
    [addTransactionWithType, farmContract],
  )

  const harvest = useCallback(
    async (fId: number, nftIds: number[]) => {
      if (!farmContract) {
        throw new Error("Farm contract doesn't exist")
      }

      try {
        const estimateGas = await farmContract.estimateGas.claimReward(fId, nftIds)
        const tx = await farmContract.claimReward(fId, nftIds, {
          gasLimit: calculateGasMargin(estimateGas),
        })

        addTransactionWithType({ hash: tx.hash, type: TRANSACTION_TYPE.HARVEST })
        return tx
      } catch (e) {
        throw e
      }
    },
    [addTransactionWithType, farmContract],
  )

  return { approve, deposit, withdraw, harvest, updateLiquidity }
}
