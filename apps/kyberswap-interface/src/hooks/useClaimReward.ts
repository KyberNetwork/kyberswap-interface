import { CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { readContract } from '@wagmi/core'
import { useCallback, useEffect, useMemo, useState } from 'react'
import externalApi from 'services/externalApi'

import { wagmiConfig } from 'components/Web3Provider'
import { CLAIM_REWARD_ABI } from 'constants/abis'
import { CLAIM_REWARDS_DATA_URL, NETWORKS_INFO } from 'constants/networks'
import { KNC } from 'constants/tokens'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useReadingContract, useSigningContract } from 'hooks/useContract'
import { useAllTransactions, useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { sendEVMTransaction } from 'utils/sendTransaction'
import { ErrorName } from 'utils/transactionError'
import { Address, encodeFunctionData } from 'utils/viem'

interface IReward {
  index: number
  amounts: string[]
  proof: string[]
}
export interface IPhaseData {
  phaseId: number
  merkleRoot: string
  tokens: string[]
  userRewards: { [address: string]: IReward }
}
interface IUserReward {
  phaseId: number
  tokens: string[]
  reward: IReward | undefined
}

export default function useClaimReward() {
  const { chainId, account, walletKey } = useActiveWeb3React()
  const { isSmartConnector } = useWeb3React()

  const rewardReadingContract = useReadingContract(
    NETWORKS_INFO[chainId].classic.claimReward ?? undefined,
    CLAIM_REWARD_ABI,
  )
  const rewardSigningContract = useSigningContract(
    NETWORKS_INFO[chainId].classic.claimReward ?? undefined,
    CLAIM_REWARD_ABI,
  )
  const isValid = !!chainId && !!account
  const [isUserHasReward, setIsUserHasReward] = useState(false)
  const [rewardAmounts, setRewardAmounts] = useState('0')
  const [error, setError] = useState<string | null>(null)
  const [phaseId, setPhaseId] = useState(0)
  const { data } = externalApi.useGetClaimRewardsQuery(
    { url: CLAIM_REWARDS_DATA_URL[chainId], account },
    { skip: !isValid || !chainId },
  )
  const userRewards: IUserReward[] = useMemo(
    () =>
      (data &&
        Array.isArray(data) &&
        account &&
        data.map((phase: IPhaseData) => {
          return { phaseId: phase.phaseId, tokens: phase.tokens, reward: phase.userRewards[account] }
        })) ||
      [],
    [data, account],
  )

  const updateRewardAmounts = useCallback(async () => {
    setRewardAmounts('0')
    setIsUserHasReward(userRewards && userRewards.some((phase: IUserReward) => !!phase.reward))
    if (rewardReadingContract && chainId && data && account && userRewards.length > 0) {
      for (let i = 0; i < userRewards.length; i++) {
        const phase = userRewards[i]
        if (phase.reward) {
          const res = (await readContract(wagmiConfig, {
            address: rewardReadingContract.address as Address,
            abi: CLAIM_REWARD_ABI,
            functionName: 'getClaimedAmounts',
            args: [BigInt(phase.phaseId || 0), account || '', phase.tokens || []],
            chainId: chainId as number,
          })) as readonly bigint[]
          if (res) {
            const remainAmounts = (BigInt(phase.reward.amounts[0]) - BigInt(res[0].toString())).toString()
            setRewardAmounts(CurrencyAmount.fromRawAmount(KNC[chainId], remainAmounts).toSignificant(6))
            if (remainAmounts !== '0') {
              setPhaseId(i)
              break
            }
          }
        }
      }
    }
  }, [rewardReadingContract, chainId, data, account, userRewards])

  useEffect(() => {
    setRewardAmounts('0')
    if (data && chainId && account && userRewards) {
      updateRewardAmounts().catch(error => console.log(error))
    }
  }, [data, chainId, account, rewardReadingContract, userRewards, updateRewardAmounts])

  const addTransactionWithType = useTransactionAdder()
  const [attemptingTxn, setAttemptingTxn] = useState(false)
  const [txHash, setTxHash] = useState<string | undefined>(undefined)

  const allTransactions = useAllTransactions()
  const tx = useMemo(
    () =>
      allTransactions
        ? Object.values(allTransactions)
            .flat()
            .find(item => item && item.type === TRANSACTION_TYPE.CLAIM_REWARD && !item.receipt)
        : undefined,
    [allTransactions],
  )
  const resetTxn = useCallback(() => {
    setAttemptingTxn(false)
    setTxHash(undefined)
    updateRewardAmounts()
    setError(null)
  }, [updateRewardAmounts])

  const hasPendingTx = !!tx
  useEffect(() => {
    if (!hasPendingTx) {
      resetTxn()
    }
  }, [hasPendingTx, resetTxn])

  const claimRewardsCallback = useCallback(async () => {
    if (rewardSigningContract && chainId && account && data && userRewards[phaseId]) {
      setAttemptingTxn(true)
      //execute isValidClaim method to pre-check
      const userReward = userRewards[phaseId]
      try {
        const isValid = (await readContract(wagmiConfig, {
          address: rewardSigningContract.address as Address,
          abi: CLAIM_REWARD_ABI,
          functionName: 'isValidClaim',
          args: [
            BigInt(userReward.phaseId),
            BigInt(userReward.reward?.index ?? 0),
            account,
            userReward.tokens,
            (userReward.reward?.amounts ?? []).map((v: string) => BigInt(v)),
            userReward.reward?.proof ?? [],
          ],
          chainId: chainId as number,
        })) as boolean
        if (!isValid) throw new Error()

        const claimed = (await readContract(wagmiConfig, {
          address: rewardSigningContract.address as Address,
          abi: CLAIM_REWARD_ABI,
          functionName: 'getClaimedAmounts',
          args: [BigInt(userReward.phaseId || 0), account || '', userReward.tokens || []],
          chainId: chainId as number,
        })) as readonly bigint[]
        if (!claimed) throw new Error()

        if (
          claimed.length === 0 ||
          BigInt(userReward.reward?.amounts[0] ?? '0') - BigInt(claimed[0].toString()) !== 0n
        ) {
          //if amount available for claim, execute claim method
          const tx = await sendEVMTransaction({
            account,
            isSmartConnector,
            chainId,
            contractAddress: rewardSigningContract.address,
            encodedData: encodeFunctionData({
              abi: CLAIM_REWARD_ABI,
              functionName: 'claim',
              args: [
                BigInt(userReward.phaseId),
                BigInt(userReward.reward?.index ?? 0),
                account,
                userReward.tokens,
                (userReward.reward?.amounts ?? []).map((v: string) => BigInt(v)),
                userReward.reward?.proof ?? [],
              ],
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
              tokenAddress: KNC[chainId].address,
              tokenAmount: rewardAmounts,
              tokenSymbol: 'KNC',
            },
          })
        } else {
          setRewardAmounts('0')
          throw new Error(t`Insufficient reward amount available for claim!`)
        }
      } catch (err: any) {
        //on invalid claim reward
        setAttemptingTxn(false)
        setError(err?.message || t`Something is wrong. Please try again later!`)
      }
    }
  }, [
    rewardSigningContract,
    chainId,
    account,
    isSmartConnector,
    walletKey,
    data,
    rewardAmounts,
    phaseId,
    userRewards,
    addTransactionWithType,
  ])

  return {
    isUserHasReward,
    rewardAmounts,
    claimRewardsCallback,
    attemptingTxn,
    txHash,
    resetTxn,
    pendingTx: !!tx && !tx.receipt,
    error,
  }
}
