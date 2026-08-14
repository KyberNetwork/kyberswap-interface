import { AnimatePresence, motion } from 'framer-motion'
import { type PropsWithChildren, useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import { Link, useLocation } from 'react-router-dom'
import copyTradingApi from 'services/copyTrading'
import type { CopyRunSummary } from 'services/copyTrading/types'

import { ButtonEmpty } from 'components/Button'
import { Center, HStack, Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import { useCopyTradingContext } from 'pages/CopyTrading/context'
import { getAgentInitials } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'

const DEFAULT_VISIBLE_AGENTS = 5
const SIDEBAR_ITEM_LIMIT = 10
const ACTIVE_COPY_DOT_COLORS = ['bg-primary', 'bg-yellow1', 'bg-blue3', 'bg-lightGreen', 'bg-warning'] as const

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

type SidebarSectionProps = PropsWithChildren<{
  title: string
  active?: boolean
  count?: number
  onClick?: () => void
  to?: string
}>

const SidebarSection = ({ title, active, count, children, onClick, to }: SidebarSectionProps) => (
  <Stack className="gap-1">
    {to ? (
      <div
        className={cn(
          'h-9 rounded-lg hover:bg-primary-10',
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
            <Center className="size-5 rounded-full bg-primary-12 text-xs font-medium text-primary">{count}</Center>
          )}
        </Link>
      </div>
    ) : (
      <div
        className={cn(
          'flex h-8 items-center justify-between rounded-lg px-4 text-xs font-semibold uppercase text-subText',
          active && 'bg-buttonBlack',
        )}
      >
        <span>{title}</span>
        {typeof count === 'number' && (
          <Center className="size-5 rounded-full bg-primary-12 text-xs font-medium text-primary">{count}</Center>
        )}
      </div>
    )}
    {children}
  </Stack>
)

type SidebarMenuItemProps = PropsWithChildren<{
  to?: string
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
}: SidebarMenuItemProps) => {
  const className = cn(
    'flex size-full items-center px-2 text-left font-medium no-underline',
    layout === 'between' && 'justify-between',
    layout === 'row' && 'gap-3',
    colorByActive && 'text-sm hover:text-primary',
    colorByActive && (active ? 'text-primary' : 'text-subText'),
  )

  return (
    <div
      className={cn(
        'h-9 rounded-lg hover:bg-primary-10',
        active && activeStyle === 'surface' && 'border-l-2 border-primary bg-primary-12 text-primary',
        active && activeStyle === 'text' && 'text-primary',
      )}
    >
      {to ? (
        <Link to={to} onClick={onClick} className={className}>
          {children}
        </Link>
      ) : (
        <button type="button" onClick={onClick} className={className}>
          {children}
        </button>
      )}
    </div>
  )
}

const Sidebar = () => {
  const location = useLocation()
  const { chains, ownerAddress, selectedChainId, setSelectedChainId } = useCopyTradingContext()
  const [expandedAgents, setExpandedAgents] = useState(false)
  const previousPathname = useRef(location.pathname)

  const { data: leaderboard } = copyTradingApi.useGetLeaderboardQuery(
    { chainId: selectedChainId, limit: SIDEBAR_ITEM_LIMIT },
    { skip: selectedChainId === undefined },
  )

  const { data: openCopies, refetch: refetchOpenCopies } = copyTradingApi.useGetCopyRunsQuery(
    {
      ownerAddress: ownerAddress || '',
      view: 'open',
      limit: SIDEBAR_ITEM_LIMIT,
    },
    { skip: !ownerAddress },
  )

  useEffect(() => {
    if (previousPathname.current === location.pathname) return
    previousPathname.current = location.pathname

    if (ownerAddress) void refetchOpenCopies()
  }, [location.pathname, ownerAddress, refetchOpenCopies])

  const agents = leaderboard?.data || []
  const activeRuns = openCopies?.data || []

  const isLeaderboardPage = location.pathname === APP_PATHS.COPY_TRADING
  const isCopiesPage = location.pathname.startsWith(`${APP_PATHS.COPY_TRADING}/my-copies`)
  const isCopyDetailPage = location.pathname.startsWith(`${APP_PATHS.COPY_TRADING}/my-copies/`)
  const isHistoryPage = location.pathname === `${APP_PATHS.COPY_TRADING}/history`
  const isHistoryDetailPage = location.pathname.startsWith(`${APP_PATHS.COPY_TRADING}/history/`)
  const activeAgentCode = location.pathname.replace(`${APP_PATHS.COPY_TRADING}/`, '').split('/')[0]
  const isAgentProfilePage =
    location.pathname.startsWith(`${APP_PATHS.COPY_TRADING}/`) &&
    !isCopiesPage &&
    !isHistoryPage &&
    !isHistoryDetailPage
  const isAgentsPage = isLeaderboardPage || isAgentProfilePage
  const isMyCopiesSectionActive = isCopiesPage || isHistoryPage || isHistoryDetailPage
  const activeCopyId = isCopyDetailPage ? location.pathname.split('/').at(-1) : ''

  const agentById = new Map(agents.map(agent => [agent.agentId, agent]))
  const enabledChains = chains.filter(chain => chain.isEnabled)
  const visibleAgents = agents.slice(0, DEFAULT_VISIBLE_AGENTS)
  const hiddenAgents = agents.slice(DEFAULT_VISIBLE_AGENTS)
  const hiddenAgentCount = hiddenAgents.length

  const mobileNavigation = [
    {
      active: isAgentsPage,
      count: agents.length,
      label: 'Agents',
      to: APP_PATHS.COPY_TRADING,
    },
    {
      active: isCopiesPage,
      count: activeRuns.length,
      label: 'Open Copies',
      to: `${APP_PATHS.COPY_TRADING}/my-copies`,
    },
    {
      active: isHistoryPage || isHistoryDetailPage,
      label: 'History',
      to: `${APP_PATHS.COPY_TRADING}/history`,
    },
  ]

  return (
    <>
      <nav aria-label="Copy Trading" className="hidden border-b border-darkBorder bg-black px-4 py-3 max-lg:block">
        <div className="flex gap-2 overflow-x-auto">
          {mobileNavigation.map(item => (
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

        {!!enabledChains.length && (
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {enabledChains.map(chain => {
              const active = selectedChainId === chain.chainId

              return (
                <button
                  key={chain.chainId}
                  type="button"
                  onClick={() => {
                    setSelectedChainId(chain.chainId)
                    setExpandedAgents(false)
                  }}
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

      <aside className="sticky top-0 h-screen w-60 flex-none overflow-y-auto px-8 py-6 max-lg:hidden">
        <Stack className="gap-6">
          <SidebarSection title="My Copies" active={isMyCopiesSectionActive}>
            <SidebarMenuItem to={`${APP_PATHS.COPY_TRADING}/my-copies`} active={isCopiesPage} layout="between">
              <span className={cn('text-sm', isCopiesPage ? 'text-primary' : 'text-subText')}>Open Copies</span>
              <Center className="size-6 rounded-full bg-primary-12 text-xs font-medium text-primary">
                {activeRuns.length}
              </Center>
            </SidebarMenuItem>
            <Stack className="gap-1">
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
                    <span
                      role="img"
                      aria-label={`Copy status: ${run.status}`}
                      className={cn('size-2 shrink-0 rounded-full', getCopyStatusDotColor(run))}
                    />
                    <span className={cn('text-sm', activeCopyId === run.copyRunId ? 'text-primary' : 'text-subText')}>
                      {run.agentSnapshot?.displayName || agent?.displayName || run.agentId}
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

          <SidebarSection title="Agents" to={APP_PATHS.COPY_TRADING} active={isAgentsPage} count={agents.length}>
            <Stack className="gap-1">
              {visibleAgents.map(agent => {
                const active = activeAgentCode === agent.agentId
                return (
                  <SidebarMenuItem
                    key={agent.agentId}
                    to={`${APP_PATHS.COPY_TRADING}/${agent.agentId}`}
                    active={active}
                    activeStyle="text"
                    layout="row"
                  >
                    <Center className="size-5 rounded-full bg-subText-20 text-xs text-subText">
                      {getAgentInitials(agent.displayName)}
                    </Center>
                    <span className={cn('text-sm', active ? 'text-primary' : 'text-subText')}>{agent.displayName}</span>
                  </SidebarMenuItem>
                )
              })}
              <AnimatePresence initial={false}>
                {expandedAgents && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <Stack className="gap-1">
                      {hiddenAgents.map(agent => {
                        const active = activeAgentCode === agent.agentId
                        return (
                          <SidebarMenuItem
                            key={agent.agentId}
                            to={`${APP_PATHS.COPY_TRADING}/${agent.agentId}`}
                            active={active}
                            activeStyle="text"
                            layout="row"
                          >
                            <Center className="size-5 rounded-full bg-subText-20 text-xs text-subText">
                              {getAgentInitials(agent.displayName)}
                            </Center>
                            <span className={cn('text-sm', active ? 'text-primary' : 'text-subText')}>
                              {agent.displayName}
                            </span>
                          </SidebarMenuItem>
                        )
                      })}
                    </Stack>
                  </motion.div>
                )}
              </AnimatePresence>
              {!!hiddenAgentCount && (
                <ButtonEmpty
                  type="button"
                  onClick={() => setExpandedAgents(value => !value)}
                  padding="4px 10px"
                  className="w-fit"
                >
                  <HStack className="items-center gap-2">
                    {expandedAgents ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    <span>{expandedAgents ? 'Show less' : `+ ${hiddenAgentCount} more`}</span>
                  </HStack>
                </ButtonEmpty>
              )}
            </Stack>
          </SidebarSection>

          <SidebarSection title="Networks" count={enabledChains.length}>
            <Stack className="gap-1">
              {enabledChains.map(chain => {
                const active = selectedChainId === chain.chainId

                return (
                  <SidebarMenuItem
                    key={chain.chainId}
                    active={active}
                    activeStyle="text"
                    layout="row"
                    onClick={() => {
                      setSelectedChainId(chain.chainId)
                      setExpandedAgents(false)
                    }}
                  >
                    <img src={chain.iconUrl} alt="" className="size-5 rounded-full" />
                    <span className={cn('truncate text-sm', active ? 'text-primary' : 'text-subText')}>
                      {chain.name}
                    </span>
                  </SidebarMenuItem>
                )
              })}
            </Stack>
          </SidebarSection>
        </Stack>
      </aside>
    </>
  )
}

export default Sidebar
