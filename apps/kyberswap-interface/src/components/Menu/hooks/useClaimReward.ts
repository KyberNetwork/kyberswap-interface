import { CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { skipToken } from '@reduxjs/toolkit/query'
import { readContract } from '@wagmi/core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import externalApi, { type ClaimReward, type ClaimRewardPhaseData } from 'services/externalApi'

import { wagmiConfig } from 'components/Web3Provider'
import { CLAIM_REWARD_ABI } from 'constants/abis'
import { NETWORKS_INFO } from 'constants/networks'
import { KNC } from 'constants/tokens'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useReadingContract, useSigningContract } from 'hooks/useContract'
import { useAllTransactions, useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { sendEVMTransaction } from 'utils/sendTransaction'
import { ErrorName } from 'utils/transactionError'
import { Address, encodeFunctionData } from 'utils/viem'

type UserReward = {
  phaseId: number
  tokens: string[]
  reward: ClaimReward | undefined
}

type UseClaimRewardParams = {
  enabled?: boolean
}

const getRewardAmounts = (reward?: ClaimReward) => (reward?.amounts ?? []).map((v: string) => BigInt(v))

const getClaimArgs = (userReward: UserReward, account: string) =>
  [
    BigInt(userReward.phaseId),
    BigInt(userReward.reward?.index ?? 0),
    account,
    userReward.tokens,
    getRewardAmounts(userReward.reward),
    userReward.reward?.proof ?? [],
  ] as [bigint, bigint, string, string[], bigint[], string[]]

const getClaimedAmountsArgs = (userReward: UserReward, account: string) =>
  [BigInt(userReward.phaseId || 0), account, userReward.tokens || []] as [bigint, string, string[]]

const getRemainingRewardAmount = (reward?: ClaimReward, claimedAmounts?: readonly bigint[]) => {
  const totalRewardAmount = BigInt(reward?.amounts[0] ?? '0')
  const claimedAmount = claimedAmounts?.[0] ?? 0n
  const remainingAmount = totalRewardAmount - claimedAmount

  return remainingAmount > 0n ? remainingAmount : 0n
}

const formatRewardAmount = (rewardToken: Token, amount: bigint) =>
  CurrencyAmount.fromRawAmount(rewardToken, amount.toString()).toSignificant(6)

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    return typeof message === 'string' ? message : undefined
  }

  return undefined
}

export const usePendingClaimRewardTx = () => {
  const allTransactions = useAllTransactions()

  return useMemo(() => {
    return Object.values(allTransactions ?? [])
      .flat()
      .some(item => item && item.type === TRANSACTION_TYPE.CLAIM_REWARD && !item.receipt)
  }, [allTransactions])
}

export const useClaimReward = ({ enabled = true }: UseClaimRewardParams = {}) => {
  const { chainId, account, walletKey } = useActiveWeb3React()
  const { isSmartConnector } = useWeb3React()
  const rewardContractAddress = enabled ? NETWORKS_INFO[chainId].classic.claimReward ?? undefined : undefined
  const rewardToken = KNC[chainId]
  const claimRewardsQueryArg = enabled && account && rewardContractAddress && rewardToken ? chainId : skipToken

  const rewardReadingContract = useReadingContract(rewardContractAddress, CLAIM_REWARD_ABI)
  const rewardSigningContract = useSigningContract(rewardContractAddress, CLAIM_REWARD_ABI)
  const { data } = externalApi.useGetClaimRewardsQuery(claimRewardsQueryArg)

  const userRewards: UserReward[] = useMemo(() => {
    if (!data || !Array.isArray(data) || !account) return []

    return data.map((phase: ClaimRewardPhaseData) => ({
      phaseId: phase.phaseId,
      tokens: phase.tokens,
      reward: phase.userRewards[account],
    }))
  }, [data, account])
  const hasRewardData = userRewards.some((phase: UserReward) => !!phase.reward)

  const [isUserHasReward, setIsUserHasReward] = useState(false)
  const [rewardAmounts, setRewardAmounts] = useState('0')
  const [error, setError] = useState<string | null>(null)
  const [selectedRewardIndex, setSelectedRewardIndex] = useState(0)
  const [attemptingTxn, setAttemptingTxn] = useState(false)
  const [txHash, setTxHash] = useState<string | undefined>(undefined)
  const selectedUserReward = userRewards[selectedRewardIndex]

  const addTransactionWithType = useTransactionAdder()
  const pendingTx = usePendingClaimRewardTx()
  const previousPendingTxRef = useRef(pendingTx)

  const updateRewardAmounts = useCallback(async () => {
    setRewardAmounts('0')
    setIsUserHasReward(enabled && hasRewardData && !!rewardToken)

    if (!enabled || !rewardReadingContract || !chainId || !account || !hasRewardData || !rewardToken) return

    for (const [index, userReward] of userRewards.entries()) {
      if (!userReward.reward) continue

      const claimedAmounts = (await readContract(wagmiConfig, {
        address: rewardReadingContract.address as Address,
        abi: CLAIM_REWARD_ABI,
        functionName: 'getClaimedAmounts',
        args: getClaimedAmountsArgs(userReward, account),
        chainId: chainId as number,
      })) as readonly bigint[]

      const remainingAmount = getRemainingRewardAmount(userReward.reward, claimedAmounts)
      setRewardAmounts(formatRewardAmount(rewardToken, remainingAmount))
      if (remainingAmount > 0n) {
        setSelectedRewardIndex(index)
        break
      }
    }
  }, [enabled, rewardReadingContract, chainId, account, hasRewardData, rewardToken, userRewards])

  useEffect(() => {
    setRewardAmounts('0')
    if (!enabled) {
      setIsUserHasReward(false)
      setSelectedRewardIndex(0)
      return
    }

    if (data && chainId && account) {
      updateRewardAmounts().catch(error => console.log(error))
    }
  }, [enabled, data, chainId, account, updateRewardAmounts])

  const resetTxn = useCallback(() => {
    setAttemptingTxn(false)
    setTxHash(undefined)
    updateRewardAmounts().catch(error => console.log(error))
    setError(null)
  }, [updateRewardAmounts])

  useEffect(() => {
    const wasPendingTx = previousPendingTxRef.current
    previousPendingTxRef.current = pendingTx

    if (enabled && wasPendingTx && !pendingTx) {
      resetTxn()
    }
  }, [enabled, pendingTx, resetTxn])

  const claimRewardsCallback = useCallback(async () => {
    if (!rewardSigningContract || !chainId || !account || !selectedUserReward?.reward || !rewardToken) return

    setAttemptingTxn(true)
    try {
      const claimArgs = getClaimArgs(selectedUserReward, account)
      const isValid = (await readContract(wagmiConfig, {
        address: rewardSigningContract.address as Address,
        abi: CLAIM_REWARD_ABI,
        functionName: 'isValidClaim',
        args: claimArgs,
        chainId: chainId as number,
      })) as boolean
      if (!isValid) throw new Error(t`Invalid claim`)

      const claimedAmounts = (await readContract(wagmiConfig, {
        address: rewardSigningContract.address as Address,
        abi: CLAIM_REWARD_ABI,
        functionName: 'getClaimedAmounts',
        args: getClaimedAmountsArgs(selectedUserReward, account),
        chainId: chainId as number,
      })) as readonly bigint[]
      if (!claimedAmounts) throw new Error()

      const remainingAmount = getRemainingRewardAmount(selectedUserReward.reward, claimedAmounts)
      if (remainingAmount === 0n) {
        setRewardAmounts('0')
        throw new Error(t`Insufficient reward amount available for claim!`)
      }

      const tx = await sendEVMTransaction({
        account,
        isSmartConnector,
        chainId,
        contractAddress: rewardSigningContract.address,
        encodedData: encodeFunctionData({
          abi: CLAIM_REWARD_ABI,
          functionName: 'claim',
          args: claimArgs,
        }),
        value: 0n,
        errorInfo: { name: ErrorName.GasRefundClaimError, wallet: walletKey },
      })
      if (!tx?.hash) throw new Error()

      setAttemptingTxn(false)
      setTxHash(tx.hash)
      addTransactionWithType({
        hash: tx.hash,
        type: TRANSACTION_TYPE.CLAIM_REWARD,
        extraInfo: {
          tokenAddress: rewardToken.address,
          tokenAmount: rewardAmounts,
          tokenSymbol: 'KNC',
        },
      })
    } catch (err: unknown) {
      setAttemptingTxn(false)
      setError(getErrorMessage(err) || t`Something is wrong. Please try again later!`)
    }
  }, [
    rewardSigningContract,
    chainId,
    account,
    isSmartConnector,
    walletKey,
    rewardAmounts,
    rewardToken,
    selectedUserReward,
    addTransactionWithType,
  ])

  return {
    isUserHasReward,
    rewardAmounts,
    claimRewardsCallback,
    attemptingTxn,
    txHash,
    resetTxn,
    pendingTx,
    error,
  }
}
