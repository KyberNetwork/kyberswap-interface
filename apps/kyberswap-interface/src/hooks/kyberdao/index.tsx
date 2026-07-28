import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { readContract } from '@wagmi/core'
import axios from 'axios'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocalStorage } from 'react-use'
import kyberDAOApi, {
  GasRefundTierInfo,
  RewardInfo,
  useGetGasRefundEligibleTxsInfoQuery,
  useGetGasRefundRewardInfoQuery,
  useGetGasRefundTierInfoQuery,
} from 'services/kyberDAO'

import { wagmiConfig } from 'components/Web3Provider'
import { DaoABI, ERC20_ABI, MigrateABI, RewardDistributorABI, StakingABI } from 'constants/abis'
import { REWARD_SERVICE_API } from 'constants/env'
import { NETWORKS_INFO, SUPPORTED_NETWORKS } from 'constants/networks'
import ethereumInfo from 'constants/networks/ethereum'
import { KNC } from 'constants/tokens'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { DaoInfo, EligibleTxsInfo } from 'hooks/kyberdao/types'
import { useReadingContract, useSigningContract, useTokenReadingContract } from 'hooks/useContract'
import useTokenBalance from 'hooks/useTokenBalance'
import { KNCUtilityTabs } from 'pages/KyberDAO/KNCUtility/type'
import { useSingleCallResult } from 'state/multicall/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { aggregateValue } from 'utils/array'
import { friendlyError } from 'utils/errorMessage'
import { formatUnitsToFixed } from 'utils/formatBalance'
import { sendEVMTransaction } from 'utils/sendTransaction'
import { ErrorName } from 'utils/transactionError'
import { Address, encodeFunctionData, formatUnits } from 'utils/viem'

const CONTRACT_NOT_FOUND_MSG = 'Contract not found! Please reload and try again.'

export function isSupportKyberDao(chainId: ChainId) {
  return SUPPORTED_NETWORKS.includes(chainId) && NETWORKS_INFO[chainId].kyberDAO
}

export function useKyberDAOInfo() {
  const { chainId, networkInfo } = useActiveWeb3React()
  const kyberDaoInfo = (isSupportKyberDao(chainId) ? networkInfo : ethereumInfo).kyberDAO
  return kyberDaoInfo
}

export function useKyberDaoStakeActions() {
  const { account, chainId, walletKey } = useActiveWeb3React()
  const { isSmartConnector } = useWeb3React()
  const addTransactionWithType = useTransactionAdder()
  const kyberDaoInfo = useKyberDAOInfo()
  const stakingContract = useSigningContract(kyberDaoInfo?.staking, StakingABI)
  const migrateContract = useSigningContract(kyberDaoInfo?.KNCAddress, MigrateABI)

  const stake = useCallback(
    async (amount: bigint, votingPower: string) => {
      if (!stakingContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }
      if (!account) throw new Error(CONTRACT_NOT_FOUND_MSG)
      try {
        const tx = await sendEVMTransaction({
          account,
          contractAddress: stakingContract.address,
          encodedData: encodeFunctionData({
            abi: StakingABI,
            functionName: 'deposit',
            args: [amount],
          }),
          value: 0n,
          errorInfo: { name: ErrorName.SwapError, wallet: walletKey },
          isSmartConnector,
          chainId,
        })
        if (tx?.hash) {
          addTransactionWithType({
            hash: tx.hash,
            type: TRANSACTION_TYPE.KYBERDAO_STAKE,
            extraInfo: {
              tokenSymbol: 'KNC',
              tokenAddress: kyberDaoInfo?.KNCAddress ?? '',
              tokenAmount: formatUnits(amount, 18),
              arbitrary: { amount: formatUnits(amount, 18), votingPower },
            },
          })
        }
        return tx?.hash
      } catch (error) {
        throw error
      }
    },
    [account, isSmartConnector, chainId, walletKey, addTransactionWithType, stakingContract, kyberDaoInfo],
  )
  const unstake = useCallback(
    async (amount: bigint) => {
      if (!stakingContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }
      if (!account) throw new Error(CONTRACT_NOT_FOUND_MSG)
      try {
        const tx = await sendEVMTransaction({
          account,
          contractAddress: stakingContract.address,
          encodedData: encodeFunctionData({
            abi: StakingABI,
            functionName: 'withdraw',
            args: [amount],
          }),
          value: 0n,
          errorInfo: { name: ErrorName.SwapError, wallet: walletKey },
          isSmartConnector,
          chainId,
        })
        if (tx?.hash) {
          addTransactionWithType({
            hash: tx.hash,
            type: TRANSACTION_TYPE.KYBERDAO_UNSTAKE,
            extraInfo: {
              tokenSymbol: 'KNC',
              tokenAddress: kyberDaoInfo?.KNCAddress ?? '',
              tokenAmount: formatUnits(amount, 18),
              arbitrary: { amount: formatUnits(amount, 18) },
            },
          })
        }
        return tx?.hash
      } catch (error) {
        throw error
      }
    },
    [account, isSmartConnector, chainId, walletKey, addTransactionWithType, stakingContract, kyberDaoInfo?.KNCAddress],
  )
  const migrate = useCallback(
    async (amount: bigint, rawAmount: string) => {
      if (!migrateContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }
      if (!account) throw new Error(CONTRACT_NOT_FOUND_MSG)
      try {
        const tx = await sendEVMTransaction({
          account,
          contractAddress: migrateContract.address,
          encodedData: encodeFunctionData({
            abi: MigrateABI,
            functionName: 'mintWithOldKnc',
            args: [amount],
          }),
          value: 0n,
          errorInfo: { name: ErrorName.SwapError, wallet: walletKey },
          isSmartConnector,
          chainId,
        })
        if (tx?.hash) {
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
        }
        return tx?.hash
      } catch (error) {
        throw error
      }
    },
    [account, isSmartConnector, chainId, walletKey, addTransactionWithType, migrateContract, kyberDaoInfo],
  )
  const delegate = useCallback(
    async (address: string) => {
      if (!stakingContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }
      if (!account) throw new Error(CONTRACT_NOT_FOUND_MSG)
      try {
        const tx = await sendEVMTransaction({
          account,
          contractAddress: stakingContract.address,
          encodedData: encodeFunctionData({
            abi: StakingABI,
            functionName: 'delegate',
            args: [address],
          }),
          value: 0n,
          errorInfo: { name: ErrorName.SwapError, wallet: walletKey },
          isSmartConnector,
          chainId,
        })
        if (tx?.hash) {
          addTransactionWithType({
            hash: tx.hash,
            type: TRANSACTION_TYPE.KYBERDAO_DELEGATE,
            extraInfo: { contract: address },
          })
        }
        return tx?.hash
      } catch (error) {
        throw error
      }
    },
    [account, isSmartConnector, chainId, walletKey, addTransactionWithType, stakingContract],
  )
  const undelegate = useCallback(
    // address here alway should be user's address
    async (address: string) => {
      if (!stakingContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }
      if (!account) throw new Error(CONTRACT_NOT_FOUND_MSG)
      try {
        const tx = await sendEVMTransaction({
          account,
          contractAddress: stakingContract.address,
          encodedData: encodeFunctionData({
            abi: StakingABI,
            functionName: 'delegate',
            args: [address],
          }),
          value: 0n,
          errorInfo: { name: ErrorName.SwapError, wallet: walletKey },
          isSmartConnector,
          chainId,
        })
        if (tx?.hash) {
          addTransactionWithType({
            hash: tx.hash,
            type: TRANSACTION_TYPE.KYBERDAO_UNDELEGATE,
            extraInfo: { contract: address },
          })
        }
        return tx?.hash
      } catch (error) {
        throw error
      }
    },
    [account, isSmartConnector, chainId, walletKey, addTransactionWithType, stakingContract],
  )

  return { stake, unstake, migrate, delegate, undelegate }
}

export function useClaimVotingRewards() {
  const { account, chainId, walletKey } = useActiveWeb3React()
  const { isSmartConnector } = useWeb3React()
  const { userRewards, remainingCumulativeAmount } = useVotingInfo()
  const kyberDaoInfo = useKyberDAOInfo()
  const rewardDistributorSigningContract = useSigningContract(kyberDaoInfo?.rewardsDistributor, RewardDistributorABI)
  const rewardDistributorReadingContract = useReadingContract(kyberDaoInfo?.rewardsDistributor, RewardDistributorABI)
  const addTransactionWithType = useTransactionAdder()

  const claimVotingRewards = useCallback(async () => {
    if (!userRewards || !userRewards.userReward || !account) throw new Error(t`Invalid claim`)
    const { cycle, userReward } = userRewards
    const { index, tokens, cumulativeAmounts, proof } = userReward
    const address = account
    const merkleProof = proof
    const formatAmount = formatUnitsToFixed(remainingCumulativeAmount)

    if (!rewardDistributorSigningContract || !rewardDistributorReadingContract) {
      throw new Error(CONTRACT_NOT_FOUND_MSG)
    }
    try {
      const isValidClaim = (await readContract(wagmiConfig, {
        address: rewardDistributorReadingContract.address as Address,
        abi: RewardDistributorABI,
        functionName: 'isValidClaim',
        args: [
          BigInt(cycle.toString()),
          BigInt(index.toString()),
          address,
          tokens,
          (cumulativeAmounts as Array<string | number | bigint>).map((v: string | number | bigint) =>
            BigInt(v.toString()),
          ),
          merkleProof,
        ],
        chainId: chainId as number,
      })) as boolean
      if (!isValidClaim) throw new Error(t`Invalid claim`)
      const tx = await sendEVMTransaction({
        account,
        contractAddress: rewardDistributorSigningContract.address,
        encodedData: encodeFunctionData({
          abi: RewardDistributorABI,
          functionName: 'claim',
          args: [
            BigInt(cycle.toString()),
            BigInt(index.toString()),
            address,
            tokens,
            (cumulativeAmounts as Array<string | number | bigint>).map((v: string | number | bigint) =>
              BigInt(v.toString()),
            ),
            merkleProof,
          ],
        }),
        value: 0n,
        errorInfo: { name: ErrorName.GasRefundClaimError, wallet: walletKey },
        isSmartConnector,
        chainId,
      })
      if (tx?.hash) {
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
      }
      return tx?.hash
    } catch (error) {
      throw error
    }
  }, [
    userRewards,
    account,
    isSmartConnector,
    chainId,
    walletKey,
    remainingCumulativeAmount,
    rewardDistributorSigningContract,
    rewardDistributorReadingContract,
    addTransactionWithType,
    kyberDaoInfo?.rewardsDistributor,
    kyberDaoInfo?.KNCAddress,
  ])
  return claimVotingRewards
}

export const useVotingActions = () => {
  const { account, chainId, walletKey } = useActiveWeb3React()
  const { isSmartConnector } = useWeb3React()
  const kyberDaoInfo = useKyberDAOInfo()
  const daoContract = useSigningContract(kyberDaoInfo?.dao, DaoABI)
  const addTransactionWithType = useTransactionAdder()

  const vote = useCallback(
    async (campId: number, option: number) => {
      if (!daoContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }
      if (!account) throw new Error(CONTRACT_NOT_FOUND_MSG)
      try {
        const tx = await sendEVMTransaction({
          account,
          contractAddress: daoContract.address,
          encodedData: encodeFunctionData({
            abi: DaoABI,
            functionName: 'submitVote',
            args: [BigInt(campId), BigInt(option)],
          }),
          value: 0n,
          errorInfo: { name: ErrorName.SwapError, wallet: walletKey },
          isSmartConnector,
          chainId,
        })
        if (tx?.hash) {
          addTransactionWithType({
            hash: tx.hash,
            type: TRANSACTION_TYPE.KYBERDAO_VOTE,
            extraInfo: { contract: kyberDaoInfo?.dao },
          })
        }
        return tx?.hash
      } catch (error) {
        throw error
      }
    },
    [account, isSmartConnector, chainId, walletKey, daoContract, addTransactionWithType, kyberDaoInfo?.dao],
  )
  return { vote }
}

export function useStakingInfo() {
  const { account } = useActiveWeb3React()
  const kyberDaoInfo = useKyberDAOInfo()
  const stakingContract = useReadingContract(kyberDaoInfo?.staking, StakingABI)
  const kncContract = useTokenReadingContract(kyberDaoInfo?.KNCAddress, ChainId.MAINNET)
  const stakedBalance = useSingleCallResult(stakingContract, 'getLatestStakeBalance', [account ?? undefined])
  const delegatedAddress = useSingleCallResult(stakingContract, 'getLatestRepresentative', [account ?? undefined])
  const KNCBalance = useTokenBalance(kyberDaoInfo?.KNCAddress || '')
  const isDelegated = useMemo(() => {
    return delegatedAddress.result?.[0] && delegatedAddress.result?.[0] !== account
  }, [delegatedAddress, account])

  const { data: stakerActions } = kyberDAOApi.useGetStakerActionsQuery({ account }, { skip: !account })

  const [totalSupply, setTotalSupply] = useState<bigint | undefined>()
  useEffect(() => {
    if (!kncContract) return
    readContract(wagmiConfig, {
      address: kncContract.address as Address,
      abi: ERC20_ABI,
      functionName: 'totalSupply',
      chainId: ChainId.MAINNET,
    })
      .then(res => setTotalSupply(res as bigint))
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
  const rewardsDistributorContract = useReadingContract(
    kyberDaoInfo?.rewardsDistributor,
    RewardDistributorABI,
    ChainId.MAINNET,
  )
  const { data: daoInfo } = kyberDAOApi.useGetDaoInfoQuery({})
  const [localStoredDaoInfo, setLocalStoredDaoInfo] = useLocalStorage<DaoInfo>('kyberdao-daoInfo')

  const [merkleData, setMerkleData] = useState<any>()
  useEffect(() => {
    if (!rewardsDistributorContract) return
    readContract(wagmiConfig, {
      address: rewardsDistributorContract.address as Address,
      abi: RewardDistributorABI,
      functionName: 'getMerkleData',
      chainId: ChainId.MAINNET,
    })
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

  const { data: userRewards } = kyberDAOApi.useGetUserRewardsQuery(
    { url: merkleDataFileUrl, account },
    { skip: !merkleDataFileUrl || !account },
  )

  const [claimedRewardAmounts, setClaimedRewardAmounts] = useState<any>()
  useEffect(() => {
    if (!rewardsDistributorContract || !account || !userRewards?.userReward?.tokens) return

    readContract(wagmiConfig, {
      address: rewardsDistributorContract.address as Address,
      abi: RewardDistributorABI,
      functionName: 'getClaimedAmounts',
      args: [account, userRewards?.userReward?.tokens],
      chainId: ChainId.MAINNET,
    })
      .then((res: any) => setClaimedRewardAmounts(res))
      .catch((err: any) => console.log(err))
  }, [rewardsDistributorContract, account, userRewards?.userReward?.tokens])

  const remainingCumulativeAmount: bigint = useMemo(() => {
    if (!userRewards?.userReward?.tokens || !claimedRewardAmounts?.[0]) return 0n
    return (
      userRewards?.userReward?.tokens?.map((_: string, index: number) => {
        const cummulativeAmount = userRewards.userReward?.cumulativeAmounts?.[index]
        if (!cummulativeAmount) return 0n
        return BigInt(cummulativeAmount.toString()) - BigInt(claimedRewardAmounts[0].toString())
      })[0] || 0n
    )
  }, [claimedRewardAmounts, userRewards?.userReward])

  const { data: proposals } = kyberDAOApi.useGetProposalsQuery({})

  const { data: stakerInfo } = kyberDAOApi.useGetStakerInfoQuery(
    { account, epoch: daoInfo?.current_epoch },
    { skip: !account || !daoInfo?.current_epoch },
  )

  const { data: stakerInfoNextEpoch } = kyberDAOApi.useGetStakerInfoQuery(
    { account, epoch: Number(daoInfo?.current_epoch) + 1 },
    { skip: !account || !daoInfo?.current_epoch },
  )

  const calculateVotingPower = useCallback(
    (kncAmount: string, newStakingAmount?: string) => {
      if (!daoInfo?.total_staked) return '0'
      const totalStakedKNC = daoInfo?.total_staked
      if (totalStakedKNC === 0) return '0'

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

  const { data: votesInfo } = kyberDAOApi.useGetStakerVotesQuery({ account }, { skip: !account })

  const { data: rewardStats } = kyberDAOApi.useGetRewardStatsQuery({})

  const result = {
    daoInfo: daoInfo || localStoredDaoInfo || undefined,
    userRewards,
    calculateVotingPower,
    proposals,
    userReward: userRewards?.userReward,
    remainingCumulativeAmount,
    claimedRewardAmount: claimedRewardAmounts?.[0] ? BigInt(claimedRewardAmounts[0].toString()) : 0n,
    stakerInfo,
    stakerInfoNextEpoch,
    votesInfo,
    rewardStats: {
      knc: rewardStats ? +rewardStats.pending?.totalAmountInKNC + +rewardStats.liquidated?.totalAmountInKNC : 0,
      usd: rewardStats ? +rewardStats.pending?.totalAmountInUSD + +rewardStats.liquidated?.totalAmountInUSD : 0,
      apr: rewardStats ? +rewardStats.apr : 0,
    },
  }
  return result
}

export function useGasRefundTier(): GasRefundTierInfo {
  const { account, chainId } = useActiveWeb3React()
  const skip = !account || !isSupportKyberDao(chainId)
  const { currentData } = useGetGasRefundTierInfoQuery(account || '', { skip })

  return {
    userTier: currentData?.userTier || 0,
    gasRefundPercentage: currentData?.gasRefundPercentage || 0,
  }
}

export function useRefetchGasRefundInfo(): () => void {
  const { account, chainId } = useActiveWeb3React()
  const skip = !account || !isSupportKyberDao(chainId)

  const { refetch: refetchClaimable } = kyberDAOApi.endpoints.getGasRefundRewardInfo.useQuerySubscription(
    { account: account || '', rewardStatus: 'claimable' },
    { skip },
  )
  const { refetch: refetchPending } = kyberDAOApi.endpoints.getGasRefundRewardInfo.useQuerySubscription(
    { account: account || '', rewardStatus: 'pending' },
    { skip },
  )
  const { refetch: refetchClaimed } = kyberDAOApi.endpoints.getGasRefundRewardInfo.useQuerySubscription(
    { account: account || '', rewardStatus: 'claimed' },
    { skip },
  )
  const refetch = useCallback(() => {
    try {
      refetchClaimable()
    } catch {}
    try {
      refetchPending()
    } catch {}
    try {
      refetchClaimed()
    } catch {}
  }, [refetchClaimable, refetchPending, refetchClaimed])

  return refetch
}

export function useGasRefundInfo({ rewardStatus = KNCUtilityTabs.Available }: { rewardStatus?: KNCUtilityTabs }): {
  reward: RewardInfo | undefined
  claimableReward: RewardInfo | undefined
  totalReward: {
    usd: number
    knc: number
  }
} {
  const { account, chainId } = useActiveWeb3React()
  const skip = !account || !isSupportKyberDao(chainId)
  const refetch = useRefetchGasRefundInfo()

  const { currentData: claimableReward } = useGetGasRefundRewardInfoQuery(
    { account: account || '', rewardStatus: 'claimable' },
    { skip, pollingInterval: 5000 },
  )

  const { currentData: pendingReward } = useGetGasRefundRewardInfoQuery(
    { account: account || '', rewardStatus: 'pending' },
    { skip },
  )

  const { currentData: claimedReward } = useGetGasRefundRewardInfoQuery(
    { account: account || '', rewardStatus: 'claimed' },
    { skip },
  )

  useEffect(() => {
    refetch()
  }, [claimableReward, refetch])

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

export function useClaimGasRefundRewards() {
  const { account, chainId, walletKey } = useActiveWeb3React()
  const { isSmartConnector } = useWeb3React()
  const addTransactionWithType = useTransactionAdder()
  const { claimableReward } = useGasRefundInfo({})
  const refetch = useRefetchGasRefundInfo()
  const rewardToken = KNC[chainId]

  const claimGasRefundRewards = useCallback(async (): Promise<string> => {
    if (!account || !claimableReward || claimableReward.knc <= 0 || !rewardToken) throw new Error(t`Invalid claim`)
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
      throw error
    }

    const rewardContractAddress = response.data.data.ContractAddress
    const encodedData = response.data.data.EncodedData
    try {
      const tx = await sendEVMTransaction({
        account,
        contractAddress: rewardContractAddress,
        isSmartConnector,
        encodedData,
        value: 0n,
        errorInfo: {
          name: ErrorName.GasRefundClaimError,
          wallet: walletKey,
        },
        chainId,
      })
      if (!tx) throw new Error()
      addTransactionWithType({
        hash: tx.hash,
        type: TRANSACTION_TYPE.KYBERDAO_CLAIM_GAS_REFUND,
        extraInfo: {
          tokenAddress: rewardToken.address,
          tokenAmount: claimableReward.knc.toString(),
          tokenSymbol: 'KNC',
        },
      })
      refetch()
      return tx.hash as string
    } catch (error) {
      refetch()
      const message = friendlyError(error)
      console.error('Claim error:', { message, error })
      throw error
    }
  }, [account, addTransactionWithType, chainId, claimableReward, refetch, rewardToken, walletKey, isSmartConnector])
  return claimGasRefundRewards
}

export const useEligibleTransactions = (page = 1, pageSize = 100): EligibleTxsInfo | undefined => {
  const { account, chainId } = useActiveWeb3React()
  const skip = !account || !isSupportKyberDao(chainId)
  const { data } = useGetGasRefundEligibleTxsInfoQuery({ account: account || '', page, pageSize }, { skip })

  return data?.data
}
