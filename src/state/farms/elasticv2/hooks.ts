import { useCallback, useMemo } from 'react'

import FarmV2ABI from 'constants/abis/v2/farmv2.json'
import { CONTRACT_NOT_FOUND_MSG } from 'constants/messages'
import { NETWORKS_INFO } from 'constants/networks'
import { EVMNetworkInfo } from 'constants/networks/type'
import { useActiveWeb3React } from 'hooks'
import { useContract, useProAmmNFTPositionManagerContract } from 'hooks/useContract'
import { useAppSelector } from 'state/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { calculateGasMargin } from 'utils'

import { defaultChainData } from '.'
import { UserFarmV2Info } from './types'

export const useElasticFarmsV2 = () => {
  const { chainId } = useActiveWeb3React()
  const elasticFarm = useAppSelector(state => state.elasticFarmV2[chainId] || defaultChainData)
  return elasticFarm
}

export const useUserFarmV2Info = (fId: number, rangeId: number): UserFarmV2Info[] => {
  const { userInfo } = useElasticFarmsV2()
  return useMemo(
    () => userInfo?.filter(item => item.fId === fId && item.rangeId === rangeId) || [],
    [fId, rangeId, userInfo],
  )
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
        //const estimateGas = await farmContract.estimateGas.deposit(fId, rangeId, nftIds, account)
        const tx = await farmContract.deposit(fId, rangeId, nftIds, account, {
          gasLimit: '10000000',
        })
        addTransactionWithType({
          hash: tx.hash,
          type: TRANSACTION_TYPE.ELASTIC_DEPOSIT_LIQUIDITY,
        })
        return tx.hash
      } catch (e) {
        console.log(e)
      }
    },
    [farmContract, addTransactionWithType, account],
  )

  const withdraw = useCallback(
    async (fId: number, nftIds: number[]) => {
      if (!farmContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }
      const estimateGas = await farmContract.estimateGas.withdraw(fId, nftIds)
      const tx = await farmContract.withdraw(fId, nftIds, {
        gasLimit: calculateGasMargin(estimateGas),
      })
      addTransactionWithType({
        hash: tx.hash,
        type: TRANSACTION_TYPE.ELASTIC_WITHDRAW_LIQUIDITY,
      })

      return tx.hash
    },
    [addTransactionWithType, farmContract],
  )

  // const emergencyWithdraw = useCallback(
  //   async (nftIds: BigNumber[]) => {
  //     if (!contract) {
  //       throw new Error(CONTRACT_NOT_FOUND_MSG)
  //     }
  //     const estimateGas = await contract.estimateGas.emergencyWithdraw(nftIds)
  //     const tx = await contract.emergencyWithdraw(nftIds, {
  //       gasLimit: calculateGasMargin(estimateGas),
  //     })
  //     addTransactionWithType({
  //       hash: tx.hash,
  //       type: TRANSACTION_TYPE.ELASTIC_FORCE_WITHDRAW_LIQUIDITY,
  //       extraInfo: { contract: address },
  //     })

  //     return tx.hash
  //   },
  //   [addTransactionWithType, contract, address],
  // )

  // const stake = useCallback(
  //   async (pid: BigNumber, selectedNFTs: StakeParam[]) => {
  //     if (!contract) {
  //       throw new Error(CONTRACT_NOT_FOUND_MSG)
  //     }

  //     const nftIds = selectedNFTs.map(item => item.nftId)
  //     const liqs = selectedNFTs.map(item => BigNumber.from(item.position.liquidity.toString()))

  //     const estimateGas = await contract.estimateGas.join(pid, nftIds, liqs)
  //     const tx = await contract.join(pid, nftIds, liqs, {
  //       gasLimit: calculateGasMargin(estimateGas),
  //     })
  //     addTransactionWithType({
  //       hash: tx.hash,
  //       type: TRANSACTION_TYPE.STAKE,
  //       extraInfo: getTransactionExtraInfo(
  //         selectedNFTs.map(e => e.position),
  //         selectedNFTs.map(e => e.poolAddress),
  //         nftIds.map(e => e.toString()),
  //       ),
  //     })

  //     return tx.hash
  //   },
  //   [addTransactionWithType, contract],
  // )

  // const unstake = useCallback(
  //   async (pid: BigNumber, selectedNFTs: StakeParam[]) => {
  //     if (!contract) {
  //       throw new Error(CONTRACT_NOT_FOUND_MSG)
  //     }
  //     try {
  //       const nftIds = selectedNFTs.map(item => item.nftId)
  //       const liqs = selectedNFTs.map(item => BigNumber.from(item.stakedLiquidity))
  //       const estimateGas = await contract.estimateGas.exit(pid, nftIds, liqs)
  //       const tx = await contract.exit(pid, nftIds, liqs, {
  //         gasLimit: calculateGasMargin(estimateGas),
  //       })
  //       addTransactionWithType({
  //         hash: tx.hash,
  //         type: TRANSACTION_TYPE.UNSTAKE,
  //         extraInfo: getTransactionExtraInfo(
  //           selectedNFTs.map(e => e.position),
  //           selectedNFTs.map(e => e.poolAddress),
  //           nftIds.map(e => e.toString()),
  //         ),
  //       })

  //       return tx.hash
  //     } catch (e) {
  //       console.log(e)
  //     }
  //   },
  //   [addTransactionWithType, contract],
  // )

  const harvest = useCallback(
    async (fId: number, nftIds: number[]) => {
      if (!farmContract) return

      try {
        const estimateGas = await farmContract.estimateGas.claimReward(fId, nftIds)
        const tx = await farmContract.claimReward(fId, nftIds, {
          gasLimit: calculateGasMargin(estimateGas),
        })

        addTransactionWithType({ hash: tx.hash, type: TRANSACTION_TYPE.HARVEST })
        return tx
      } catch (e) {
        console.log(e)
      }
    },
    [addTransactionWithType, farmContract],
  )

  return { approve, deposit, withdraw, harvest }
}
