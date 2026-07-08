import { type ReactNode, useState } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import { Link, useLocation } from 'react-router-dom'
import { CopyTradingMyCopiesOverview, CopyTradingOverview } from 'services/copyTrading'

import DropdownMenu from 'components/DropdownMenu'
import { Center, Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import { cn } from 'utils/cn'

const SidebarSection = ({
  title,
  active,
  count,
  children,
  onClick,
  to,
}: {
  title: string
  active?: boolean
  count?: number
  children: ReactNode
  onClick?: () => void
  to?: string
}) => (
  <Stack className="gap-1.5">
    {to ? (
      <div
        className={cn(
          'h-9 rounded-lg transition-colors hover:bg-primary-10',
          active && 'border-l-2 border-primary bg-primary-12 text-primary',
        )}
      >
        <Link
          to={to}
          onClick={onClick}
          className={cn(
            'flex size-full items-center justify-between px-4 text-left text-xs font-semibold uppercase no-underline hover:text-primary',
            active ? 'text-primary' : 'text-subText',
          )}
        >
          <span>{title}</span>
          {typeof count === 'number' && (
            <Center className="size-5 rounded-full bg-primary-12 text-xs font-semibold text-primary">{count}</Center>
          )}
        </Link>
      </div>
    ) : (
      <div
        className={cn(
          'flex h-9 items-center rounded-lg px-4 text-xs font-semibold uppercase text-subText',
          active && 'bg-buttonBlack',
        )}
      >
        {title}
      </div>
    )}
    {children}
  </Stack>
)

const SidebarMenuItem = ({
  to,
  active,
  children,
  className,
  linkClassName,
  onClick,
  activeClassName = 'border-l-2 border-primary bg-primary-12 text-primary',
}: {
  to: string
  active?: boolean
  children: ReactNode
  className?: string
  linkClassName?: string
  onClick?: () => void
  activeClassName?: string
}) => (
  <div className={cn('h-9 rounded-lg transition-colors hover:bg-primary-10', active && activeClassName, className)}>
    <Link
      to={to}
      onClick={onClick}
      className={cn('flex size-full items-center px-2 text-left no-underline', linkClassName)}
    >
      {children}
    </Link>
  </div>
)

const DEFAULT_VISIBLE_AGENTS = 5
const ALL_NETWORKS = 'All Networks'

const Sidebar = ({
  data,
  myCopiesOverview,
  setSelectedAgent,
}: {
  data: CopyTradingOverview
  myCopiesOverview: CopyTradingMyCopiesOverview
  setSelectedAgent: (agent: string) => void
}) => {
  const location = useLocation()
  const [expandedAgents, setExpandedAgents] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState(ALL_NETWORKS)

  const isLeaderboardPage = location.pathname === APP_PATHS.COPY_TRADING
  const isCopiesPage = location.pathname.startsWith(`${APP_PATHS.COPY_TRADING}/copies`)
  const isCopyDetailPage = location.pathname.startsWith(`${APP_PATHS.COPY_TRADING}/copies/`)
  const isHistoryPage = location.pathname === `${APP_PATHS.COPY_TRADING}/history`
  const isHistoryDetailPage = location.pathname.startsWith(`${APP_PATHS.COPY_TRADING}/history/`)
  const activeAgentCode = location.pathname.replace(`${APP_PATHS.COPY_TRADING}/`, '').split('/')[0]
  const activeProfileAgent = data.leaderboard.find(agent => agent.id === activeAgentCode)
  const isAgentsPage = isLeaderboardPage || !!activeProfileAgent
  const isMyCopiesSectionActive = isCopiesPage || isHistoryPage || isHistoryDetailPage
  const activeCopyId = isCopyDetailPage ? location.pathname.split('/').at(-1) : ''
  const filteredAgents =
    selectedNetwork === ALL_NETWORKS
      ? data.leaderboard
      : data.leaderboard.filter(agent => agent.network === selectedNetwork)
  const networkOptions = [ALL_NETWORKS, ...data.networks]
  const networkDropdownOptions = networkOptions.map(network => ({
    label: network,
    value: network,
  }))
  const visibleAgents = expandedAgents ? filteredAgents : filteredAgents.slice(0, DEFAULT_VISIBLE_AGENTS)
  const hiddenAgentCount = filteredAgents.length - visibleAgents.length

  return (
    <aside className="sticky top-0 h-screen w-60 flex-none overflow-y-auto px-8 py-7 max-lg:hidden">
      <Stack className="gap-8">
        <SidebarSection title="My Copies" active={isMyCopiesSectionActive}>
          <SidebarMenuItem
            to={`${APP_PATHS.COPY_TRADING}/copies`}
            active={isCopiesPage}
            linkClassName="justify-between"
          >
            <span className={cn('text-sm', isCopiesPage ? 'text-primary' : 'text-subText')}>Open Copies</span>
            <Center className="size-6 rounded-full bg-primary-12 text-xs font-semibold text-primary">
              {myCopiesOverview.activeSubscriptions.length}
            </Center>
          </SidebarMenuItem>
          <Stack className="gap-1.5">
            {myCopiesOverview.activeSubscriptions.map(subscription => (
              <SidebarMenuItem
                key={subscription.id}
                to={`${APP_PATHS.COPY_TRADING}/copies/${subscription.id}`}
                active={activeCopyId === subscription.id}
                activeClassName="text-primary"
                linkClassName="gap-3"
              >
                <span className="size-2 rounded-full bg-primary" />
                <span className={cn('text-sm', activeCopyId === subscription.id ? 'text-primary' : 'text-subText')}>
                  {subscription.agent.name}
                </span>
              </SidebarMenuItem>
            ))}
          </Stack>
          <SidebarMenuItem
            to={`${APP_PATHS.COPY_TRADING}/history`}
            active={isHistoryPage || isHistoryDetailPage}
            linkClassName={cn(
              'text-sm hover:text-primary',
              isHistoryPage || isHistoryDetailPage ? 'text-primary' : 'text-subText',
            )}
          >
            History
          </SidebarMenuItem>
        </SidebarSection>

        <SidebarSection title="Networks">
          <DropdownMenu
            fullWidth
            background="var(--ks-buttonBlack)"
            options={networkDropdownOptions}
            value={selectedNetwork}
            onChange={value => {
              setSelectedNetwork(String(value))
              setExpandedAgents(false)
            }}
          />
        </SidebarSection>

        <SidebarSection
          title="Agents"
          to={APP_PATHS.COPY_TRADING}
          active={isAgentsPage}
          count={filteredAgents.length}
          onClick={() => setSelectedAgent('')}
        >
          <Stack className="gap-1.5">
            {visibleAgents.map(agent => {
              const activeAgentName = activeProfileAgent?.name
              return (
                <SidebarMenuItem
                  key={agent.name}
                  to={`${APP_PATHS.COPY_TRADING}/${agent.id}`}
                  active={activeAgentName === agent.name}
                  activeClassName="text-primary"
                  onClick={() => setSelectedAgent(agent.name)}
                  linkClassName="gap-3"
                >
                  <Center className="size-5 rounded-full bg-subText-20 text-xs text-subText">{agent.initials}</Center>
                  <span className={cn('text-sm', activeAgentName === agent.name ? 'text-primary' : 'text-subText')}>
                    {agent.name}
                  </span>
                </SidebarMenuItem>
              )
            })}
            {filteredAgents.length > DEFAULT_VISIBLE_AGENTS && (
              <button
                type="button"
                onClick={() => setExpandedAgents(value => !value)}
                className="flex h-8 cursor-pointer items-center gap-2 rounded-lg border-0 bg-transparent px-2 text-sm text-subText hover:bg-primary-10 hover:text-primary"
              >
                {expandedAgents ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                <span>{expandedAgents ? 'Show less' : `+ ${hiddenAgentCount} more`}</span>
              </button>
            )}
          </Stack>
        </SidebarSection>
      </Stack>
    </aside>
  )
}

export default Sidebar
