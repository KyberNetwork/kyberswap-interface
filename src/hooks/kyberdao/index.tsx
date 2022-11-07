import { BigNumber } from 'ethers'
import { useCallback } from 'react'

import MigrateABI from 'constants/abis/kyberdao/migrate.json'
import StakingABI from 'constants/abis/kyberdao/staking.json'
import { KNCL_ADDRESS, KNC_ADDRESS } from 'constants/index'
import { CONTRACT_NOT_FOUND_MSG } from 'constants/messages'
import { useActiveWeb3React } from 'hooks'
import { useContract } from 'hooks/useContract'
import useTokenBalance from 'hooks/useTokenBalance'
import { useSingleCallResult } from 'state/multicall/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { calculateGasMargin } from 'utils'

const KYBERDAO_ADDRESSES = {
  STAKING: '0xeadb96F1623176144EBa2B24e35325220972b3bD',
  DAO: '0x7Ec8FcC26bE7e9E85B57E73083E5Fe0550d8A7fE',
  REWARDS_DISTRIBUTOR: '0x5ec0dcf4f6f55f28550c70b854082993fdc0d3b2',
}
export function useStakingInfo() {
  const { account } = useActiveWeb3React()
  const stakingContract = useContract(KYBERDAO_ADDRESSES.STAKING, StakingABI)

  const stakedBalance = useSingleCallResult(stakingContract, 'getLatestStakeBalance', [account ?? undefined])
  const KNCBalance = useTokenBalance(KNC_ADDRESS)
  return { stakedBalance: stakedBalance.result?.[0], KNCBalance }
}

export function useKyberDaoStakeActions() {
  const addTransactionWithType = useTransactionAdder()
  const stakingContract = useContract(KYBERDAO_ADDRESSES.STAKING, StakingABI)
  const migrateContract = useContract(KNC_ADDRESS, MigrateABI)

  const stake = useCallback(
    async (amount: BigNumber) => {
      if (!stakingContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }
      try {
        const estimateGas = await stakingContract.estimateGas.deposit(amount)
        const tx = await stakingContract.deposit(amount, {
          gasLimit: calculateGasMargin(estimateGas),
        })
        addTransactionWithType(tx, { type: 'Stake', summary: `KyberDAO` })
        return tx.hash
      } catch (error) {
        console.log('Stake error:', error.message)
      }
    },
    [addTransactionWithType, stakingContract],
  )
  const unstake = useCallback(
    async (amount: BigNumber) => {
      if (!stakingContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }
      const estimateGas = await stakingContract.estimateGas.delegate(amount)
      const tx = await stakingContract.withdraw(amount, {
        gasLimit: calculateGasMargin(estimateGas),
      })
      addTransactionWithType(tx, { type: 'Unstake', summary: `KyberDAO` })
      return tx.hash
    },
    [addTransactionWithType, stakingContract],
  )
  const migrate = useCallback(
    async (amount: BigNumber) => {
      if (!migrateContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }
      try {
        const estimateGas = await migrateContract.estimateGas.mintWithOldKnc(amount)
        const tx = await migrateContract.mintWithOldKnc(amount, {
          gasLimit: calculateGasMargin(estimateGas),
        })
        addTransactionWithType(tx, { type: 'Unstake', summary: `KyberDAO` })
        return tx.hash
      } catch (error) {
        console.log('Migrate error: ', error.message)
      }
    },
    [addTransactionWithType, migrateContract],
  )
  const delegate = useCallback(
    async (address: string) => {
      if (!stakingContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }
      const estimateGas = await stakingContract.estimateGas.delegate(address)
      const tx = await stakingContract.delegate(address, {
        gasLimit: calculateGasMargin(estimateGas),
      })
      addTransactionWithType(tx, { type: 'Unstake', summary: `KyberDAO` })
      return tx.hash
    },
    [addTransactionWithType, stakingContract],
  )
  return { stake, unstake, migrate }
}
