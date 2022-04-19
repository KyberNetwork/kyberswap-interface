import { BigNumber } from 'ethers'
import { ProMMPoolData } from 'state/prommPools/hooks'

export interface ProMMFarm {
  pAddress: string
  totalLiqStake: BigNumber
  startTime: number
  endTime: number
  vestingDuration: number
  rewardTokens: string[]
  totalRewardUnclaimeds: BigNumber[]
  poolInfo: ProMMPoolData
}
