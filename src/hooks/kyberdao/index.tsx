import { t } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { useCallback, useMemo } from 'react'
import useSWR from 'swr'
import useSWRImmutable from 'swr/immutable'

import MigrateABI from 'constants/abis/kyberdao/migrate.json'
import RewardDistributorABI from 'constants/abis/kyberdao/reward_distributor.json'
import StakingABI from 'constants/abis/kyberdao/staking.json'
import { KNC_ADDRESS } from 'constants/index'
import { CONTRACT_NOT_FOUND_MSG } from 'constants/messages'
import { useActiveWeb3React } from 'hooks'
import { useContract } from 'hooks/useContract'
import useTokenBalance from 'hooks/useTokenBalance'
import { useSingleCallResult } from 'state/multicall/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { calculateGasMargin } from 'utils'

import { ProposalDetail } from './types'

//TODO Diep: Move this to ethereum.js
export const KYBERDAO_ADDRESSES = {
  STAKING: '0xeadb96F1623176144EBa2B24e35325220972b3bD',
  DAO: '0x7Ec8FcC26bE7e9E85B57E73083E5Fe0550d8A7fE',
  REWARDS_DISTRIBUTOR: '0x5ec0dcf4f6f55f28550c70b854082993fdc0d3b2',
}
export const APIS = {
  DAO: 'https://kyberswap-dao-stats.kyberengineering.io',
}
export function useStakingInfo() {
  const { account } = useActiveWeb3React()
  const stakingContract = useContract(KYBERDAO_ADDRESSES.STAKING, StakingABI)

  const stakedBalance = useSingleCallResult(stakingContract, 'getLatestStakeBalance', [account ?? undefined])
  const delegatedAccount = useSingleCallResult(stakingContract, 'getLatestRepresentative', [account ?? undefined])
  const KNCBalance = useTokenBalance(KNC_ADDRESS)
  const isDelegated = useMemo(() => {
    return delegatedAccount.result?.[0] && delegatedAccount.result?.[0] !== account
  }, [delegatedAccount, account])

  return {
    stakedBalance: stakedBalance.result?.[0],
    KNCBalance,
    delegatedAccount: delegatedAccount.result?.[0],
    isDelegated,
  }
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
        addTransactionWithType(tx, {
          type: 'KyberDAO Stake',
          summary: t`You have successfully staked to KyberDAO`,
          arbitrary: { amount: amount.div(BigNumber.from(10).pow(18)).toString() },
        })
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
      addTransactionWithType(tx, {
        type: 'KyberDAO Unstake',
        summary: t`You have successfully unstaked from KyberDAO`,
        arbitrary: { amount: amount.div(BigNumber.from(10).pow(18)).toString() },
      })
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
        addTransactionWithType(tx, { type: 'KyberDAO Migrate', summary: `KyberDAO` })
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
      addTransactionWithType(tx, {
        type: 'KyberDAO Delegate',
        summary: t`You have successfully delegated voting power to ${address.slice(0, 6)}...${address.slice(-4)}`,
      })
      return tx.hash
    },
    [addTransactionWithType, stakingContract],
  )
  const undelegate = useCallback(
    // address here alway should be user's address
    async (address: string) => {
      if (!stakingContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }
      const estimateGas = await stakingContract.estimateGas.delegate(address)
      const tx = await stakingContract.delegate(address, {
        gasLimit: calculateGasMargin(estimateGas),
      })
      addTransactionWithType(tx, {
        type: 'KyberDAO Undelegate',
        summary: t`You have successfully undelegated your voting power`,
      })
      return tx.hash
    },
    [addTransactionWithType, stakingContract],
  )
  return { stake, unstake, migrate, delegate, undelegate }
}

const fetcher = (url: string) => {
  return fetch(url)
    .then(res => res.json())
    .then(res => res.data)
}
export function useVotingInfo() {
  const rewardDistributorContract = useContract(KYBERDAO_ADDRESSES.REWARDS_DISTRIBUTOR, RewardDistributorABI)
  const { data: daoInfo } = useSWR(APIS.DAO + '/dao-info', fetcher)
  const merkleData = useSingleCallResult(rewardDistributorContract, 'getMerkleData')
  const merkleDataFileUrl = useMemo(() => {
    if (!merkleData) return
    const merkleDataRes = merkleData.result?.[0]
    const cycle = parseInt(merkleDataRes?.[0]?.toString())
    const merkleDataFileUrl = merkleDataRes?.[2]
    if (!cycle || !merkleDataFileUrl) {
      return
    }
    return merkleDataFileUrl
  }, [merkleData])
  const { data: userRewards } = useSWRImmutable(merkleDataFileUrl, (url: string) => {
    return fetch(url).then(res => res.json())
  })
  const { data: proposals } = useSWRImmutable<ProposalDetail[]>(APIS.DAO + '/proposals', fetcher)

  const calculateVotingPower = useCallback(
    (kncAmount: string) => {
      if (!daoInfo?.total_staked) return '0'
      const totalStakedKNC = daoInfo.total_staked
      const votingPower = (parseFloat(kncAmount) / totalStakedKNC) * 100
      if (votingPower === 0) return '0'
      if (votingPower < 0.000001) {
        return `~ 0.000001`
      } else {
        return parseFloat(votingPower.toFixed(7)).toString()
      }
    },
    [daoInfo],
  )
  return { daoInfo, userRewards, calculateVotingPower, proposals }
}

export function useProposalInfoById(id?: number): { proposalInfo?: ProposalDetail } {
  const { data } = useSWRImmutable(id !== undefined ? APIS.DAO + '/proposals/' + id : undefined, fetcher, {})
  return { proposalInfo: data }
}
