import { useMemo, useState, useEffect } from 'react'
import { useActiveWeb3React } from 'hooks'
import useSWR from 'swr'

export declare type ReferrerInfo = {
  referralCode: string
  totalEarning: number
  numReferrals: number
  claimableReward: number
}

export default function useReferralV2(): { referrerInfo?: ReferrerInfo; createReferrer: () => Promise<void> } {
  const { account } = useActiveWeb3React()
  const [referrerInfo, setReferrerInfo] = useState<ReferrerInfo | undefined>()

  useEffect(() => {
    setReferrerInfo(undefined)
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
  }, [account])

  return {
    referrerInfo,
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
  }
}
