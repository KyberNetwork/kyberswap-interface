import { useMemo, useState, useEffect, useCallback } from 'react'
import { useActiveWeb3React } from 'hooks'
import useSWR from 'swr'
import { resetCaches } from '@apollo/client'

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
  getReferrerLeaderboard: (page: number) => Promise<void>
  createReferrer: () => Promise<void>
  unlockRefereeReward: () => Promise<boolean>
} {
  const { account } = useActiveWeb3React()
  const [referrerInfo, setReferrerInfo] = useState<ReferrerInfo | undefined>()
  const [refereeInfo, setRefereeInfo] = useState<RefereeInfo | undefined>()
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | undefined>()

  const getReferrerInfo = useCallback(async () => {
    if (!account) return
    const res = await fetch(process.env.REACT_APP_REFERRAL_V2_API + '/referrers/' + account).then(res => res.json())
    if (res.code === 0 && res.data?.referrer) {
      setReferrerInfo(res.data.referrer)
    }
  }, [account])

  const getRefereeInfo = useCallback(async () => {
    if (!account) return
    const res = await fetch(process.env.REACT_APP_REFERRAL_V2_API + '/referees/' + account).then(res => res.json())
    if (res.code === 0 && res.data?.referee) {
      setRefereeInfo(res.data.referee)
    }
  }, [account])

  const getReferrerLeaderboard = useCallback(async (page: number) => {
    const res = await fetch(process.env.REACT_APP_REFERRAL_V2_API + '/referrers/leaderboard?page=' + page, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(r => r.json())
    if (res.code === 0 && res.data) {
      setLeaderboardData(res.data)
    }
  }, [])

  const createReferrer = useCallback(async () => {
    const res = await fetch(process.env.REACT_APP_REFERRAL_V2_API + '/referrers', {
      method: 'POST',
      body: JSON.stringify({ wallet: account }),
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(r => r.json())
    if (res.code === 0) {
      getRefereeInfo()
    }
  }, [account])

  const unlockRefereeReward = useCallback(async () => {
    const res = await fetch(process.env.REACT_APP_REFERRAL_V2_API + '/referees/' + account + '/unlock', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(res => res.json())
    if (res.code === 0) {
      return true
    }
    return false
  }, [])

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
  }
}
