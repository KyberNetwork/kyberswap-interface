import { useSelector } from 'react-redux'
import { AppState } from 'state'
import { useAppDispatch } from 'state/hooks'
import { useCallback } from 'react'
import { useActiveWeb3React, providers } from 'hooks'
import { FARM_CONTRACTS, PRO_AMM_CORE_FACTORY_ADDRESSES, PRO_AMM_INIT_CODE_HASH } from 'constants/v2'
import { ChainId } from '@vutien/sdk-core'
import { updatePrommFarms, setLoading } from './actions'
import { useProMMFarmContracts, useProMMFarmContract, useProAmmNFTPositionManagerContract } from 'hooks/useContract'
import { BigNumber } from 'ethers'
import { ProMMFarm, ProMMFarmResponse } from './types'
import { CONTRACT_NOT_FOUND_MSG } from 'constants/messages'
import { useTransactionAdder } from 'state/transactions/hooks'
import { calculateGasMargin, getContractForReading } from 'utils'
import { getCreate2Address } from '@ethersproject/address'
import { defaultAbiCoder } from '@ethersproject/abi'
import { keccak256 } from '@ethersproject/solidity'
import PROMM_POOL_ABI from 'constants/abis/v2/pool.json'

export const useProMMFarms = () => {
  return useSelector((state: AppState) => state.prommFarms)
}

export const useGetProMMFarms = () => {
  const dispatch = useAppDispatch()
  const { chainId, account } = useActiveWeb3React()
  const prommFarmContracts = useProMMFarmContracts()
  const positionManager = useProAmmNFTPositionManagerContract()

  const getProMMFarms = useCallback(async () => {
    const farmsAddress = FARM_CONTRACTS[chainId as ChainId]

    if (!farmsAddress) {
      dispatch(updatePrommFarms({}))
      return
    }
    dispatch(setLoading(true))

    const promises = farmsAddress.map(async address => {
      const contract = prommFarmContracts?.[address]
      if (!contract || !chainId) return

      const poolLength = await contract.poolLength()
      const userDepositedNFT: BigNumber[] = account ? await contract.getDepositedNFTs(account) : []

      const nftInfosFromContract = await Promise.all(
        userDepositedNFT.map((id: BigNumber) => positionManager?.positions(id)),
      )

      const nftInfos = nftInfosFromContract.map((result: any, index) => ({
        tokenId: userDepositedNFT[index],
        poolId: getCreate2Address(
          PRO_AMM_CORE_FACTORY_ADDRESSES[chainId as ChainId],
          keccak256(
            ['bytes'],
            [
              defaultAbiCoder.encode(
                ['address', 'address', 'uint24'],
                [result.info.token0, result.info.token1, result.info.fee],
              ),
            ],
          ),
          PRO_AMM_INIT_CODE_HASH,
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
      }))

      const pids = [...Array(BigNumber.from(poolLength).toNumber()).keys()]

      const poolInfos: ProMMFarm[] = await Promise.all(
        pids.map(async pid => {
          const poolInfo: ProMMFarmResponse = await contract.getPoolInfo(pid)

          const userNFTForPool = nftInfos.filter(item => item.poolId === poolInfo.poolAddress)

          const userInfo = await Promise.all(
            userNFTForPool.map(item =>
              contract.getUserInfo(item.tokenId, pid).catch((e: any) => new Error(JSON.stringify(e))),
            ),
          )

          const userNFTInfo = userInfo.map((item, index) => {
            return {
              ...userNFTForPool[index],
              stakedLiquidity: item instanceof Error ? BigNumber.from(0) : item.liquidity,
              rewardPendings: item instanceof Error ? [] : item.rewardPending,
            }
          })

          const poolContract = getContractForReading(poolInfo.poolAddress, PROMM_POOL_ABI, providers[chainId])
          const [token0, token1, feeTier, liquidityState, poolState] = await Promise.all([
            poolContract.token0(),
            poolContract.token1(),
            poolContract.swapFeeBps(),
            poolContract.getLiquidityState(),
            poolContract.getPoolState(),
          ])

          return {
            ...poolInfo,
            token0,
            token1,
            feeTier,
            baseL: liquidityState.baseL,
            reinvestL: liquidityState.reinvestL,
            sqrtP: poolState.sqrtP,
            currentTick: poolState.currentTick,
            pid: pid,
            userDepositedNFTs: userNFTInfo,
          }
        }),
      )

      return poolInfos
    })

    const farms = await Promise.all(promises)

    dispatch(
      updatePrommFarms(
        farmsAddress.reduce((acc, address, index) => {
          return {
            ...acc,
            [address]: farms[index],
          }
        }, {}),
      ),
    )
    dispatch(setLoading(false))
  }, [chainId, dispatch, prommFarmContracts, account, positionManager])

  return getProMMFarms
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
    addTransactionWithType(tx, { type: 'Approve', summary: `Elastic Farm` })

    return tx.hash
  }, [addTransactionWithType, address, posManager])

  // Deposit
  const deposit = useCallback(
    async (nftIds: BigNumber[]) => {
      if (!contract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }

      const estimateGas = await contract.estimateGas.deposit(nftIds)
      const tx = await contract.deposit(nftIds, {
        gasLimit: calculateGasMargin(estimateGas),
      })
      addTransactionWithType(tx, { type: 'Deposit', summary: `${nftIds.length} NFT Positions` })

      return tx.hash
    },
    [addTransactionWithType, contract],
  )

  const withdraw = useCallback(
    async (nftIds: BigNumber[]) => {
      if (!contract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }

      const estimateGas = await contract.estimateGas.withdraw(nftIds)
      const tx = await contract.withdraw(nftIds, {
        gasLimit: calculateGasMargin(estimateGas),
      })
      addTransactionWithType(tx, { type: 'Withdraw', summary: `${nftIds.length} NFT Positions` })

      return tx.hash
    },
    [addTransactionWithType, contract],
  )

  const stake = useCallback(
    async (pid: BigNumber, nftIds: BigNumber[], liqs: BigNumber[]) => {
      if (!contract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }

      const estimateGas = await contract.estimateGas.join(pid, nftIds, liqs)
      const tx = await contract.join(pid, nftIds, liqs, {
        gasLimit: calculateGasMargin(estimateGas),
      })
      addTransactionWithType(tx, { type: 'Stake', summary: `${nftIds.length} NFT Positions` })

      return tx.hash
    },
    [addTransactionWithType, contract],
  )

  const unstake = useCallback(
    async (pid: BigNumber, nftIds: BigNumber[], liqs: BigNumber[]) => {
      if (!contract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }

      const estimateGas = await contract.estimateGas.exit(pid, nftIds, liqs)
      const tx = await contract.exit(pid, nftIds, liqs, {
        gasLimit: calculateGasMargin(estimateGas),
      })
      addTransactionWithType(tx, { type: 'Unstake', summary: `${nftIds.length} NFT Positions` })

      return tx.hash
    },
    [addTransactionWithType, contract],
  )

  return { deposit, withdraw, approve, stake, unstake }
}
