import { CampaignType } from 'pages/Campaign/constants'

import { mayTradingInfo } from './mayTrading'
import { nearIntentsInfo } from './nearIntents'
import { raffleInfo } from './raffle'
import { aggregatorInfo } from './stipAggregator'
import { limitOrderInfo } from './stipLimitOrder'
import { referralsInfo } from './stipReferrals'
import { CampaignContent } from './types'

export const campaignInfos: Record<CampaignType, CampaignContent> = {
  [CampaignType.Raffle]: raffleInfo,
  [CampaignType.NearIntents]: nearIntentsInfo,
  [CampaignType.MayTrading]: mayTradingInfo,
  [CampaignType.Aggregator]: aggregatorInfo,
  [CampaignType.LimitOrder]: limitOrderInfo,
  [CampaignType.Referrals]: referralsInfo,
}
