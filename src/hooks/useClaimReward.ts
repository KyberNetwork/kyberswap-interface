import { ChainId, TokenAmount } from '@dynamic-amm/sdk'
import { CLAIM_REWARDS_DATA_URL, KNC } from 'constants/index'
import { BigNumber } from 'ethers'
import { useActiveWeb3React } from 'hooks'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAllTransactions, useTransactionAdder } from 'state/transactions/hooks'
import useSWR from 'swr'
import { getClaimRewardContract } from 'utils'

export default function useClaimReward() {
  const { chainId, account, library } = useActiveWeb3React()
  const rewardContract = useMemo(() => {
    //TODO: update SC address for polygon when done
    return !!chainId && !!account && !!library && [ChainId.ROPSTEN].includes(chainId)
      ? getClaimRewardContract(chainId, library, account)
      : null
  }, [chainId, library, account])
  const isValid = !!chainId && !!account && !!library
  const [isUserHasReward, setIsUserHasReward] = useState(false)
  const [rewardAmounts, setRewardAmounts] = useState('0')
  const { data, error } = useSWR(
    isValid ? (chainId == ChainId.ROPSTEN ? 'claim-reward-data.json' : CLAIM_REWARDS_DATA_URL) : '',
    (url: string) => fetch(url).then(r => r.json())
  )
  const userReward = data && account && data.userRewards[account]

  const updateRewardAmounts = () => {
    setRewardAmounts('0')
    setIsUserHasReward(!!userReward)
    if (rewardContract && chainId) {
      rewardContract.getClaimedAmounts(data.phaseId || 0, account || '', data?.tokens || []).then((res: any) => {
        if (res) {
          const remainAmounts = BigNumber.from(userReward.amounts[0])
            .sub(BigNumber.from(res[0]))
            .toString()
          setRewardAmounts(new TokenAmount(KNC[chainId], remainAmounts).toSignificant(6))
        }
      })
    }
  }

  useEffect(() => {
    if (data && chainId && account && library && userReward) {
      updateRewardAmounts()
    }
  }, [data, chainId, account, library, rewardContract, userReward])

  const addTransactionWithType = useTransactionAdder()
  const [attemptingTxn, setAttemptingTxn] = useState(false)
  const [txHash, setTxHash] = useState(undefined)

  const allTransactions = useAllTransactions()
  const tx = useMemo(
    () =>
      Object.keys(allTransactions)
        .map(key => allTransactions[key])
        .filter(item => item.type === 'Claim reward' && !item.receipt)[0],
    [allTransactions]
  )
  const hasPendingTx = !!tx
  useEffect(() => {
    if (!hasPendingTx) {
      resetTxn()
    }
  }, [hasPendingTx])

  const claimRewardsCallback = useCallback(async () => {
    if (rewardContract && chainId && account && library && data) {
      setAttemptingTxn(true)
      //execute isValidClaim method to pre-check
      rewardContract
        .isValidClaim(data.phaseId, userReward.index, account, data.tokens, userReward.amounts, userReward.proof)
        .then((res: any) => {
          if (res) {
            //if ok execute claim method
            rewardContract
              .claim(data.phaseId, userReward.index, account, data.tokens, userReward.amounts, userReward.proof)
              .then((tx: any) => {
                setAttemptingTxn(false)
                setTxHash(tx.hash)
                addTransactionWithType(tx, {
                  type: 'Claim reward',
                  summary: rewardAmounts + ' KNC'
                })
              })
              .catch((err: any) => {
                setAttemptingTxn(false)
                console.log(err)
              })
          } else {
            setAttemptingTxn(false)
          }
        })
        .catch((err: any) => {
          setAttemptingTxn(false)
          console.log(err)
        })
    }
  }, [rewardContract, chainId, account, library, data, rewardAmounts])
  const resetTxn = () => {
    setAttemptingTxn(false)
    setTxHash(undefined)
    updateRewardAmounts()
  }
  return {
    isUserHasReward,
    rewardAmounts,
    claimRewardsCallback,
    attemptingTxn,
    txHash,
    resetTxn,
    pendingTx: !!tx && !tx.receipt
  }
}
