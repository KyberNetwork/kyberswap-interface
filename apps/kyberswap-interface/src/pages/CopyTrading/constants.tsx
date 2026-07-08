import { Clipboard, Database, DollarSign, Users } from 'react-feather'

export type StatIcon = 'agent' | 'aum' | 'copiers' | 'volume'
export type ProfileStatIcon = 'pnl' | 'copiers' | 'winRate' | 'aum'

export const statIcons: Record<StatIcon, React.ReactNode> = {
  agent: 'AI',
  aum: '$',
  copiers: <Users size={24} />,
  volume: <Database size={24} />,
}

export const profileStatIcons: Record<ProfileStatIcon, React.ReactNode> = {
  pnl: <DollarSign size={22} />,
  copiers: <Users size={22} />,
  winRate: <Clipboard size={22} />,
  aum: <Database size={22} />,
}

export const profileTabs = ['open-position', 'trade-history', 'action-log'] as const
export type ProfileTab = (typeof profileTabs)[number]

export const profileTabLabel: Record<ProfileTab, string> = {
  'open-position': 'OPEN POSITION',
  'trade-history': 'TRADE HISTORY',
  'action-log': 'ACTION LOG',
}
