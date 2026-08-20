import agentsIcon from 'assets/images/copy-trading/agents.svg'
import { ReactComponent as AumIcon } from 'assets/images/copy-trading/ic_aum.svg'
import { ReactComponent as CashIcon } from 'assets/images/copy-trading/ic_cash.svg'
import { ReactComponent as PnlIcon } from 'assets/images/copy-trading/ic_pnl.svg'
import { ReactComponent as WinRateIcon } from 'assets/images/copy-trading/ic_winrate.svg'
import moneyIcon, { ReactComponent as MoneyIcon } from 'assets/images/copy-trading/money.svg'
import positionCloseIcon from 'assets/images/copy-trading/position-close.svg'
import positionOpenIcon from 'assets/images/copy-trading/position-open.svg'
import { ReactComponent as UsersIcon } from 'assets/images/copy-trading/users.svg'
import volumeIcon, { ReactComponent as VolumeIcon } from 'assets/images/copy-trading/volume.svg'

export const copyTradingStatIconMap = {
  agents: {
    iconUrl: agentsIcon,
    backgroundColor: 'bg-[#FBB324]/20',
  },
  aum: {
    Icon: AumIcon,
    backgroundColor: 'bg-primary-12',
    iconClassName: 'text-primary',
  },
  cash: {
    Icon: CashIcon,
    backgroundColor: 'bg-primary-12',
    iconClassName: 'text-primary',
  },
  money: {
    iconUrl: moneyIcon,
    backgroundColor: 'bg-[#58B5EE]/20',
  },
  moneyPrimary: {
    Icon: MoneyIcon,
    backgroundColor: 'bg-primary-12',
    iconClassName: 'text-primary [&_*]:stroke-current',
  },
  pnl: {
    Icon: PnlIcon,
    backgroundColor: 'bg-primary-12',
    iconClassName: 'text-primary',
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
    Icon: UsersIcon,
    backgroundColor: 'bg-primary-12',
    iconClassName: 'text-primary',
  },
  usersPurple: {
    Icon: UsersIcon,
    backgroundColor: 'bg-[#8F92FF]/20',
    iconClassName: 'text-[#8F92FF]',
  },
  volume: {
    iconUrl: volumeIcon,
    backgroundColor: 'bg-[#31CB9E]/20',
  },
  volumePrimary: {
    Icon: VolumeIcon,
    backgroundColor: 'bg-primary-12',
    iconClassName: 'text-primary [&_*]:stroke-current',
  },
  winRate: {
    Icon: WinRateIcon,
    backgroundColor: 'bg-primary-12',
    iconClassName: 'text-primary',
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
