import { BigNumber } from '@ethersproject/bignumber'
import useSendTransactionCallback from 'hooks/useSendTransactionCallback'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { TransactionResponse } from '@ethersproject/providers'
import { useState, useEffect, useCallback } from 'react'
import { useActiveWeb3React } from 'hooks'
import { calculateGasMargin } from 'utils'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useAddPopup } from 'state/application/hooks'

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
  claimReward: () => Promise<TransactionResponse>
} {
  const { account, library } = useActiveWeb3React()
  const [referrerInfo, setReferrerInfo] = useState<ReferrerInfo | undefined>()
  const [refereeInfo, setRefereeInfo] = useState<RefereeInfo | undefined>()
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | undefined>()
  const addTransactionWithType = useTransactionAdder()
  const addPopup = useAddPopup()
  const { mixpanelHandler } = useMixpanel()
  const sendTransaction = useSendTransactionCallback()

  const getReferrerInfo = useCallback(async () => {
    if (!account) return
    try {
      const res = await fetch(process.env.REACT_APP_REFERRAL_V2_API + '/users/' + account).then(res => res.json())
      if (res.code === 0 && res.data?.user) {
        setReferrerInfo(res.data.user)
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
        mixpanelHandler(MIXPANEL_TYPE.REFERRAL_GENERATE_LINK)
        getRefereeInfo()
        getReferrerInfo()
      }
    } catch (err) {
      console.log(err)
    }
  }, [account, getReferrerInfo, getRefereeInfo, mixpanelHandler])

  const unlockRefereeReward = useCallback(async () => {
    try {
      const res = await fetch(process.env.REACT_APP_REFERRAL_V2_API + '/referees/' + account + '/unlock', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      }).then(res => res.json())
      if (res.code === 0) {
        mixpanelHandler(MIXPANEL_TYPE.REFERRAL_UNLOCKED)
        getReferrerInfo()
        return true
      }
    } catch (err) {
      console.log(err)
    }
    return false
  }, [account, getReferrerInfo])

  const claimReward = useCallback(async () => {
    const res = await fetch(process.env.REACT_APP_REWARD_SERVICE_API + '/rewards/claim', {
      method: 'POST',
      body: JSON.stringify({ wallet: account, chainId: '4', ref: '', clientCode: 'referral' }),
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(res => res.json())

    if (res.code === 200000) {
      if (!library || !account) throw new Error('Not found account')
      mixpanelHandler(MIXPANEL_TYPE.REFERRAL_CLAIM_REWARD, { claimed_rewards: referrerInfo?.claimableReward })
      const {
        data: { ContractAddress, EncodedData },
      } = res
      try {
        await sendTransaction(ContractAddress, EncodedData, BigNumber.from(0), (response: TransactionResponse) => {
          addTransactionWithType(response, {
            type: 'Claim reward',
            summary: referrerInfo?.claimableReward + ' KNC',
          })
          getReferrerInfo()
          return response.hash
        })
        return Promise.resolve
      } catch (err) {
        return Promise.reject(err)
      }
    } else {
      addPopup({
        simple: {
          title: `Error - ${res.code}`,
          success: false,
          summary: res.message,
        },
      })
      throw res
    }
  }, [account, referrerInfo, mixpanelHandler, library, addTransactionWithType, getReferrerInfo, addPopup])

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
