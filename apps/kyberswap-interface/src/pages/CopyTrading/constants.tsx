import { Clipboard, Database, DollarSign, Users } from 'react-feather'
import {
  CopyTradingAgentTag,
  CopyTradingProfileStat,
  CopyTradingProfileTab,
  CopyTradingStat,
} from 'services/copyTrading'

export const tagClassName: Record<CopyTradingAgentTag, string> = {
  Active: 'bg-red-20 text-red',
  Diversified: 'bg-blue/20 text-blue',
  Focused: 'bg-primary-12 text-primary',
}

export const statIcons: Record<CopyTradingStat['icon'], React.ReactNode> = {
  agent: 'AI',
  aum: '$',
  copiers: <Users size={24} />,
  volume: <Database size={24} />,
}

export const profileStatIcons: Record<CopyTradingProfileStat['icon'], React.ReactNode> = {
  pnl: <DollarSign size={22} />,
  copiers: <Users size={22} />,
  winRate: <Clipboard size={22} />,
  aum: <Database size={22} />,
}

export const profileTabs: CopyTradingProfileTab[] = ['open-position', 'trade-history', 'action-log']

export const profileTabLabel: Record<CopyTradingProfileTab, string> = {
  'open-position': 'OPEN POSITION',
  'trade-history': 'TRADE HISTORY',
  'action-log': 'ACTION LOG',
}
