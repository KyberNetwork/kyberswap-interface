import { useMemo, useState, useEffect } from 'react'
import { useActiveWeb3React } from 'hooks'
import useSWR from 'swr'

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
  createReferrer: () => Promise<void>
  unlockRefereeReward: () => Promise<void>
  getReferrerLeaderboard: (page: number) => Promise<void>
} {
  const { account } = useActiveWeb3React()
  const [referrerInfo, setReferrerInfo] = useState<ReferrerInfo | undefined>()
  const [refereeInfo, setRefereeInfo] = useState<RefereeInfo | undefined>()
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | undefined>()
  const getLeaderboard = useMemo(
    () => (page: number) => {
      return fetch(process.env.REACT_APP_REFERRAL_V2_API + '/referrers/leaderboard?page=' + page, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then(r => r.json())
        .then(res => {
          setLeaderboardData(res.data)
        })
        .catch(err => console.log(err))
    },
    [],
  )
  useEffect(() => {
    setReferrerInfo(undefined)
    setRefereeInfo(undefined)
    if (!account) {
      return
    }
    fetch(process.env.REACT_APP_REFERRAL_V2_API + '/referrers/' + account)
      .then(res => res.json())
      .then(res => {
        if (res.data?.referrer) {
          setReferrerInfo(res.data.referrer)
        }
      })
      .catch(err => console.log(err))
    fetch(process.env.REACT_APP_REFERRAL_V2_API + '/referees/' + account)
      .then(res => res.json())
      .then(res => {
        if (res.data?.referee) {
          setRefereeInfo(res.data.referee)
        }
      })
      .catch(err => console.log(err))
    getLeaderboard(1)
  }, [account])

  return {
    referrerInfo,
    refereeInfo,
    leaderboardData,
    createReferrer: useMemo(() => {
      return () =>
        fetch(process.env.REACT_APP_REFERRAL_V2_API + '/referrers', {
          method: 'POST',
          body: JSON.stringify({ wallet: account }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
          .then(r => r.json())
          .then(res => {
            if (res.data?.referrer) {
              setReferrerInfo({
                referralCode: res.data.referrer.referralCode,
                totalEarning: 0,
                numReferrals: 0,
                claimableReward: 0,
              })
            }
          })
          .catch(err => console.log(err))
    }, [account]),
    unlockRefereeReward: useMemo(() => {
      return () =>
        fetch(process.env.REACT_APP_REFERRAL_V2_API + '/referees/' + account + '/unlock', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
        })
          .then(r => r.json())
          .then(res => {
            console.log(res)
          })
          .catch(err => console.log(err))
    }, [account]),
    getReferrerLeaderboard: getLeaderboard,
  }
}
