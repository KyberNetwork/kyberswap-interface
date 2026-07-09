import { type PropsWithChildren, useState } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import { Link, useLocation } from 'react-router-dom'
import type { AgentCard, Chain, CopyRunSummary } from 'services/copyTrading/types'

import { ButtonEmpty } from 'components/Button'
import DropdownMenu from 'components/DropdownMenu'
import { Center, HStack, Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import { useCopyTradingContext } from 'pages/CopyTrading/context'
import { getAgentInitials } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'

type SidebarSectionProps = PropsWithChildren<{
  title: string
  active?: boolean
  count?: number
  onClick?: () => void
  to?: string
}>

const SidebarSection = ({ title, active, count, children, onClick, to }: SidebarSectionProps) => (
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
            'flex size-full items-center justify-between px-4 text-left text-xs font-medium uppercase no-underline hover:text-primary',
            active ? 'text-primary' : 'text-subText',
          )}
        >
          <span>{title}</span>
          {typeof count === 'number' && (
            <Center className="size-5 rounded-full bg-primary-12 text-xs font-medium text-primary">{count}</Center>
          )}
        </Link>
      </div>
    ) : (
      <div
        className={cn(
          'flex h-8 items-center rounded-lg px-4 text-xs font-medium uppercase text-subText',
          active && 'bg-buttonBlack',
        )}
      >
        {title}
      </div>
    )}
    {children}
  </Stack>
)

type SidebarMenuItemProps = PropsWithChildren<{
  to: string
  active?: boolean
  onClick?: () => void
  activeStyle?: 'surface' | 'text'
  layout?: 'default' | 'between' | 'row'
  colorByActive?: boolean
}>

const SidebarMenuItem = ({
  to,
  active,
  children,
  onClick,
  activeStyle = 'surface',
  layout = 'default',
  colorByActive,
}: SidebarMenuItemProps) => (
  <div
    className={cn(
      'h-9 rounded-lg transition-colors hover:bg-primary-10',
      active && activeStyle === 'surface' && 'border-l-2 border-primary bg-primary-12 text-primary',
      active && activeStyle === 'text' && 'text-primary',
    )}
  >
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        'flex size-full items-center px-2 text-left no-underline',
        layout === 'between' && 'justify-between',
        layout === 'row' && 'gap-3',
        colorByActive && 'text-sm hover:text-primary',
        colorByActive && (active ? 'text-primary' : 'text-subText'),
      )}
    >
      {children}
    </Link>
  </div>
)

const DEFAULT_VISIBLE_AGENTS = 5
const ALL_NETWORKS = 'all'

type SidebarProps = {
  agents: AgentCard[]
  activeRuns: CopyRunSummary[]
  chains: Chain[]
}

const Sidebar = ({ agents, activeRuns, chains }: SidebarProps) => {
  const location = useLocation()
  const [expandedAgents, setExpandedAgents] = useState(false)
  const { selectedChainId, setSelectedChainId } = useCopyTradingContext()

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
  const enabledChains = chains.filter(chain => chain.isEnabled)
  const filteredAgents = !selectedChainId
    ? agents
    : agents.filter(agent => agent.chains.some(chain => chain.chainId === selectedChainId))
  const networkDropdownOptions = [
    { label: 'All Networks', value: ALL_NETWORKS },
    ...enabledChains.map(chain => ({
      icon: chain.iconUrl,
      label: chain.name,
      value: String(chain.chainId),
    })),
  ]
  const visibleAgents = expandedAgents ? filteredAgents : filteredAgents.slice(0, DEFAULT_VISIBLE_AGENTS)
  const hiddenAgentCount = filteredAgents.length - visibleAgents.length

  return (
    <aside className="sticky top-0 h-screen w-60 flex-none overflow-y-auto px-8 py-6 max-lg:hidden">
      <Stack className="gap-8">
        <SidebarSection title="My Copies" active={isMyCopiesSectionActive}>
          <SidebarMenuItem to={`${APP_PATHS.COPY_TRADING}/my-copies`} active={isCopiesPage} layout="between">
            <span className={cn('text-sm', isCopiesPage ? 'text-primary' : 'text-subText')}>Open Copies</span>
            <Center className="size-6 rounded-full bg-primary-12 text-xs font-medium text-primary">
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
                  activeStyle="text"
                  layout="row"
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
            colorByActive
          >
            History
          </SidebarMenuItem>
        </SidebarSection>

        <SidebarSection title="Networks">
          <DropdownMenu
            fullWidth
            background="var(--ks-buttonBlack)"
            options={networkDropdownOptions}
            value={selectedChainId ? String(selectedChainId) : ALL_NETWORKS}
            onChange={value => {
              const nextValue = String(value)
              setSelectedChainId(nextValue === ALL_NETWORKS ? undefined : Number(nextValue))
              setExpandedAgents(false)
            }}
          />
        </SidebarSection>

        <SidebarSection title="Agents" to={APP_PATHS.COPY_TRADING} active={isAgentsPage} count={filteredAgents.length}>
          <Stack className="gap-1.5">
            {visibleAgents.map(agent => {
              const activeAgentName = activeProfileAgent?.displayName
              return (
                <SidebarMenuItem
                  key={agent.agentId}
                  to={`${APP_PATHS.COPY_TRADING}/${agent.agentId}`}
                  active={activeAgentName === agent.displayName}
                  activeStyle="text"
                  layout="row"
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
              <ButtonEmpty type="button" onClick={() => setExpandedAgents(value => !value)} padding="8px">
                <HStack className="items-center gap-2">
                  {expandedAgents ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  <span>{expandedAgents ? 'Show less' : `+ ${hiddenAgentCount} more`}</span>
                </HStack>
              </ButtonEmpty>
            )}
          </Stack>
        </SidebarSection>
      </Stack>
    </aside>
  )
}

export default Sidebar
