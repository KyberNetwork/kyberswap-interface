import { t } from '@lingui/macro'

export const View = () =>
  ({
    ASSETS: t`Assets`,
    TRANSACTIONS: t`Transactions`,
    REWARD_CENTER: t`Reward Center`,
  } as const)

export enum REWARD_TYPE {
  VOTING_REWARDS = 'VOTING_REWARDS',
  GAS_REFUND = 'GAS_REFUND',
}
