import React, { useEffect } from 'react'
import { CampaignLeaderboard, CampaignState } from 'state/campaigns/actions'
import { useSelector } from 'react-redux'
import { AppState } from 'state'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TransactionResponse } from '@ethersproject/providers'
import useSendTransactionCallback from 'hooks/useSendTransactionCallback'
import axios from 'axios'
import { BigNumber } from '@ethersproject/bignumber'
import CampaignButtonWithOptions from 'pages/Campaign/CampaignButtonWithOptions'

export default function EnterNowOrClaimButton() {
  const { account, library } = useActiveWeb3React()

  const selectedCampaign = useSelector((state: AppState) => state.campaigns.selectedCampaign)
  const selectedCampaignLeaderboard = useSelector((state: AppState) => state.campaigns.selectedCampaignLeaderboard)

  const addTransactionWithType = useTransactionAdder()
  const onClaimRewardSuccess = (
    response: TransactionResponse,
    campaignName: string,
    campaignLeaderboard: CampaignLeaderboard,
  ) => {
    // TODO: Compile a list of unclaimed rewards from `campaignLeaderboard`.
    addTransactionWithType(response, {
      type: 'Claim',
      summary: `Claimed [123 KNC and 456 USDC] from campaign "${campaignName}"`,
    })
    return response.hash
  }

  const sendTransaction = useSendTransactionCallback()
  const claimReward = async () => {
    if (!account || !library || !selectedCampaign || !selectedCampaignLeaderboard) return

    const url = process.env.REACT_APP_REWARD_SERVICE_API + '/rewards/claim'
    const data = {
      wallet: account,
      chainId: selectedCampaign.rewardChainIds,
      clientCode: 'campaign',
      // TODO: put all ref in here
    }
    const response = await axios({
      method: 'POST',
      url,
      data,
    })
    if (response.data.code === 200000) {
      const rewardContractAddress = response.data.data.ContractAddress
      const encodedData = response.data.data.EncodedData
      try {
        await sendTransaction(rewardContractAddress, encodedData, BigNumber.from(0), transactionResponse => {
          return onClaimRewardSuccess(transactionResponse, selectedCampaign.name, selectedCampaignLeaderboard)
        })
      } catch (err) {
        console.error(err)
      }
    }
  }

  useEffect(() => {
    console.log(`\n\n************************************`)
    console.log(`selectedCampaign`, selectedCampaign)
    console.log(`selectedCampaignLeaderboard`, selectedCampaignLeaderboard)
  }, [selectedCampaign, selectedCampaignLeaderboard])

  if (!selectedCampaign) return null

  if (selectedCampaign.status === 'Upcoming') {
    return <CampaignButtonWithOptions campaign={selectedCampaign} type="enter_now" disabled />
  }

  if (selectedCampaign.status === 'Ongoing') {
    return <CampaignButtonWithOptions campaign={selectedCampaign} type="enter_now" />
  }

  if (
    selectedCampaign.status === 'Ended' &&
    (selectedCampaign.campaignState === CampaignState.CampaignStateReady ||
      selectedCampaign.campaignState === CampaignState.CampaignStateFinalizedLeaderboard)
  ) {
    return <CampaignButtonWithOptions campaign={selectedCampaign} type="claim_rewards" disabled />
  }

  if (selectedCampaign.campaignState === CampaignState.CampaignStateDistributedRewards) {
    const isUserClaimedRewardsInThisCampaign = false
    return (
      <CampaignButtonWithOptions
        campaign={selectedCampaign}
        type="claim_rewards"
        disabled={isUserClaimedRewardsInThisCampaign}
      />
    )
  }

  return null
}
