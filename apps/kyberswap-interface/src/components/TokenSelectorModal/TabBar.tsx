import { Trans } from '@lingui/macro'
import { ComponentType, ReactNode, memo } from 'react'
import { Star } from 'react-feather'

import { ReactComponent as TrendingIcon } from 'assets/svg/earn/ic_pool_highlighted.svg'
import { ReactComponent as AllIcon } from 'assets/svg/ic_token_all.svg'
import { ReactComponent as ImportedIcon } from 'assets/svg/ic_token_imported.svg'
import { ReactComponent as NewIcon } from 'assets/svg/ic_token_new.svg'
import { HStack } from 'components/Stack'
import { TokenSelectorTab } from 'components/TokenSelectorModal/constants'
import { cn } from 'utils/cn'

type TabMeta = {
  icon: ComponentType<{ className?: string }>
  /** Fixed brand color for the icon, independent of the active/inactive text color. */
  iconColor: string
  label: ReactNode
  subtitle: ReactNode
}

const TAB_META: Record<TokenSelectorTab, TabMeta> = {
  [TokenSelectorTab.All]: {
    icon: AllIcon,
    // Empty → inherits the tab's text color (green when active, white when inactive).
    iconColor: '',
    label: <Trans>All</Trans>,
    subtitle: null,
  },
  [TokenSelectorTab.Trending]: {
    icon: TrendingIcon,
    iconColor: 'text-red',
    label: <Trans>Trending</Trans>,
    subtitle: <Trans>Based on analyzed on chain trading activities</Trans>,
  },
  [TokenSelectorTab.New]: {
    icon: NewIcon,
    iconColor: 'text-[#FBB324]',
    label: <Trans>New</Trans>,
    subtitle: <Trans>Recently whitelisted on KyberSwap</Trans>,
  },
  [TokenSelectorTab.Imported]: {
    icon: ImportedIcon,
    iconColor: 'text-primary',
    label: <Trans>Imported</Trans>,
    subtitle: <Trans>Your custom imported tokens</Trans>,
  },
  [TokenSelectorTab.Favorites]: {
    icon: Star,
    // Empty → the star inherits the tab's text color (primary when active, white when inactive).
    iconColor: '',
    // Shortened on mobile so the tab row fits without scrolling.
    label: (
      <>
        <span className="sm:hidden">
          <Trans>Fav</Trans>
        </span>
        <span className="hidden sm:inline">
          <Trans>Favorites</Trans>
        </span>
      </>
    ),
    subtitle: <Trans>Your saved tokens</Trans>,
  },
}

export const getTabSubtitle = (tab: TokenSelectorTab): ReactNode => TAB_META[tab].subtitle

type TabBarProps = {
  tabs: TokenSelectorTab[]
  activeTab: TokenSelectorTab
  onChange: (tab: TokenSelectorTab) => void
}

export const TabBar = memo(({ tabs, activeTab, onChange }: TabBarProps) => {
  return (
    <HStack
      role="tablist"
      aria-label="Token lists"
      className="ks-scrollbar mt-1 gap-x-4 overflow-x-auto border-b border-white-08"
    >
      {tabs.map(tab => {
        const { icon: Icon, iconColor, label } = TAB_META[tab]
        const isActive = tab === activeTab
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls="token-selector-panel"
            data-active={isActive}
            data-testid={`tab-${tab}`}
            onClick={() => onChange(tab)}
            className={cn(
              '-mb-px flex shrink-0 items-center gap-1 border-b-2 pb-2 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
              isActive ? 'border-primary text-primary' : 'border-transparent text-text',
            )}
          >
            <Icon className={cn('size-4 shrink-0', iconColor)} />
            {label}
          </button>
        )
      })}
    </HStack>
  )
})
TabBar.displayName = 'TabBar'
