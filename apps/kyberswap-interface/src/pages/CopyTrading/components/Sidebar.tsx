import { type ReactNode, useState } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import { Link, useLocation } from 'react-router-dom'
import type { AgentCard, CopyRunSummary } from 'services/copyTrading/types'

import DropdownMenu from 'components/DropdownMenu'
import { Center, Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import { getAgentInitials } from 'pages/CopyTrading/helpers'
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
  agents,
  activeRuns,
  setSelectedAgentId,
}: {
  agents: AgentCard[]
  activeRuns: CopyRunSummary[]
  setSelectedAgentId: (agentId: string) => void
}) => {
  const location = useLocation()
  const [expandedAgents, setExpandedAgents] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState(ALL_NETWORKS)

  const isLeaderboardPage = location.pathname === APP_PATHS.COPY_TRADING
  const isCopiesPage = location.pathname.startsWith(`${APP_PATHS.COPY_TRADING}/my-copies`)
  const isCopyDetailPage = location.pathname.startsWith(`${APP_PATHS.COPY_TRADING}/my-copies/`)
  const isHistoryPage = location.pathname === `${APP_PATHS.COPY_TRADING}/history`
  const isHistoryDetailPage = location.pathname.startsWith(`${APP_PATHS.COPY_TRADING}/history/`)
  const activeAgentCode = location.pathname.replace(`${APP_PATHS.COPY_TRADING}/`, '').split('/')[0]
  const activeProfileAgent = agents.find(agent => agent.agentId === activeAgentCode)
  const isAgentsPage = isLeaderboardPage || !!activeProfileAgent
  const isMyCopiesSectionActive = isCopiesPage || isHistoryPage || isHistoryDetailPage
  const activeCopyId = isCopyDetailPage ? location.pathname.split('/').at(-1) : ''
  const agentById = new Map(agents.map(agent => [agent.agentId, agent]))
  const networks = Array.from(new Set(agents.flatMap(agent => agent.chains.map(chain => chain.name))))
  const filteredAgents =
    selectedNetwork === ALL_NETWORKS
      ? agents
      : agents.filter(agent => agent.chains.some(chain => chain.name === selectedNetwork))
  const networkOptions = [ALL_NETWORKS, ...networks]
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
            to={`${APP_PATHS.COPY_TRADING}/my-copies`}
            active={isCopiesPage}
            linkClassName="justify-between"
          >
            <span className={cn('text-sm', isCopiesPage ? 'text-primary' : 'text-subText')}>Open Copies</span>
            <Center className="size-6 rounded-full bg-primary-12 text-xs font-semibold text-primary">
              {activeRuns.length}
            </Center>
          </SidebarMenuItem>
          <Stack className="gap-1.5">
            {activeRuns.map(run => {
              const agent = agentById.get(run.agentId)

              return (
                <SidebarMenuItem
                  key={run.copyRunId}
                  to={`${APP_PATHS.COPY_TRADING}/my-copies/${run.copyRunId}`}
                  active={activeCopyId === run.copyRunId}
                  activeClassName="text-primary"
                  linkClassName="gap-3"
                >
                  <span className="size-2 rounded-full bg-primary" />
                  <span className={cn('text-sm', activeCopyId === run.copyRunId ? 'text-primary' : 'text-subText')}>
                    {agent?.displayName || run.agentId}
                  </span>
                </SidebarMenuItem>
              )
            })}
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
          onClick={() => setSelectedAgentId('')}
        >
          <Stack className="gap-1.5">
            {visibleAgents.map(agent => {
              const activeAgentName = activeProfileAgent?.displayName
              return (
                <SidebarMenuItem
                  key={agent.agentId}
                  to={`${APP_PATHS.COPY_TRADING}/${agent.agentId}`}
                  active={activeAgentName === agent.displayName}
                  activeClassName="text-primary"
                  onClick={() => setSelectedAgentId(agent.agentId)}
                  linkClassName="gap-3"
                >
                  <Center className="size-5 rounded-full bg-subText-20 text-xs text-subText">
                    {getAgentInitials(agent.displayName)}
                  </Center>
                  <span
                    className={cn('text-sm', activeAgentName === agent.displayName ? 'text-primary' : 'text-subText')}
                  >
                    {agent.displayName}
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
