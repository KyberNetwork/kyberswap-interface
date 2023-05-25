import { GasRefundTier } from './types'

export const REFUND_AMOUNTS: { [key in GasRefundTier]: number } = {
  [GasRefundTier.Tier0]: 0,
  [GasRefundTier.Tier1]: 10,
  [GasRefundTier.Tier2]: 15,
  [GasRefundTier.Tier3]: 20,
}
