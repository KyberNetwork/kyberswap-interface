import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { useWallet } from '@solana/wallet-adapter-react'
import { useGetUserWeeklyRewardQuery } from 'services/campaign'

import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { useWeb3React } from 'hooks'

export const useNearIntentCampaignReward = () => {
  const { account } = useWeb3React()
  const { walletInfo } = useBitcoinWallet()
  const { address: btcAddress } = walletInfo || {}
  const { publicKey: solanaAddress } = useWallet()
  const solanaWallet = solanaAddress?.toBase58() || null
  const { signedAccountId: nearAddress } = useWalletSelector()

  const { data: evmData } = useGetUserWeeklyRewardQuery(
    {
      program: 'grind/base',
      campaign: 'trading-incentive',
      url: 'https://kyberswap-near-intents.kyberengineering.io/api/v1',
      wallet: account || '',
    },
    {
      skip: !account,
    },
  )
  const { data: solanaData } = useGetUserWeeklyRewardQuery(
    {
      program: 'grind/base',
      campaign: 'trading-incentive',
      url: 'https://kyberswap-near-intents.kyberengineering.io/api/v1',
      wallet: solanaWallet || '',
    },
    {
      skip: !solanaWallet,
    },
  )

  const { data: btcData } = useGetUserWeeklyRewardQuery(
    {
      program: 'grind/base',
      campaign: 'trading-incentive',
      url: 'https://kyberswap-near-intents.kyberengineering.io/api/v1',
      wallet: btcAddress || '',
    },
    {
      skip: !btcAddress,
    },
  )

  const { data: nearData } = useGetUserWeeklyRewardQuery(
    {
      program: 'grind/base',
      campaign: 'trading-incentive',
      url: 'https://kyberswap-near-intents.kyberengineering.io/api/v1',
      wallet: nearAddress || '',
    },
    {
      skip: !nearAddress,
    },
  )

  const data = {
    EVM: account ? evmData?.data : undefined,
    Solana: solanaWallet ? solanaData?.data : undefined,
    Bitcoin: btcAddress ? btcData?.data : undefined,
    Near: nearAddress ? nearData?.data : undefined,
  }

  return data
}
