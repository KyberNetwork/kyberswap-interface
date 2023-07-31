import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import axios from 'axios'
import { BigNumber } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocalStorage } from 'react-use'
import useSWR from 'swr'
import useSWRImmutable from 'swr/immutable'

import { NotificationType } from 'components/Announcement/type'
import DaoABI from 'constants/abis/kyberdao/dao.json'
import MigrateABI from 'constants/abis/kyberdao/migrate.json'
import RewardDistributorABI from 'constants/abis/kyberdao/reward_distributor.json'
import StakingABI from 'constants/abis/kyberdao/staking.json'
import { didUserReject } from 'constants/connectors/utils'
import { REWARD_SERVICE_API } from 'constants/env'
import { CONTRACT_NOT_FOUND_MSG } from 'constants/messages'
import { NETWORKS_INFO, SUPPORTED_NETWORKS, isEVM } from 'constants/networks'
import ethereumInfo from 'constants/networks/ethereum'
import { EVMNetworkInfo } from 'constants/networks/type'
import { KNC } from 'constants/tokens'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useContract, useContractForReading, useTokenContractForReading } from 'hooks/useContract'
import useTokenBalance from 'hooks/useTokenBalance'
import { KNCUtilityTabs } from 'pages/KyberDAO/KNCUtility/type'
import { useNotify } from 'state/application/hooks'
import { useSingleCallResult } from 'state/multicall/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { calculateGasMargin } from 'utils'
import { aggregateValue } from 'utils/array'
import { formatWalletErrorMessage } from 'utils/errorMessage'
import { formatUnitsToFixed } from 'utils/formatBalance'
import { sendEVMTransaction } from 'utils/sendTransaction'

import {
  EligibleTxsInfo,
  GasRefundTierInfo,
  ProposalDetail,
  ProposalStatus,
  RewardInfo,
  RewardStats,
  StakerAction,
  StakerInfo,
  VoteInfo,
} from './types'

export function isSupportKyberDao(chainId: ChainId) {
  return isEVM(chainId) && SUPPORTED_NETWORKS.includes(chainId) && NETWORKS_INFO[chainId].kyberDAO
}

export function useKyberDAOInfo() {
  const { chainId, networkInfo } = useActiveWeb3React()
  const kyberDaoInfo = (isSupportKyberDao(chainId) ? (networkInfo as EVMNetworkInfo) : ethereumInfo).kyberDAO
  return kyberDaoInfo
}

export function useKyberDaoStakeActions() {
  const addTransactionWithType = useTransactionAdder()
  const kyberDaoInfo = useKyberDAOInfo()
  const stakingContract = useContract(kyberDaoInfo?.staking, StakingABI)
  const migrateContract = useContract(kyberDaoInfo?.KNCAddress, MigrateABI)

  const stake = useCallback(
    async (amount: BigNumber, votingPower: string) => {
      if (!stakingContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }
      try {
        const estimateGas = await stakingContract.estimateGas.deposit(amount)
        const tx = await stakingContract.deposit(amount, {
          gasLimit: calculateGasMargin(estimateGas),
        })
        addTransactionWithType({
          hash: tx.hash,
          type: TRANSACTION_TYPE.KYBERDAO_STAKE,
          extraInfo: {
            tokenSymbol: 'KNC',
            tokenAddress: kyberDaoInfo?.KNCAddress ?? '',
            tokenAmount: formatUnits(amount),
            arbitrary: { amount: formatUnits(amount), votingPower },
          },
        })
        return tx.hash
      } catch (error) {
        if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
          throw new Error('Transaction rejected.')
        } else {
          throw error
        }
      }
    },
    [addTransactionWithType, stakingContract, kyberDaoInfo],
  )
  const unstake = useCallback(
    async (amount: BigNumber) => {
      if (!stakingContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }
      try {
        const estimateGas = await stakingContract.estimateGas.withdraw(amount)
        const tx = await stakingContract.withdraw(amount, {
          gasLimit: calculateGasMargin(estimateGas),
        })
        addTransactionWithType({
          hash: tx.hash,
          type: TRANSACTION_TYPE.KYBERDAO_UNSTAKE,
          extraInfo: {
            tokenSymbol: 'KNC',
            tokenAddress: kyberDaoInfo?.KNCAddress ?? '',
            tokenAmount: formatUnits(amount),
            arbitrary: { amount: formatUnits(amount) },
          },
        })
        return tx.hash
      } catch (error) {
        if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
          throw new Error('Transaction rejected.')
        } else {
          throw error
        }
      }
    },
    [addTransactionWithType, stakingContract, kyberDaoInfo?.KNCAddress],
  )
  const migrate = useCallback(
    async (amount: BigNumber, rawAmount: string) => {
      if (!migrateContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }
      try {
        const estimateGas = await migrateContract.estimateGas.mintWithOldKnc(amount)
        const tx = await migrateContract.mintWithOldKnc(amount, {
          gasLimit: calculateGasMargin(estimateGas),
        })
        addTransactionWithType({
          hash: tx.hash,
          type: TRANSACTION_TYPE.KYBERDAO_MIGRATE,
          extraInfo: kyberDaoInfo
            ? {
                tokenAddressIn: kyberDaoInfo.KNCLAddress,
                tokenAddressOut: kyberDaoInfo.KNCAddress,
                tokenAmountIn: rawAmount,
                tokenAmountOut: rawAmount,
                tokenSymbolIn: 'KNCL',
                tokenSymbolOut: 'KNC',
              }
            : undefined,
        })
        return tx.hash
      } catch (error) {
        if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
          throw new Error('Transaction rejected.')
        } else {
          throw error
        }
      }
    },
    [addTransactionWithType, migrateContract, kyberDaoInfo],
  )
  const delegate = useCallback(
    async (address: string) => {
      if (!stakingContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }
      try {
        const estimateGas = await stakingContract.estimateGas.delegate(address)
        const tx = await stakingContract.delegate(address, {
          gasLimit: calculateGasMargin(estimateGas),
        })
        addTransactionWithType({
          hash: tx.hash,
          type: TRANSACTION_TYPE.KYBERDAO_DELEGATE,
          extraInfo: { contract: address },
        })
        return tx.hash
      } catch (error) {
        if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
          throw new Error('Transaction rejected.')
        } else {
          throw error
        }
      }
    },
    [addTransactionWithType, stakingContract],
  )
  const undelegate = useCallback(
    // address here alway should be user's address
    async (address: string) => {
      if (!stakingContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }
      try {
        const estimateGas = await stakingContract.estimateGas.delegate(address)
        const tx = await stakingContract.delegate(address, {
          gasLimit: calculateGasMargin(estimateGas),
        })
        addTransactionWithType({
          hash: tx.hash,
          type: TRANSACTION_TYPE.KYBERDAO_UNDELEGATE,
          extraInfo: { contract: address },
        })
        return tx.hash
      } catch (error) {
        if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
          throw new Error('Transaction rejected.')
        } else {
          throw error
        }
      }
    },
    [addTransactionWithType, stakingContract],
  )

  return { stake, unstake, migrate, delegate, undelegate }
}

export function useClaimVotingRewards() {
  const { account } = useActiveWeb3React()
  const { userRewards, remainingCumulativeAmount } = useVotingInfo()
  const kyberDaoInfo = useKyberDAOInfo()
  const rewardDistributorContract = useContract(kyberDaoInfo?.rewardsDistributor, RewardDistributorABI)
  const addTransactionWithType = useTransactionAdder()

  const claimVotingRewards = useCallback(async () => {
    if (!userRewards || !userRewards.userReward || !account) throw new Error(t`Invalid claim`)
    const { cycle, userReward } = userRewards
    const { index, tokens, cumulativeAmounts, proof } = userReward
    const address = account
    const merkleProof = proof
    const formatAmount = formatUnitsToFixed(remainingCumulativeAmount)

    if (!rewardDistributorContract) {
      throw new Error(CONTRACT_NOT_FOUND_MSG)
    }
    try {
      const isValidClaim = await rewardDistributorContract.isValidClaim(
        cycle,
        index,
        address,
        tokens,
        cumulativeAmounts,
        merkleProof,
      )
      if (!isValidClaim) throw new Error(t`Invalid claim`)
      const estimateGas = await rewardDistributorContract.estimateGas.claim(
        cycle,
        index,
        address,
        tokens,
        cumulativeAmounts,
        merkleProof,
      )
      const tx = await rewardDistributorContract.claim(cycle, index, address, tokens, cumulativeAmounts, merkleProof, {
        gasLimit: calculateGasMargin(estimateGas),
      })
      addTransactionWithType({
        hash: tx.hash,
        type: TRANSACTION_TYPE.KYBERDAO_CLAIM,
        extraInfo: {
          contract: kyberDaoInfo?.rewardsDistributor,
          tokenAmount: formatAmount,
          tokenSymbol: 'KNC',
          tokenAddress: kyberDaoInfo?.KNCAddress,
        },
      })
      return tx.hash as string
    } catch (error) {
      if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
        throw new Error('Transaction rejected.')
      } else {
        throw error
      }
    }
  }, [
    userRewards,
    account,
    remainingCumulativeAmount,
    rewardDistributorContract,
    addTransactionWithType,
    kyberDaoInfo?.rewardsDistributor,
    kyberDaoInfo?.KNCAddress,
  ])
  return claimVotingRewards
}

export const useVotingActions = () => {
  const kyberDaoInfo = useKyberDAOInfo()
  const daoContract = useContract(kyberDaoInfo?.dao, DaoABI)
  const addTransactionWithType = useTransactionAdder()

  const vote = useCallback(
    async (campId: number, option: number) => {
      if (!daoContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }
      try {
        const estimateGas = await daoContract.estimateGas.submitVote(campId, option)
        const tx = await daoContract.submitVote(campId, option, {
          gasLimit: calculateGasMargin(estimateGas),
        })
        addTransactionWithType({
          hash: tx.hash,
          type: TRANSACTION_TYPE.KYBERDAO_VOTE,
          extraInfo: { contract: kyberDaoInfo?.dao },
        })
        return tx.hash
      } catch (error) {
        if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
          throw new Error('Transaction rejected.')
        } else {
          throw error
        }
      }
    },
    [daoContract, addTransactionWithType, kyberDaoInfo?.dao],
  )
  return { vote }
}

const fetcher = (url: string) => {
  return fetch(url)
    .then(res => res.json())
    .then(res => res.data)
}

export function useStakingInfo() {
  const { account } = useActiveWeb3React()
  const kyberDaoInfo = useKyberDAOInfo()
  const stakingContract = useContract(kyberDaoInfo?.staking, StakingABI)
  const kncContract = useTokenContractForReading(kyberDaoInfo?.KNCAddress, ChainId.MAINNET)
  const stakedBalance = useSingleCallResult(stakingContract, 'getLatestStakeBalance', [account ?? undefined])
  const delegatedAddress = useSingleCallResult(stakingContract, 'getLatestRepresentative', [account ?? undefined])
  const KNCBalance = useTokenBalance(kyberDaoInfo?.KNCAddress || '')
  const isDelegated = useMemo(() => {
    return delegatedAddress.result?.[0] && delegatedAddress.result?.[0] !== account
  }, [delegatedAddress, account])

  const { data: stakerActions } = useSWR<StakerAction[]>(
    account && kyberDaoInfo?.daoStatsApi + '/stakers/' + account + '/actions',
    fetcher,
  )

  const [totalSupply, setTotalSupply] = useState()
  useEffect(() => {
    kncContract
      ?.totalSupply()
      .then((res: any) => setTotalSupply(res))
      .catch((error: any) => console.error('Get KNC totalSupply error:', { error }))
  }, [kncContract])

  return {
    stakedBalance: stakedBalance.result?.[0] || 0,
    KNCBalance: KNCBalance.value || 0,
    delegatedAddress: delegatedAddress.result?.[0],
    isDelegated,
    stakerActions,
    totalMigratedKNC: totalSupply,
  }
}

export function useVotingInfo() {
  const { account } = useActiveWeb3React()
  const kyberDaoInfo = useKyberDAOInfo()
  const rewardsDistributorContract = useContractForReading(
    kyberDaoInfo?.rewardsDistributor,
    RewardDistributorABI,
    ChainId.MAINNET,
  )
  const { data: daoInfo } = useSWR(kyberDaoInfo?.daoStatsApi + '/dao-info', fetcher)
  const [localStoredDaoInfo, setLocalStoredDaoInfo] = useLocalStorage('kyberdao-daoInfo')
  const [merkleData, setMerkleData] = useState<any>()
  useEffect(() => {
    rewardsDistributorContract
      ?.getMerkleData?.()
      .then((res: any) => {
        setMerkleData(res)
      })
      .catch((err: any) => console.log(err))
  }, [rewardsDistributorContract])

  useEffect(() => {
    if (daoInfo) {
      setLocalStoredDaoInfo(daoInfo)
    }
  }, [daoInfo, setLocalStoredDaoInfo])

  const merkleDataFileUrl = useMemo(() => {
    if (!merkleData) return
    const cycle = parseInt(merkleData?.[0]?.toString())
    const merkleDataFileUrl = merkleData?.[2]
    if (!cycle || !merkleDataFileUrl) {
      return
    }
    return merkleDataFileUrl
  }, [merkleData])

  const { data: userRewards } = useSWRImmutable(
    account && merkleDataFileUrl ? { url: merkleDataFileUrl, address: account } : null,
    ({ url, address }) => {
      return fetch(url)
        .then(res => {
          return res.json()
        })
        .then(res => {
          res.userReward = address ? res.userRewards[address] : undefined
          delete res.userRewards
          return res
        })
    },
  )

  const [claimedRewardAmounts, setClaimedRewardAmounts] = useState<any>()
  useEffect(() => {
    if (!rewardsDistributorContract || !account || !userRewards?.userReward?.tokens) return

    rewardsDistributorContract
      ?.getClaimedAmounts?.(account, userRewards?.userReward?.tokens)
      .then((res: any) => setClaimedRewardAmounts(res))
      .catch((err: any) => console.log(err))
  }, [rewardsDistributorContract, account, userRewards?.userReward?.tokens])

  const remainingCumulativeAmount: BigNumber = useMemo(() => {
    if (!userRewards?.userReward?.tokens || !claimedRewardAmounts?.[0]) return BigNumber.from(0)
    return (
      userRewards?.userReward?.tokens?.map((_: string, index: number) => {
        const cummulativeAmount = userRewards.userReward?.cumulativeAmounts?.[index]
        if (cummulativeAmount) return BigNumber.from(0)
        return BigNumber.from(cummulativeAmount).sub(BigNumber.from(claimedRewardAmounts[0]))
      })[0] || BigNumber.from(0)
    )
  }, [claimedRewardAmounts, userRewards?.userReward])

  const { data: proposals } = useSWR<ProposalDetail[]>(
    kyberDaoInfo?.daoStatsApi + '/proposals',
    (url: string) =>
      fetch(url)
        .then(res => res.json())
        .then(res =>
          res.data.map((p: ProposalDetail) => {
            let mappedStatus
            switch (p.status) {
              case 'Succeeded':
              case 'Queued':
              case 'Finalized':
                mappedStatus = ProposalStatus.Approved
                break
              case 'Expired':
                mappedStatus = ProposalStatus.Failed
                break
              default:
                mappedStatus = p.status
                break
            }
            return { ...p, status: mappedStatus }
          }),
        ),
    {
      refreshInterval: 15000,
    },
  )

  const { data: stakerInfo } = useSWR<StakerInfo>(
    daoInfo?.current_epoch &&
      account &&
      kyberDaoInfo?.daoStatsApi + '/stakers/' + account + '?epoch=' + daoInfo?.current_epoch,
    fetcher,
  )
  const { data: stakerInfoNextEpoch } = useSWR<StakerInfo>(
    daoInfo?.current_epoch &&
      account &&
      kyberDaoInfo?.daoStatsApi + '/stakers/' + account + '?epoch=' + (parseFloat(daoInfo?.current_epoch) + 1),
    fetcher,
  )

  const calculateVotingPower = useCallback(
    (kncAmount: string, newStakingAmount?: string) => {
      if (!daoInfo?.total_staked) return '0'
      const totalStakedKNC = daoInfo?.total_staked
      if (parseFloat(totalStakedKNC) === 0) return '0'

      const votingPower =
        newStakingAmount && parseFloat(newStakingAmount) > 0
          ? ((parseFloat(kncAmount) + parseFloat(newStakingAmount)) / (totalStakedKNC + parseFloat(newStakingAmount))) *
            100
          : (parseFloat(kncAmount) / totalStakedKNC) * 100
      if (votingPower <= 0) return '0'
      if (votingPower < 0.000001) {
        return '0.000001'
      } else {
        return parseFloat(votingPower.toPrecision(3)).toString()
      }
    },
    [daoInfo],
  )

  const { data: votesInfo } = useSWR<VoteInfo[]>(
    account ? kyberDaoInfo?.daoStatsApi + '/stakers/' + account + '/votes' : null,
    fetcher,
  )

  const { data: rewardStats } = useSWR<RewardStats>(kyberDaoInfo?.daoStatsApi + '/api/v1/reward-stats', url =>
    fetcher(url).then(res => res.rewardStats),
  )

  const result = {
    daoInfo: daoInfo || localStoredDaoInfo || undefined,
    userRewards,
    calculateVotingPower,
    proposals,
    userReward: userRewards?.userReward,
    remainingCumulativeAmount,
    claimedRewardAmount: claimedRewardAmounts?.[0] ? BigNumber.from(claimedRewardAmounts[0]) : BigNumber.from(0),
    stakerInfo,
    stakerInfoNextEpoch,
    votesInfo,
    rewardStats: {
      knc: rewardStats ? +rewardStats.pending?.totalAmountInKNC + +rewardStats.liquidated?.totalAmountInKNC : 0,
      usd: rewardStats ? +rewardStats.pending?.totalAmountInUSD + +rewardStats.liquidated?.totalAmountInUSD : 0,
    },
  }
  return result
}

export function useGasRefundTier(): GasRefundTierInfo {
  const { account, chainId } = useActiveWeb3React()
  const kyberDaoInfo = useKyberDAOInfo()

  const { data } = useSWR<GasRefundTierInfo>(
    account && isSupportKyberDao(chainId) && kyberDaoInfo?.daoStatsApi + '/api/v1/stakers/' + account + '/refund-info',
    url => fetcher(url).then(res => res.refundInfo),
  )

  return data || { userTier: 0, gasRefundPerCentage: 0 }
}

export function useGasRefundInfo({ rewardStatus = KNCUtilityTabs.Available }: { rewardStatus?: KNCUtilityTabs }): {
  reward: RewardInfo | undefined
  claimableReward: RewardInfo | undefined
  totalReward: {
    usd: number
    knc: number
  }
  refetch: () => void
} {
  const { account, chainId } = useActiveWeb3React()
  const kyberDaoInfo = useKyberDAOInfo()

  const { data: claimableReward, mutate: mutate0 } = useSWR<RewardInfo>(
    account &&
      isSupportKyberDao(chainId) &&
      kyberDaoInfo?.daoStatsApi + '/api/v1/stakers/' + account + '/refunds/total?rewardStatus=claimable',
    url =>
      fetcher(url)
        .then(res => res.total)
        .then(({ knc, usd }) => ({ knc: parseFloat(knc), usd: parseFloat(usd) })),
  )
  const { data: pendingReward, mutate: mutate1 } = useSWR<RewardInfo>(
    account &&
      isSupportKyberDao(chainId) &&
      kyberDaoInfo?.daoStatsApi + '/api/v1/stakers/' + account + '/refunds/total?rewardStatus=pending',
    url =>
      fetcher(url)
        .then(res => res.total)
        .then(({ knc, usd }) => ({ knc: parseFloat(knc), usd: parseFloat(usd) })),
  )
  const { data: claimedReward, mutate: mutate2 } = useSWR<RewardInfo>(
    account &&
      isSupportKyberDao(chainId) &&
      kyberDaoInfo?.daoStatsApi + '/api/v1/stakers/' + account + '/refunds/total?rewardStatus=claimed',
    url =>
      fetcher(url)
        .then(res => res.total)
        .then(({ knc, usd }) => ({ knc: parseFloat(knc), usd: parseFloat(usd) })),
  )

  const refetch = useCallback(() => {
    mutate0()
    mutate1()
    mutate2()
  }, [mutate0, mutate1, mutate2])

  return {
    reward:
      rewardStatus === KNCUtilityTabs.Available
        ? claimableReward
        : rewardStatus === KNCUtilityTabs.Pending
        ? pendingReward
        : rewardStatus === KNCUtilityTabs.Claimed
        ? claimedReward
        : undefined,
    claimableReward,
    totalReward: {
      usd: aggregateValue([claimableReward, pendingReward, claimedReward], 'usd'),
      knc: aggregateValue([claimableReward, pendingReward, claimedReward], 'knc'),
    },
    refetch,
  }
}

export function useClaimGasRefundRewards() {
  const { account, chainId } = useActiveWeb3React()
  const { library, connector } = useWeb3React()
  const addTransactionWithType = useTransactionAdder()
  const { claimableReward, refetch } = useGasRefundInfo({})
  const notify = useNotify()

  const claimGasRefundRewards = useCallback(async (): Promise<string> => {
    if (!account || !library || !claimableReward || claimableReward.knc <= 0) throw new Error(t`Invalid claim`)
    refetch()

    const url = REWARD_SERVICE_API + '/rewards/claim'
    const data = {
      wallet: account,
      chainId: chainId.toString(),
      clientCode: 'gas-refund',
      ref: '',
    }
    let response: any
    try {
      response = await axios({ method: 'POST', url, data })
      if (response?.data?.code !== 200000) throw new Error(response?.data?.message)
    } catch (error) {
      console.error('Claim error:', { error })
      notify({
        title: t`Claim Error`,
        summary: error?.response?.data?.message || error?.message || t`Unknown error`,
        type: NotificationType.ERROR,
      })
      throw error
    }

    const rewardContractAddress = response.data.data.ContractAddress
    const encodedData = response.data.data.EncodedData
    try {
      const tx = await sendEVMTransaction(account, library, rewardContractAddress, encodedData, BigNumber.from(0))
      if (!tx) throw new Error()
      addTransactionWithType({
        hash: tx.hash,
        type: TRANSACTION_TYPE.KYBERDAO_CLAIM_GAS_REFUND,
        extraInfo: {
          tokenAddress: KNC[chainId].address,
          tokenAmount: claimableReward.knc.toString(),
          tokenSymbol: 'KNC',
        },
      })
      refetch()
      return tx.hash as string
    } catch (error) {
      refetch()
      if (didUserReject(connector, error)) {
        notify({
          title: t`Transaction rejected`,
          summary: t`In order to claim, you must accept in your wallet.`,
          type: NotificationType.ERROR,
        })
        throw new Error('Transaction rejected.')
      } else {
        const message = formatWalletErrorMessage(error)
        console.error('Claim error:', { error, message })
        notify({
          title: t`Claim Error`,
          summary: message,
          type: NotificationType.ERROR,
        })
        throw error
      }
    }
  }, [account, addTransactionWithType, chainId, claimableReward, library, notify, connector, refetch])
  return claimGasRefundRewards
}

export const useEligibleTransactions = (page = 1, pageSize = 100): EligibleTxsInfo | undefined => {
  const { account, chainId } = useActiveWeb3React()
  const kyberDaoInfo = useKyberDAOInfo()

  const { data: eligibleTransactions } = useSWR<EligibleTxsInfo>(
    account &&
      isSupportKyberDao(chainId) &&
      kyberDaoInfo?.daoStatsApi +
        '/api/v1/stakers/' +
        account +
        `/refunds/eligible-transactions?pageSize=${pageSize}&page=${page}`,
    fetcher,
  )

  return eligibleTransactions
}

export function useProposalInfoById(id?: number): { proposalInfo?: ProposalDetail } {
  const kyberDaoInfo = useKyberDAOInfo()
  const { data } = useSWRImmutable(
    id !== undefined ? kyberDaoInfo?.daoStatsApi + '/proposals/' + id : undefined,
    fetcher,
    { refreshInterval: 15000 },
  )
  return { proposalInfo: data }
}
