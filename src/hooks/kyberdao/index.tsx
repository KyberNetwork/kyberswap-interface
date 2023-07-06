import { ChainId } from '@kyberswap/ks-sdk-core'
import { BigNumber } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocalStorage } from 'react-use'
import useSWR from 'swr'
import useSWRImmutable from 'swr/immutable'

import DaoABI from 'constants/abis/kyberdao/dao.json'
import MigrateABI from 'constants/abis/kyberdao/migrate.json'
import RewardDistributorABI from 'constants/abis/kyberdao/reward_distributor.json'
import StakingABI from 'constants/abis/kyberdao/staking.json'
import { CONTRACT_NOT_FOUND_MSG } from 'constants/messages'
import { NETWORKS_INFO, NETWORKS_INFO_CONFIG, isEVM } from 'constants/networks'
import { EVMNetworkInfo } from 'constants/networks/type'
import { useActiveWeb3React } from 'hooks'
import { useContract, useContractForReading, useTokenContractForReading } from 'hooks/useContract'
import useTokenBalance from 'hooks/useTokenBalance'
import { KNCUtilityTabs } from 'pages/KyberDAO/KNCUtility/type'
import { useSingleCallResult } from 'state/multicall/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { calculateGasMargin } from 'utils'

import {
  EligibleTxsInfo,
  GasRefundTierInfo,
  ProposalDetail,
  ProposalStatus,
  RewardInfo,
  RewardStats,
  StakerAction,
  StakerInfo,
  TransactionInfo,
  VoteInfo,
} from './types'

export function isSupportKyberDao(chainId: ChainId) {
  return isEVM(chainId) && (NETWORKS_INFO_CONFIG[chainId] as EVMNetworkInfo).kyberDAO
}

export function useKyberDAOInfo() {
  const { chainId } = useActiveWeb3React()
  const kyberDaoInfo = NETWORKS_INFO[chainId !== ChainId.GÖRLI ? ChainId.MAINNET : ChainId.GÖRLI].kyberDAO
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

export function useClaimRewardActions() {
  const kyberDaoInfo = useKyberDAOInfo()
  const rewardDistributorContract = useContract(kyberDaoInfo?.rewardsDistributor, RewardDistributorABI)
  const addTransactionWithType = useTransactionAdder()

  const claim = useCallback(
    async ({
      cycle,
      index,
      address,
      tokens,
      cumulativeAmounts,
      merkleProof,
      formatAmount,
    }: {
      cycle: number
      index: number
      address: string
      tokens: string[]
      cumulativeAmounts: string[]
      merkleProof: string[]
      formatAmount: string
    }) => {
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
        if (!isValidClaim) {
          throw new Error('Invalid claim')
        }
        const estimateGas = await rewardDistributorContract.estimateGas.claim(
          cycle,
          index,
          address,
          tokens,
          cumulativeAmounts,
          merkleProof,
        )
        const tx = await rewardDistributorContract.claim(
          cycle,
          index,
          address,
          tokens,
          cumulativeAmounts,
          merkleProof,
          {
            gasLimit: calculateGasMargin(estimateGas),
          },
        )
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
        return tx.hash
      } catch (error) {
        if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
          throw new Error('Transaction rejected.')
        } else {
          throw error
        }
      }
    },
    [rewardDistributorContract, addTransactionWithType, kyberDaoInfo],
  )
  return { claim }
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
      .catch((err: any) => console.log(err))
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
        const cummulativeAmount =
          userRewards.userReward &&
          userRewards.userReward.cumulativeAmounts &&
          userRewards.userReward.cumulativeAmounts[index]

        if (!cummulativeAmount) {
          return BigNumber.from(0)
        }

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

  return {
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
}

const aggregateValue = <T extends string>(
  values: ({ [key in T]: string | number } | undefined)[],
  field: T,
): number => {
  return values.reduce((acc, cur) => {
    const value = cur?.[field] ?? 0
    return (typeof value === 'number' ? value : parseFloat(value)) + acc
  }, 0)
}

export function useGasRefundTier(): GasRefundTierInfo {
  const { account } = useActiveWeb3React()
  const kyberDaoInfo = useKyberDAOInfo()

  const { data } = useSWR<GasRefundTierInfo>(
    account && kyberDaoInfo?.daoStatsApi + '/api/v1/stakers/' + account + '/refund-info',
    url => fetcher(url).then(res => res.refundInfo),
  )

  return data || { userTier: 0, gasRefundPerCentage: 0 }
}

export function useGasRefundInfo({ rewardStatus = KNCUtilityTabs.Available }: { rewardStatus?: KNCUtilityTabs }) {
  const { account } = useActiveWeb3React()
  const kyberDaoInfo = useKyberDAOInfo()

  const { data: claimableReward } = useSWR<RewardInfo>(
    account && kyberDaoInfo?.daoStatsApi + '/api/v1/stakers/' + account + '/refunds/total?rewardStatus=claimable',
    url =>
      fetcher(url)
        .then(res => res.total)
        .then(({ knc, usd }) => ({ knc: parseFloat(knc), usd: parseFloat(usd) })),
  )
  const { data: pendingReward } = useSWR<RewardInfo>(
    account && kyberDaoInfo?.daoStatsApi + '/api/v1/stakers/' + account + '/refunds/total?rewardStatus=pending',
    url =>
      fetcher(url)
        .then(res => res.total)
        .then(({ knc, usd }) => ({ knc: parseFloat(knc), usd: parseFloat(usd) })),
  )
  const { data: claimedReward } = useSWR<RewardInfo>(
    account && kyberDaoInfo?.daoStatsApi + '/api/v1/stakers/' + account + '/refunds/total?rewardStatus=claimed',
    url =>
      fetcher(url)
        .then(res => res.total)
        .then(({ knc, usd }) => ({ knc: parseFloat(knc), usd: parseFloat(usd) })),
  )
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
  }
}

export const useEligibleTransactions = (page = 1, pageSize = 100): EligibleTxsInfo | undefined => {
  const { account } = useActiveWeb3React()
  const kyberDaoInfo = useKyberDAOInfo()

  const { data: eligibleTransactions } = useSWR<EligibleTxsInfo>(
    account &&
      kyberDaoInfo?.daoStatsApi +
        '/api/v1/stakers/' +
        account +
        `/refunds/eligible-transactions?pageSize=${pageSize}&page=${page}`,
    fetcher,
  )
  const mockData = null
  // { // todo namgold: rm this
  //   transactions: [
  //     {
  //       tx: '0x3c2da10bfa8eb91392af39017a3a9ae2ce4a6389b8179f72a13a33a3a09aa17b',
  //       timestamp: 1688464079,
  //       gasRefundInKNC: '2.0049242244407566',
  //       gasRefundInUSD: '1.1380751867615510496',
  //       gasFeeInUSD: '5.690375933807755248',
  //       gasFeeInNativeToken: '0.0029110355919948',
  //       epoch: 58,
  //       userTier: 3,
  //       gasRefundPerCentage: '0.2',
  //       userWallet: '0xa2dfeb674d997b68ec5adb0a6fb9136bd45c2d2d',
  //     },
  //     {
  //       tx: '0x337281cda0e96ac85763006ab93ceeb1bade9e28508ede29c9069127f8ccf9ab',
  //       timestamp: 1688441807,
  //       gasRefundInKNC: '1.0175163053595487',
  //       gasRefundInUSD: '0.5842059692058795312',
  //       gasFeeInUSD: '5.842059692058795312',
  //       gasFeeInNativeToken: '0.0029852424102744',
  //       epoch: 57,
  //       userTier: 1,
  //       gasRefundPerCentage: '0.1',
  //       userWallet: '0xa2dfeb674d997b68ec5adb0a6fb9136bd45c2d2d',
  //     },
  //     {
  //       tx: '0x1f83b77c1f89027ce5521c3edf9a5468ccc3044cef13251d522102842299463f',
  //       timestamp: 1688441339,
  //       gasRefundInKNC: '1.9452476443758978',
  //       gasRefundInUSD: '1.1168619897707773384',
  //       gasFeeInUSD: '5.584309948853886692',
  //       gasFeeInNativeToken: '0.0028535345015554',
  //       epoch: 57,
  //       userTier: 3,
  //       gasRefundPerCentage: '0.2',
  //       userWallet: '0xa2dfeb674d997b68ec5adb0a6fb9136bd45c2d2d',
  //     },
  //     {
  //       tx: '0x10d45294d5eef72f154ee0169f9026d9f5cffd38d13b7fcd2d1aa08e024f9b67',
  //       timestamp: 1688441075,
  //       gasRefundInKNC: '1.6159547416511324',
  //       gasRefundInUSD: '0.927798798964256016',
  //       gasFeeInUSD: '6.18532532642837344',
  //       gasFeeInNativeToken: '0.003160648206128',
  //       epoch: 57,
  //       userTier: 2,
  //       gasRefundPerCentage: '0.15',
  //       userWallet: '0xa2dfeb674d997b68ec5adb0a6fb9136bd45c2d2d',
  //     },
  //     {
  //       tx: '0x310291331db3be611e53db1f16f4702ab9e7b3ee5d093c81a535d6097ce46810',
  //       timestamp: 1688440955,
  //       gasRefundInKNC: '1.8711979899166949',
  //       gasRefundInUSD: '1.0690303812233271369',
  //       gasFeeInUSD: '7.126869208155514246',
  //       gasFeeInNativeToken: '0.0036417690564827',
  //       epoch: 57,
  //       userTier: 2,
  //       gasRefundPerCentage: '0.15',
  //       userWallet: '0xa2dfeb674d997b68ec5adb0a6fb9136bd45c2d2d',
  //     },
  //     {
  //       tx: '0x4ceceb4a95fc07c7ea51b7f064d38abe584a3471dcd2d9fcc09e41b2873d4a14',
  //       timestamp: 1688439443,
  //       gasRefundInKNC: '1.4705842323759179',
  //       gasRefundInUSD: '0.8400918309239963826',
  //       gasFeeInUSD: '5.600612206159975884',
  //       gasFeeInNativeToken: '0.0028645727937068',
  //       epoch: 57,
  //       userTier: 2,
  //       gasRefundPerCentage: '0.15',
  //       userWallet: '0xa2dfeb674d997b68ec5adb0a6fb9136bd45c2d2d',
  //     },
  //   ],
  //   pagination: {
  //     totalOfPages: 10,
  //     currentPage: 1,
  //     pageSize: 20,
  //     hasMore: false,
  //   },
  // }
  return mockData || eligibleTransactions
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
