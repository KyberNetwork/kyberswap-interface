import agentsIcon from 'assets/images/copy-trading/agents.svg'
import moneyIcon from 'assets/images/copy-trading/money.svg'
import positionCloseIcon from 'assets/images/copy-trading/position-close.svg'
import positionOpenIcon from 'assets/images/copy-trading/position-open.svg'
import usersIcon from 'assets/images/copy-trading/users.svg'
import volumeIcon from 'assets/images/copy-trading/volume.svg'

export const copyTradingStatIconMap = {
  agents: {
    iconUrl: agentsIcon,
    backgroundColor: 'bg-[#FBB324]/20',
  },
  money: {
    iconUrl: moneyIcon,
    backgroundColor: 'bg-[#58B5EE]/20',
  },
  positionClose: {
    iconUrl: positionCloseIcon,
    backgroundColor: 'bg-[#8F92FF]/20',
  },
  positionOpen: {
    iconUrl: positionOpenIcon,
    backgroundColor: 'bg-[#8F92FF]/20',
  },
  users: {
    iconUrl: usersIcon,
    backgroundColor: 'bg-[#8F92FF]/20',
  },
  volume: {
    iconUrl: volumeIcon,
    backgroundColor: 'bg-[#31CB9E]/20',
  },
} as const

export type StatIcon = (typeof copyTradingStatIconMap)[keyof typeof copyTradingStatIconMap]

export const profileTabs = ['open-position', 'trade-history', 'action-log'] as const
export type ProfileTab = (typeof profileTabs)[number]

export const profileTabLabel: Record<ProfileTab, string> = {
  'open-position': 'OPEN POSITIONS',
  'trade-history': 'TRADE HISTORY',
  'action-log': 'ACTION LOG',
}
