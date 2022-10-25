export enum ProposalStatus {
  Pending = 'Pending',
  Cancelled = 'Cancelled',
  Failed = 'Failed',
  Executed = 'Executed',
  Approved = 'Approved',
}

export type Proposal = {
  title: string
  status: ProposalStatus
  id: string
}
