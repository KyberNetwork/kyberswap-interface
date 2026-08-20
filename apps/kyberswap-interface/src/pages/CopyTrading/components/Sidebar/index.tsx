import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import { useLocation } from 'react-router-dom'
import copyRunApi from 'services/copyTrading/api/endpoints/copyRuns'
import discoveryApi from 'services/copyTrading/api/endpoints/discovery'
import type { AgentCard, Chain } from 'services/copyTrading/types/agents'
import type { CopyRunSummary } from 'services/copyTrading/types/copyRuns'

import { ButtonEmpty } from 'components/Button'
import { Center, HStack, Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import MobileNavigation from 'pages/CopyTrading/components/Sidebar/MobileNavigation'
import {
  SidebarMenuItem,
  type SidebarRouteState,
  SidebarSection,
  getSidebarRouteState,
} from 'pages/CopyTrading/components/Sidebar/primitives'
import { useCopyTradingContext } from 'pages/CopyTrading/context'
import { getAgentInitials } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'

const SIDEBAR_ITEM_LIMIT = 10
const DEFAULT_VISIBLE_AGENTS = 5
const ACTIVE_COPY_DOT_COLORS = ['bg-primary', 'bg-yellow1', 'bg-blue3', 'bg-lightGreen', 'bg-warning'] as const

const AgentItem = ({ activeAgentCode, agent }: { activeAgentCode: string; agent: AgentCard }) => {
  const active = activeAgentCode === agent.agentId

  return (
    <SidebarMenuItem to={APP_PATHS.COPY_TRADING + '/' + agent.agentId} active={active} activeStyle="text" layout="row">
      <Center className="size-5 rounded-full bg-subText-20 text-xs text-subText">
        {getAgentInitials(agent.displayName)}
      </Center>
      <span className={cn('text-sm', active ? 'text-primary' : 'text-subText')}>{agent.displayName}</span>
    </SidebarMenuItem>
  )
}

type AgentsSectionProps = {
  activeAgentCode: string
  agents: AgentCard[]
  expanded: boolean
  isActive: boolean
  onToggle: () => void
}

const AgentsSection = ({ activeAgentCode, agents, expanded, isActive, onToggle }: AgentsSectionProps) => {
  const visibleAgents = agents.slice(0, DEFAULT_VISIBLE_AGENTS)
  const hiddenAgents = agents.slice(DEFAULT_VISIBLE_AGENTS)

  return (
    <SidebarSection title="Agents" to={APP_PATHS.COPY_TRADING} active={isActive} count={agents.length}>
      <Stack className="gap-1">
        {visibleAgents.map(agent => (
          <AgentItem key={agent.agentId} activeAgentCode={activeAgentCode} agent={agent} />
        ))}

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <Stack className="gap-1">
                {hiddenAgents.map(agent => (
                  <AgentItem key={agent.agentId} activeAgentCode={activeAgentCode} agent={agent} />
                ))}
              </Stack>
            </motion.div>
          )}
        </AnimatePresence>

        {!!hiddenAgents.length && (
          <ButtonEmpty type="button" onClick={onToggle} padding="4px 10px" className="w-fit">
            <HStack className="items-center gap-2">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span>{expanded ? 'Show less' : '+ ' + hiddenAgents.length + ' more'}</span>
            </HStack>
          </ButtonEmpty>
        )}
      </Stack>
    </SidebarSection>
  )
}

const getActiveCopyDotColor = (copyRunId: string) => {
  const colorIndex = Array.from(copyRunId).reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0, 0)
  return ACTIVE_COPY_DOT_COLORS[colorIndex % ACTIVE_COPY_DOT_COLORS.length]
}

const getCopyStatusDotColor = (run: CopyRunSummary) => {
  if (run.status === 'active') return getActiveCopyDotColor(run.copyRunId)
  if (run.status === 'closing') return 'bg-blue'
  if (run.status === 'stopped') return 'bg-red'
  return 'bg-subText'
}

type MyCopiesSectionProps = {
  agentById: Map<string, AgentCard>
  runs: CopyRunSummary[]
  route: SidebarRouteState
}

const MyCopiesSection = ({ agentById, route, runs }: MyCopiesSectionProps) => {
  return (
    <SidebarSection title="My Copies" active={route.isMyCopiesSectionActive}>
      <SidebarMenuItem to={APP_PATHS.COPY_TRADING + '/my-copies'} active={route.isCopiesPage} layout="between">
        <span className={cn('text-sm', route.isCopiesPage ? 'text-primary' : 'text-subText')}>Open Copies</span>
        <Center className="size-6 rounded-full bg-primary-12 text-xs font-medium text-primary">{runs.length}</Center>
      </SidebarMenuItem>

      <Stack className="gap-1">
        {runs.map(run => {
          const agent = agentById.get(run.agentId)
          const active = route.activeCopyId === run.copyRunId

          return (
            <SidebarMenuItem
              key={run.copyRunId}
              to={APP_PATHS.COPY_TRADING + '/my-copies/' + run.copyRunId}
              active={active}
              activeStyle="text"
              layout="row"
            >
              <span
                role="img"
                aria-label={'Copy status: ' + run.status}
                className={cn('size-2 shrink-0 rounded-full', getCopyStatusDotColor(run))}
              />
              <span className={cn('text-sm', active ? 'text-primary' : 'text-subText')}>
                {run.agentSnapshot?.displayName || agent?.displayName || run.agentId}
              </span>
            </SidebarMenuItem>
          )
        })}
      </Stack>

      <SidebarMenuItem to={APP_PATHS.COPY_TRADING + '/history'} active={route.isHistorySectionActive} colorByActive>
        History
      </SidebarMenuItem>
    </SidebarSection>
  )
}

const NetworksSection = ({
  chains,
  onSelectChain,
  selectedChainId,
}: {
  chains: Chain[]
  onSelectChain: (chainId: number) => void
  selectedChainId?: number
}) => {
  return (
    <SidebarSection title="Networks" count={chains.length}>
      <Stack className="gap-1">
        {chains.map(chain => {
          const active = selectedChainId === chain.chainId

          return (
            <SidebarMenuItem
              key={chain.chainId}
              active={active}
              activeStyle="text"
              layout="row"
              onClick={() => onSelectChain(chain.chainId)}
            >
              <img src={chain.iconUrl} alt="" className="size-5 rounded-full" />
              <span className={cn('truncate text-sm', active ? 'text-primary' : 'text-subText')}>{chain.name}</span>
            </SidebarMenuItem>
          )
        })}
      </Stack>
    </SidebarSection>
  )
}

const Sidebar = () => {
  const location = useLocation()
  const { chains, ownerAddress, selectedChainId, setSelectedChainId } = useCopyTradingContext()
  const [expandedAgents, setExpandedAgents] = useState(false)
  const previousPathname = useRef(location.pathname)

  const { data: leaderboard } = discoveryApi.useGetLeaderboardQuery(
    { chainId: selectedChainId, limit: SIDEBAR_ITEM_LIMIT },
    { pollingInterval: 10_000, skip: selectedChainId === undefined },
  )
  const { currentData: openCopies, refetch: refetchOpenCopies } = copyRunApi.useGetCopyRunsQuery(
    {
      ownerAddress: ownerAddress || '',
      view: 'open',
      limit: SIDEBAR_ITEM_LIMIT,
    },
    { pollingInterval: 10_000, skip: !ownerAddress },
  )

  useEffect(() => {
    if (previousPathname.current === location.pathname) return
    previousPathname.current = location.pathname

    if (ownerAddress) void refetchOpenCopies()
  }, [location.pathname, ownerAddress, refetchOpenCopies])

  const agents = leaderboard?.data || []
  const activeRuns = ownerAddress ? openCopies?.data || [] : []
  const enabledChains = chains.filter(chain => chain.isEnabled)
  const agentById = new Map(agents.map(agent => [agent.agentId, agent]))
  const route = getSidebarRouteState(location.pathname)

  const selectChain = (chainId: number) => {
    setSelectedChainId(chainId)
    setExpandedAgents(false)
  }

  return (
    <>
      <MobileNavigation
        agentsCount={agents.length}
        chains={enabledChains}
        copiesCount={activeRuns.length}
        onSelectChain={selectChain}
        route={route}
        selectedChainId={selectedChainId}
      />

      <aside className="sticky top-0 h-screen w-60 flex-none overflow-y-auto px-8 py-6 max-lg:hidden">
        <Stack className="gap-6">
          <MyCopiesSection agentById={agentById} route={route} runs={activeRuns} />
          <AgentsSection
            activeAgentCode={route.activeAgentCode}
            agents={agents}
            expanded={expandedAgents}
            isActive={route.isAgentsPage}
            onToggle={() => setExpandedAgents(value => !value)}
          />
          <NetworksSection chains={enabledChains} onSelectChain={selectChain} selectedChainId={selectedChainId} />
        </Stack>
      </aside>
    </>
  )
}

export default Sidebar
