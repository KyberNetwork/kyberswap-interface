import { ReactNode } from 'react'

export type FaqItem = {
  q: ReactNode
  a: ReactNode
}

export type CampaignContent = {
  getHowTo: (week: number) => ReactNode
  timeline: ReactNode
  getRewards: (week: number) => ReactNode
  faq: FaqItem[]
  getTerms: (week: number) => ReactNode
  eligibility?: ReactNode
}
