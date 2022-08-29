/**
 * These actions are: Enter Now -> Swap Now -> Claim
 */
import { useSelector } from 'react-redux'

import { BIG_INT_ZERO } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTemporaryClaimedRefsManager from 'hooks/campaigns/useTemporaryClaimedRefsManager'
import CampaignButtonEnterNow from 'pages/Campaign/CampaignButtonEnterNow'
import CampaignButtonWithOptions from 'pages/Campaign/CampaignButtonWithOptions'
import { AppState } from 'state'
import { CampaignState } from 'state/campaigns/actions'
import { useIsConnectedAccountEligibleForSelectedCampaign } from 'state/campaigns/hooks'

export default function CampaignActions() {
  const { account } = useActiveWeb3React()

  const selectedCampaign = useSelector((state: AppState) => state.campaigns.selectedCampaign)
  const selectedCampaignLeaderboard = useSelector((state: AppState) => state.campaigns.selectedCampaignLeaderboard)

  const [temporaryClaimedRefs, addTemporaryClaimedRefs] = useTemporaryClaimedRefsManager()

  const isAccountEligible = useIsConnectedAccountEligibleForSelectedCampaign()

  if (!selectedCampaign || !account) return null

  if (selectedCampaign.status !== 'Ended' && !isAccountEligible.data) {
    return <CampaignButtonEnterNow />
  }

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
    let isUserClaimedRewardsInThisCampaign = true
    if (selectedCampaignLeaderboard?.rewards?.length) {
      selectedCampaignLeaderboard.rewards.forEach(reward => {
        if (
          reward.rewardAmount.greaterThan(BIG_INT_ZERO) &&
          !reward.claimed &&
          !temporaryClaimedRefs.includes(reward.ref)
        ) {
          isUserClaimedRewardsInThisCampaign = false
        }
      })
    }
    return (
      <CampaignButtonWithOptions
        campaign={selectedCampaign}
        type="claim_rewards"
        disabled={isUserClaimedRewardsInThisCampaign}
        addTemporaryClaimedRefs={addTemporaryClaimedRefs}
      />
    )
  }

  return null
}
