export enum ProposalStatus {
  Pending = 'Pending',
  Active = 'Active',
  Approved = 'Approved',
  Executed = 'Executed',
  Failed = 'Failed',
  Canceled = 'Canceled',
}

export enum ProposalType {
  BinaryProposal = 'BinaryProposal',
  GenericProposal = 'GenericProposal',
}

export enum ActionType {
  VoteEmitted = 'VoteEmitted',
  ClaimReward = 'ClaimReward',
  Deposit = 'Deposit',
  Withdraw = 'Withdraw',
  Delegate = 'Delegate',
}
interface VoteOption {
  option: number
  vote_count: number
}

export interface VoteDetail {
  staker: string
  epoch: number
  proposal_id: number
  option: number
  power: string
  staker_name: string
}
interface VoteStat {
  options: VoteOption[]
  total_address_count: number
  total_vote_count: number
  votes: VoteDetail[] | null
  quorum_status: number
}
export interface ProposalDetail {
  cancelled: boolean
  desc: string
  end_timestamp: number
  execution_timestamp: number
  executor: string
  executor_grace_period: number
  executor_minimum_quorum: string
  executor_vote_differential: string
  link: string
  max_voting_power: string
  options: string[]
  opts_desc: string[]
  proposal_id: number
  proposal_type: ProposalType
  start_timestamp: number
  status: ProposalStatus | string
  title: string
  vote_stats: VoteStat
}

export interface StakerInfo {
  delegate: string
  delegated_stake_amount: number
  pending_stake_amount: number
  stake_amount: number
}

export interface GasRefundTierInfo {
  userTier: number
  gasRefundPercentage: number
}

export interface RewardInfo {
  knc: number
  usd: number
}

interface TransactionInfo {
  tx: string
  timestamp: number
  gasRefundInKNC: string
  gasRefundInUSD: string
  gasFeeInUSD: string
  gasFeeInNativeToken: string
  epoch: number
  userTier: number
  gasRefundPercentage: string
  userWallet: string
}

export interface EligibleTxsInfo {
  transactions: TransactionInfo[]
  pagination: {
    totalOfPages: number
    currentPage: number
    pageSize: number
    hasMore: boolean
  }
}

export interface StakerAction {
  timestamp: number
  epoch: number
  meta: {
    amount?: number
    d_addr?: string
    proposal_id?: number
    proposal_type?: ProposalType
    options?: number[]
  }
  tx_hash: string
  type: string
}

export interface VoteInfo {
  proposal_id: number
  options?: number[]
  epoch: number
  staker: string
  power: string
}

export interface RewardStats {
  liquidated: {
    totalAmountInKNC: string
    totalAmountInUSD: string
  }
  pending: {
    totalAmountInKNC: string
    totalAmountInUSD: string
  }
  apr: string
}

export type DaoInfo = {
  current_epoch: number
  current_epoch_voted: number
  current_epoch_voter: number
  epoch_period_in_seconds: number
  first_epoch_start_timestamp: number
  total_staked: number
  total_staker: number
}
