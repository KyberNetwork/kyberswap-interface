export type GrantProgram = {
  id: number
  name: string
  startTime: number
  endTime: number
  rules: string
  termsAndConditions: string
  faq: string
  rewardDetails: string
  totalParticipants: number
  totalVolume: string
  totalTrades: number
  desktopBanner: string
  mobileBanner: string
}

export type GrantProgramRes = {
  code: number
  message: string
  data: {
    totalItems: number
    competitions: GrantProgram[]
  }
}

export type ProjectRanking = {
  rankNo: number
  competitorId: number
  name: string
  logoUrl: string
  description: string
  totalParticipants: number
  totalVolume: string
  totalTrades: number
  campaigns: Array<{
    id: number
    name: string
  }>
}

export type LeaderBoardRes = {
  code: number
  message: string
  data: {
    totalItems: number
    rankings: ProjectRanking[]
  }
}
