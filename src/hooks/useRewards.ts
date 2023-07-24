import { useMemo } from 'react'

import { REWARD_TYPE } from 'components/WalletPopup/type'
import { useKNCPrice } from 'state/application/hooks'
import { aggregateValue } from 'utils/array'

import { useClaimGasRefundRewards, useClaimVotingRewards, useGasRefundInfo, useVotingInfo } from './kyberdao'

export const useRewards = () => {
  const kncPrice = useKNCPrice()
  const { claimableReward } = useGasRefundInfo({})
  const { knc, usd } = claimableReward || {}
  const { remainingCumulativeAmount } = useVotingInfo()

  const claimGasRefund = useClaimGasRefundRewards()
  const claimVotingRewards = useClaimVotingRewards()

  const rewards: { [key in REWARD_TYPE]: { knc: number; usd: number; claim: () => Promise<string> } } = useMemo(() => {
    return {
      [REWARD_TYPE.GAS_REFUND]: { knc: knc || 0, usd: usd || 0, claim: claimGasRefund },
      [REWARD_TYPE.VOTING_REWARDS]: {
        knc: remainingCumulativeAmount.toNumber(),
        usd: remainingCumulativeAmount.toNumber() * kncPrice,
        claim: claimVotingRewards,
      },
    }
  }, [knc, kncPrice, remainingCumulativeAmount, usd, claimVotingRewards, claimGasRefund])

  const totalReward = useMemo(() => {
    const rewardsValues = Object.values(rewards)
    return {
      usd: aggregateValue(rewardsValues, 'usd'),
      knc: aggregateValue(rewardsValues, 'knc'),
    }
  }, [rewards])

  return useMemo(
    () => ({
      rewards,
      totalReward,
    }),
    [rewards, totalReward],
  )
}
