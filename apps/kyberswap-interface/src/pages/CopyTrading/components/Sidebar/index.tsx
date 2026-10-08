import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Globe } from 'react-feather'
import { useLocation } from 'react-router-dom'
import agentApi from 'services/copyTrading/api/endpoints/agents'
import copyRunApi from 'services/copyTrading/api/endpoints/copyRuns'
import type { AgentCard, Chain } from 'services/copyTrading/types/agents'
import type { CopyRunListItem } from 'services/copyTrading/types/copyRuns'

import { ReactComponent as HistoryIcon } from 'assets/images/copy-trading/ic_history.svg'
import { ReactComponent as OpenCopiesIcon } from 'assets/images/copy-trading/ic_opens.svg'
import { ButtonEmpty } from 'components/Button'
import { Center, HStack, Stack } from 'components/Stack'
import MobileNavigation, { type BreadcrumbItem } from 'pages/CopyTrading/components/Sidebar/MobileNavigation'
import {
  SidebarMenuItem,
  type SidebarRouteState,
  SidebarSection,
  getSidebarRouteState,
} from 'pages/CopyTrading/components/Sidebar/primitives'
import useSidebarData from 'pages/CopyTrading/components/Sidebar/useSidebarData'
import { useCopyTradingContext } from 'pages/CopyTrading/context'
import { getAgentInitials } from 'pages/CopyTrading/helpers'
import { useCopyTradingRoutes } from 'pages/CopyTrading/hooks/useCopyTradingRoutes'
import { cn } from 'utils/cn'

const DEFAULT_VISIBLE_AGENTS = 5
const ACTIVE_COPY_DOT_COLORS = ['bg-primary', 'bg-yellow1', 'bg-blue3', 'bg-lightGreen', 'bg-warning'] as const

type AgentsSectionProps = {
  activeAgentCode: string
  agents: AgentCard[]
  expanded: boolean
  isActive: boolean
  onToggle: () => void
}

type MyCopiesSectionProps = {
  agentById: Map<string, AgentCard>
  runs: CopyRunListItem[]
  route: SidebarRouteState
}

type NetworksSectionProps = {
  chains: Chain[]
  onSelectChain: () => void
  selectedChainId?: number
}

type SidebarContentProps = {
  activeRuns: CopyRunListItem[]
  agentById: Map<string, AgentCard>
  agents: AgentCard[]
  chains: Chain[]
  expandedAgents: boolean
  onSelectChain: () => void
  onToggleAgents: () => void
  route: SidebarRouteState
  selectedChainId?: number
}

const getActiveCopyDotColor = (copyRunId: string) => {
  const colorIndex = Array.from(copyRunId).reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0, 0)
  return ACTIVE_COPY_DOT_COLORS[colorIndex % ACTIVE_COPY_DOT_COLORS.length]
}

const getCopyStatusDotColor = (run: CopyRunListItem) => {
  if (run.status === 'active') return getActiveCopyDotColor(run.copyRunId)
  if (run.status === 'closing') return 'bg-blue'
  if (run.status === 'stopped') return 'bg-red'
  return 'bg-subText'
}

const getBreadcrumbs = (
  basePath: string,
  route: SidebarRouteState,
  detailAgentName: string,
  profileAgentName: string,
): BreadcrumbItem[] => {
  const breadcrumbs: BreadcrumbItem[] = [{ label: 'Copy Trading', to: basePath }]

  if (route.isCopiesPage) {
    breadcrumbs.push(route.activeCopyId ? { label: 'My Copies', to: basePath + '/my-copies' } : { label: 'My Copies' })
    if (route.activeCopyId) breadcrumbs.push({ label: detailAgentName })
    return breadcrumbs
  }

  if (route.isHistorySectionActive) {
    breadcrumbs.push(route.activeCopyId ? { label: 'History', to: basePath + '/history' } : { label: 'History' })
    if (route.activeCopyId) breadcrumbs.push({ label: detailAgentName })
    return breadcrumbs
  }

  breadcrumbs.push(route.isAgentProfilePage ? { label: 'Leaderboard', to: basePath } : { label: 'Leaderboard' })
  if (route.isAgentProfilePage) breadcrumbs.push({ label: profileAgentName })

  return breadcrumbs
}

const AgentItem = ({ activeAgentCode, agent }: { activeAgentCode: string; agent: AgentCard }) => {
  const copyTradingPath = useCopyTradingRoutes()
  const active = activeAgentCode === agent.agentId

  return (
    <SidebarMenuItem to={copyTradingPath(agent.agentId)} active={active} activeStyle="text" layout="row">
      <Center className="size-5 rounded-full bg-subText-20 text-xs text-subText">
        {getAgentInitials(agent.displayName)}
      </Center>
      <span className={cn('text-sm', active ? 'text-primary' : 'text-subText')}>{agent.displayName}</span>
    </SidebarMenuItem>
  )
}

const AgentsSection = ({ activeAgentCode, agents, expanded, isActive, onToggle }: AgentsSectionProps) => {
  const copyTradingPath = useCopyTradingRoutes()
  const basePath = copyTradingPath()
  const visibleAgents = agents.slice(0, DEFAULT_VISIBLE_AGENTS)
  const hiddenAgents = agents.slice(DEFAULT_VISIBLE_AGENTS)

  return (
    <SidebarSection title="Agents" to={basePath} active={isActive} count={agents.length}>
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

const MyCopiesSection = ({ agentById, route, runs }: MyCopiesSectionProps) => {
  const copyTradingPath = useCopyTradingRoutes()
  const basePath = copyTradingPath()
  return (
    <SidebarSection title="My Copies" active={route.isMyCopiesSectionActive}>
      <SidebarMenuItem to={basePath + '/my-copies'} active={route.isCopiesPage} layout="between">
        <HStack className={cn('items-center gap-2 text-sm', route.isCopiesPage ? 'text-primary' : 'text-subText')}>
          <OpenCopiesIcon className="size-4 shrink-0" aria-hidden />
          <span>Open Copies</span>
        </HStack>
        <Center className="size-6 rounded-full bg-primary-12 text-xs font-medium text-primary">{runs.length}</Center>
      </SidebarMenuItem>

      <Stack className="gap-1">
        {runs.map(run => {
          const agent = agentById.get(run.agentId)
          const active = route.activeCopyId === run.copyRunId

          return (
            <SidebarMenuItem
              key={run.copyRunId}
              to={copyTradingPath('my-copies/' + run.copyRunId)}
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

      <SidebarMenuItem to={basePath + '/history'} active={route.isHistorySectionActive} colorByActive layout="row">
        <HistoryIcon className="size-4 shrink-0" aria-hidden />
        <span>History</span>
      </SidebarMenuItem>
    </SidebarSection>
  )
}

const NetworksSection = ({ chains, onSelectChain, selectedChainId }: NetworksSectionProps) => {
  const copyTradingPath = useCopyTradingRoutes()

  return (
    <SidebarSection title="Networks" count={chains.length}>
      <Stack className="gap-1">
        <SidebarMenuItem
          to={copyTradingPath('', 'all')}
          active={selectedChainId === undefined}
          activeStyle="text"
          layout="row"
          colorByActive
          onClick={onSelectChain}
        >
          <Globe className="size-5 shrink-0" />
          <span>All Chains</span>
        </SidebarMenuItem>
        {chains.map(chain => {
          const active = selectedChainId === chain.chainId

          return (
            <SidebarMenuItem
              key={chain.chainId}
              to={copyTradingPath('', chain.chainId)}
              active={active}
              activeStyle="text"
              layout="row"
              onClick={onSelectChain}
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

const SidebarContent = ({
  activeRuns,
  agentById,
  agents,
  chains,
  expandedAgents,
  onSelectChain,
  onToggleAgents,
  route,
  selectedChainId,
}: SidebarContentProps) => (
  <Stack className="gap-5 lg:grid lg:h-full lg:grid-rows-[minmax(0,1fr)_auto]">
    <div className="lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain">
      <Stack className="gap-5">
        <AgentsSection
          activeAgentCode={route.activeAgentCode}
          agents={agents}
          expanded={expandedAgents}
          isActive={route.isAgentsPage}
          onToggle={onToggleAgents}
        />
        <div className="h-px bg-buttonGray" />
        <MyCopiesSection agentById={agentById} route={route} runs={activeRuns} />
      </Stack>
    </div>
    <NetworksSection chains={chains} onSelectChain={onSelectChain} selectedChainId={selectedChainId} />
  </Stack>
)

const Sidebar = () => {
  const copyTradingPath = useCopyTradingRoutes()
  const basePath = copyTradingPath()
  const location = useLocation()
  const { chains, ownerAddress, selectedChainId } = useCopyTradingContext()
  const [expandedAgents, setExpandedAgents] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const sidebarRef = useRef<HTMLElement>(null)
  const previousPathname = useRef(location.pathname)
  const route = getSidebarRouteState(location.pathname, basePath)
  const { agents, activeRuns, refetchOpenCopies } = useSidebarData(ownerAddress, selectedChainId)

  useLayoutEffect(() => {
    const sidebar = sidebarRef.current
    if (!sidebar) return

    // The app header/banner scrolls away, so only subtract the sidebar's visible top offset.
    const updateHeight = () => {
      const top = Math.max(0, sidebar.getBoundingClientRect().top)
      sidebar.style.height = `calc(100dvh - ${top}px)`
    }

    updateHeight()
    const observer = new ResizeObserver(updateHeight)
    observer.observe(document.body)
    window.addEventListener('scroll', updateHeight, { passive: true })
    window.addEventListener('resize', updateHeight)

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', updateHeight)
      window.removeEventListener('resize', updateHeight)
    }
  }, [])

  const { currentData: breadcrumbCopyRun } = copyRunApi.useGetCopyRunQuery(
    { ownerAddress: ownerAddress || '', copyRunId: route.activeCopyId },
    { skip: !ownerAddress || !route.activeCopyId },
  )
  const { currentData: breadcrumbAgent } = agentApi.useGetAgentQuery(
    { agentId: route.activeAgentCode },
    { skip: !route.isAgentProfilePage },
  )

  useEffect(() => {
    if (previousPathname.current === location.pathname) return
    previousPathname.current = location.pathname

    if (ownerAddress) void refetchOpenCopies()
  }, [location.pathname, ownerAddress, refetchOpenCopies])

  const enabledChains = chains.filter(chain => chain.isEnabled)
  const agentById = new Map(agents.map(agent => [agent.agentId, agent]))
  const listedCopyRun = activeRuns.find(run => run.copyRunId === route.activeCopyId)
  const detailAgentName =
    listedCopyRun?.agentSnapshot?.displayName ||
    breadcrumbCopyRun?.data.agentSnapshot?.displayName ||
    agentById.get(breadcrumbCopyRun?.data.agentId || '')?.displayName ||
    '' // Copy Details
  const profileAgentName = breadcrumbAgent?.data.displayName || agentById.get(route.activeAgentCode)?.displayName || '' // Agent Profile
  const breadcrumbs = getBreadcrumbs(basePath, route, detailAgentName, profileAgentName)

  const selectChain = () => {
    setExpandedAgents(false)
    setMobileOpen(false)
  }

  const sidebarContentProps: SidebarContentProps = {
    activeRuns,
    agentById,
    agents,
    chains: enabledChains,
    expandedAgents,
    onSelectChain: selectChain,
    onToggleAgents: () => setExpandedAgents(value => !value),
    route,
    selectedChainId,
  }

  return (
    <>
      <MobileNavigation
        breadcrumbs={breadcrumbs}
        isOpen={mobileOpen}
        onDismiss={() => setMobileOpen(false)}
        onOpen={() => setMobileOpen(true)}
      >
        <SidebarContent {...sidebarContentProps} />
      </MobileNavigation>

      <aside ref={sidebarRef} className="sticky top-0 h-dvh w-60 flex-none overflow-hidden p-6 pb-4 max-lg:hidden">
        <SidebarContent {...sidebarContentProps} />
      </aside>
    </>
  )
}

export default Sidebar
