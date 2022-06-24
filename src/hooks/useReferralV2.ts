import { useMemo } from 'react'
import { useActiveWeb3React } from 'hooks'
import useSWR from 'swr'

export declare type ReferrerInfo = {
  referralCode: string
  totalEarning: number
  numReferrals: number
  claimableReward: number
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function useReferralV2(): { referrerInfo?: ReferrerInfo; createReferrer: () => Promise<Response> } {
  const { account } = useActiveWeb3React()
  const { data: referrerData, error: referrerError } = useSWR(
    account ? process.env.REACT_APP_REFERRAL_V2_API + '/referrers/' + account : '',
    fetcher,
  )
  return {
    referrerInfo: referrerData?.data?.referrer,
    createReferrer: useMemo(() => {
      return () =>
        fetch(process.env.REACT_APP_REFERRAL_V2_API + '/referrers/', {
          method: 'POST',
          body: JSON.stringify({ wallet: account }),
          headers: {
            'Content-type': 'application/json',
          },
        }).then(r => r.json())
    }, [account]),
  }
}
