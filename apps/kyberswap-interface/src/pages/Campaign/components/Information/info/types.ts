import { ReactNode } from 'react'

export type FaqItem = {
  q: ReactNode
  a: ReactNode
}

export type CampaignSectionProps = {
  week?: number
}

export type CampaignSectionComponent = ReactNode
export type CampaignSectionRenderer = (props: CampaignSectionProps) => CampaignSectionComponent

export type CampaignCustomSection = {
  title: ReactNode
  Content: CampaignSectionRenderer
}

export type CampaignContent = {
  HowTo: CampaignSectionRenderer
  Timeline: CampaignSectionRenderer
  Rewards: CampaignSectionRenderer
  Terms: CampaignSectionRenderer
  Faq: CampaignSectionRenderer
  customSections?: CampaignCustomSection[]
}
