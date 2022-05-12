export type ICampaignStatus = 'Upcoming' | 'Ongoing' | 'Ended'

export interface ICampaign {
  name: string
  status: ICampaignStatus
}
