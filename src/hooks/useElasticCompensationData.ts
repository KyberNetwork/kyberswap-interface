import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useState } from 'react'

import { REWARD_SERVICE_API } from 'constants/env'
import { useActiveWeb3React } from 'hooks'

const links: { [key: number]: string } = {
  [ChainId.ARBITRUM]:
    'https://raw.githubusercontent.com/viet-nv/unclaimed-rewards-elastic-lm/viet-nv-patch-2/snapshots/arbitrum.json',
  // 'https://raw.githubusercontent.com/KyberNetwork/unclaimed-rewards-elastic-lm/main/snapshots/arbitrum.json',
  [ChainId.MATIC]:
    'https://raw.githubusercontent.com/KyberNetwork/unclaimed-rewards-elastic-lm/main/snapshots/polygon.json',
  [ChainId.MAINNET]:
    'https://raw.githubusercontent.com/KyberNetwork/unclaimed-rewards-elastic-lm/main/snapshots/ethereum.json',
  [ChainId.OPTIMISM]:
    'https://raw.githubusercontent.com/KyberNetwork/unclaimed-rewards-elastic-lm/main/snapshots/optimism.json',
  [ChainId.AVAXMAINNET]:
    'https://raw.githubusercontent.com/KyberNetwork/unclaimed-rewards-elastic-lm/main/snapshots/avalanche.json',
}

export interface Snapshot {
  farm_address: string
  nftid: string
  pid: string
  pending_rewards: Array<{ amount: string; token_address: string }>
  user: string
}

const useElasticCompensationData = () => {
  const { chainId, account } = useActiveWeb3React()

  const [data, setData] = useState<Array<Snapshot> | null>(null)
  const [loading, setLoading] = useState(false)
  const [claimInfo, setClaimInfo] = useState<{ address: string; encodedData: string } | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [rewardInfo, claimInfo] = await Promise.all([
        fetch(links[chainId]).then(res => res.json()),

        fetch(`${REWARD_SERVICE_API}/rewards/claim`, {
          method: 'POST',
          body: JSON.stringify({
            wallet: account,
            chainId: chainId.toString(),
            clientCode: 'elastic',
          }),
        }).then(res => res.json()),
      ])

      if (claimInfo?.data && Array.isArray(rewardInfo)) {
        setClaimInfo({ address: claimInfo.data.ContractAddress, encodedData: claimInfo.data.EncodedData })
        if (Array.isArray(rewardInfo))
          setData(rewardInfo.filter(item => item?.user?.toLowerCase() === account?.toLowerCase()))
      }
    } catch (e) {
      setData(null)
      setClaimInfo(null)
    }
  }, [account, chainId])

  useEffect(() => {
    setData(null)
    setClaimInfo(null)
    if (links[chainId] && account) {
      setLoading(true)
      fetchData().finally(() => setLoading(false))
    }
  }, [chainId, fetchData, account])

  return { data, loading, claimInfo }
}

export default useElasticCompensationData
