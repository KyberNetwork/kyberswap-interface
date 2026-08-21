import { Link } from 'react-router-dom'
import type { Chain } from 'services/copyTrading/types/agents'

import { Center } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import type { SidebarRouteState } from 'pages/CopyTrading/components/Sidebar/primitives'
import { cn } from 'utils/cn'

type MobileNavigationProps = {
  agentsCount: number
  chains: Chain[]
  copiesCount: number
  onSelectChain: (chainId: number) => void
  route: SidebarRouteState
  selectedChainId?: number
}

const MobileNavigation = ({
  agentsCount,
  chains,
  copiesCount,
  onSelectChain,
  route,
  selectedChainId,
}: MobileNavigationProps) => {
  const items = [
    {
      active: route.isAgentsPage,
      count: agentsCount,
      label: 'Agents',
      to: APP_PATHS.COPY_TRADING,
    },
    {
      active: route.isCopiesPage,
      count: copiesCount,
      label: 'Open Copies',
      to: APP_PATHS.COPY_TRADING + '/my-copies',
    },
    {
      active: route.isHistorySectionActive,
      label: 'History',
      to: APP_PATHS.COPY_TRADING + '/history',
    },
  ]

  return (
    <nav aria-label="Copy Trading" className="hidden border-b border-darkBorder bg-black px-4 py-3 max-lg:block">
      <div className="flex gap-2 overflow-x-auto">
        {items.map(item => (
          <Link
            key={item.label}
            to={item.to}
            className={cn(
              'flex h-9 shrink-0 items-center gap-2 rounded-lg bg-buttonBlack px-3 text-sm font-medium text-subText no-underline hover:bg-primary-10 hover:text-primary',
              item.active && 'bg-primary-12 text-primary',
            )}
          >
            <span>{item.label}</span>
            {typeof item.count === 'number' && (
              <Center className="size-5 rounded-full bg-primary-12 text-xs text-primary">{item.count}</Center>
            )}
          </Link>
        ))}
      </div>

      {!!chains.length && (
        <div className="mt-2 flex gap-2 overflow-x-auto">
          {chains.map(chain => {
            const active = selectedChainId === chain.chainId

            return (
              <button
                key={chain.chainId}
                type="button"
                onClick={() => onSelectChain(chain.chainId)}
                className={cn(
                  'flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium text-subText hover:bg-primary-10 hover:text-primary',
                  active && 'bg-primary-12 text-primary',
                )}
              >
                <img src={chain.iconUrl} alt="" className="size-5 rounded-full" />
                <span>{chain.name}</span>
              </button>
            )
          })}
        </div>
      )}
    </nav>
  )
}

export default MobileNavigation
