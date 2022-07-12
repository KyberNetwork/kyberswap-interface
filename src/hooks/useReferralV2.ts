import { TransactionResponse } from '@ethersproject/providers'
import { useState, useEffect, useCallback } from 'react'
import { useActiveWeb3React } from 'hooks'
import { calculateGasMargin } from 'utils'
import { useTransactionAdder } from 'state/transactions/hooks'

export type ReferrerInfo = {
  referralCode?: string
  totalEarning?: number
  numReferrals?: number
  claimableReward?: number
}
export type RefereeInfo = {
  referrerWallet?: string
  tradeVolume?: number
  isEligible?: boolean
  isUnlocked?: boolean
  isClaimed?: boolean
}
export type LeaderboardData = {
  pagination: { totalItems: number }
  referrers: { wallet: string; numReferrals: number; totalEarning: number; rankNo: number }[]
}

export default function useReferralV2(): {
  referrerInfo?: ReferrerInfo
  refereeInfo?: RefereeInfo
  leaderboardData?: LeaderboardData
  getReferrerInfo: () => void
  getRefereeInfo: () => void
  getReferrerLeaderboard: (page: number, wallet?: string) => void
  createReferrer: () => void
  unlockRefereeReward: () => Promise<boolean>
  claimReward: () => void
} {
  const { account, library } = useActiveWeb3React()
  const [referrerInfo, setReferrerInfo] = useState<ReferrerInfo | undefined>()
  const [refereeInfo, setRefereeInfo] = useState<RefereeInfo | undefined>()
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | undefined>()
  const addTransactionWithType = useTransactionAdder()

  const getReferrerInfo = useCallback(async () => {
    if (!account) return
    try {
      const res = await fetch(process.env.REACT_APP_REFERRAL_V2_API + '/referrers/' + account).then(res => res.json())
      if (res.code === 0 && res.data?.referrer) {
        setReferrerInfo(res.data.referrer)
      }
    } catch (err) {
      console.log(err)
    }
  }, [account])

  const getRefereeInfo = useCallback(async () => {
    if (!account) return
    try {
      const res = await fetch(process.env.REACT_APP_REFERRAL_V2_API + '/referees/' + account).then(res => res.json())
      if (res.code === 0 && res.data?.referee) {
        setRefereeInfo(res.data.referee)
      }
    } catch (err) {
      console.log(err)
    }
  }, [account])

  const getReferrerLeaderboard = useCallback(async (page: number, wallet?: string) => {
    try {
      const res = await fetch(
        process.env.REACT_APP_REFERRAL_V2_API +
          `/referrers/leaderboard?${wallet ? `wallet=${wallet}` : 'page=' + page}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ).then(r => r.json())
      if (res.code === 0 && res.data) {
        setLeaderboardData(res.data)
      }
    } catch (err) {
      console.log(err)
    }
  }, [])

  const createReferrer = useCallback(async () => {
    try {
      const res = await fetch(process.env.REACT_APP_REFERRAL_V2_API + '/referrers', {
        method: 'POST',
        body: JSON.stringify({ wallet: account }),
        headers: {
          'Content-Type': 'application/json',
        },
      }).then(r => r.json())
      if (res.code === 0) {
        getRefereeInfo()
        getReferrerInfo()
      }
    } catch (err) {
      console.log(err)
    }
  }, [account])

  const unlockRefereeReward = useCallback(async () => {
    try {
      const res = await fetch(process.env.REACT_APP_REFERRAL_V2_API + '/referees/' + account + '/unlock', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      }).then(res => res.json())
      if (res.code === 0) {
        getReferrerInfo()
        return true
      }
    } catch (err) {
      console.log(err)
    }
    return false
  }, [])

  const claimReward = useCallback(async () => {
    try {
      const res = await fetch(process.env.REACT_APP_CLAIM_REWARD_SERVICE_API + '/rewards/claim', {
        method: 'POST',
        body: JSON.stringify({ wallet: account, chainId: '4', ref: '', clientCode: 'campaign' }),
        headers: {
          'Content-Type': 'application/json',
        },
      }).then(res => res.json())
      if (res.code === 200000) {
        if (!library || !account) return
        const {
          data: { ContractAddress, EncodedData },
        } = res

        const txn = {
          from: account,
          to: ContractAddress,
          data: EncodedData,
        }

        library
          .getSigner()
          .estimateGas(txn)
          .then(estimate => {
            const newTxn = {
              ...txn,
              gasLimit: calculateGasMargin(estimate),
            }
            return library
              .getSigner()
              .sendTransaction(newTxn)
              .then((tx: TransactionResponse) => {
                if (tx.hash) {
                  addTransactionWithType(tx, {
                    type: 'Claim reward',
                    summary: referrerInfo?.claimableReward + ' KNC',
                  })
                  getReferrerInfo()
                }
              })
          })
          .catch(error => {
            console.error(error)
            throw new Error(
              'gasEstimate not found: Unexpected error. Please contact support: none of the calls threw an error',
            )
          })
      }
      console.log(res)
    } catch (err) {
      console.log(err)
    }
  }, [account, referrerInfo])

  useEffect(() => {
    setReferrerInfo(undefined)
    setRefereeInfo(undefined)
  }, [account])

  return {
    referrerInfo,
    refereeInfo,
    leaderboardData,
    getReferrerInfo,
    getRefereeInfo,
    getReferrerLeaderboard,
    createReferrer,
    unlockRefereeReward,
    claimReward,
  }
}
