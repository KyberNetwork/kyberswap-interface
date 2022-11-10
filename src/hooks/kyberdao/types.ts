export const ProposalStatus = {
  Active: 'Active',
  Pending: 'Pending',
  Canceled: 'Canceled',
  Executed: 'Executed',
  Finalized: 'Finalized',
  Succeeded: 'Approved',
  Queued: 'Queued',
  Failed: 'Failed',
  Expired: 'Expired',
  Ended: 'Ended',
}
export interface VoteOption {
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
export interface VoteStat {
  options: VoteOption[]
  total_address_count: number
  total_vote_count: number
  votes: VoteDetail[]
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
  proposal_type: string
  start_timestamp: number
  status: typeof ProposalStatus[keyof typeof ProposalStatus]
  title: string
  vote_stats: VoteStat
}
