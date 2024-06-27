export enum CampaignType {
  Aggregator = 'Aggregator',
  LimitOrder = 'LimitOrder',
  Referrals = 'Referrals',
}

export default function Information({ type }: { type: CampaignType }) {
  return <div>Information</div>
}
