import { useState, useEffect, useCallback } from 'react'
import { useActiveWeb3React } from 'hooks'

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
  getReferrerLeaderboard: (page: number) => void
  createReferrer: () => void
  unlockRefereeReward: () => Promise<boolean>
  claimReward: () => void
  createReward: () => void
} {
  const { account } = useActiveWeb3React()
  const [referrerInfo, setReferrerInfo] = useState<ReferrerInfo | undefined>()
  const [refereeInfo, setRefereeInfo] = useState<RefereeInfo | undefined>()
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | undefined>()

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

  const getReferrerLeaderboard = useCallback(async (page: number) => {
    try {
      const res = await fetch(process.env.REACT_APP_REFERRAL_V2_API + '/referrers/leaderboard?page=' + page, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }).then(r => r.json())
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
        return true
      }
    } catch (err) {
      console.log(err)
    }
    return false
  }, [])

  const createReward = useCallback(async () => {
    try {
      const res = await fetch('https://rewards-admin.dev.kyberengineering.io/api/v1/rewards', {
        method: 'POST',
        body: JSON.stringify({
          checksum: '9c5baf2b7aff24099d5ab0c621908be9ab6c2cd79f23919e7eed20e9f06abad6',
          rewards: [
            {
              user: account,
              token: '0',
              amount: '300000000000000',
              chainId: '4',
              ref: '3w1',
            },
          ],
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      }).then(res => res.json())
      console.log('🚀 ~ file: useReferralV2.ts ~ line 112 ~ createReward ~ res', res)
    } catch (err) {
      console.log(err)
    }
  }, [account])

  const claimReward = useCallback(async () => {
    try {
      const res = await fetch(process.env.REACT_APP_CLAIM_REWARD_SERVICE_API + '/rewards/claim', {
        method: 'POST',
        body: JSON.stringify({ wallet: account, chainId: '4', ref: '', clientCode: 'campaign' }),
        headers: {
          'Content-Type': 'application/json',
        },
      }).then(res => res.json())

      console.log(res)
    } catch (err) {
      console.log(err)
    }
  }, [account])

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
    createReward,
  }
}
