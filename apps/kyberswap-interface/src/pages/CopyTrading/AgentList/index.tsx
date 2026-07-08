import { useMemo, useState } from 'react'
import { Search, Zap } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import type { AgentCard, LeaderboardSummary } from 'services/copyTrading/types'

import { HStack, Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import useTab from 'hooks/useTab'
import { AgentCell } from 'pages/CopyTrading/components/AgentIdentity'
import { HeaderCell } from 'pages/CopyTrading/components/HeaderCell'
import { StatCard, type StatItem } from 'pages/CopyTrading/components/Stats'
import { TableCell, TableHeader, TableRow } from 'pages/CopyTrading/components/Table'
import { compactUsd, percent, strategyLabel } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'

const leaderboardColumns =
  'minmax(0, 2.2fr) minmax(0, 0.9fr) minmax(0, 0.85fr) minmax(0, 0.85fr) minmax(0, 0.75fr) minmax(0, 0.85fr) minmax(0, 0.75fr) minmax(0, 0.8fr)'

const strategies = ['All Strategies', 'Focused', 'Diversified', 'Active'] as const
type StrategyFilter = (typeof strategies)[number]

const AgentListView = ({
  leaderboardSummary,
  agents,
  selectedAgentId,
  setSelectedAgentId,
}: {
  leaderboardSummary?: LeaderboardSummary
  agents: AgentCard[]
  selectedAgentId: string
  setSelectedAgentId: (agentId: string) => void
}) => {
  const navigate = useNavigate()
  const [copiedAgent, setCopiedAgent] = useState('')
  const { activeTab, setActiveTab } = useTab<StrategyFilter>({
    tabs: [...strategies],
    defaultTab: 'All Strategies',
    queryKey: 'strategy',
  })

  const leaderboard = useMemo(() => {
    if (!activeTab || activeTab === 'All Strategies') return agents
    return agents.filter(agent => strategyLabel(agent.strategy) === activeTab)
  }, [activeTab, agents])

  const stats: StatItem[] = [
    {
      icon: 'agent',
      value: String(leaderboardSummary?.totalAgents || agents.length),
      label: 'Total Agents',
      color: 'bg-warning-20 text-warning',
    },
    {
      icon: 'aum',
      value: compactUsd(leaderboardSummary?.totalAumUsd),
      label: 'Total AUM',
      color: 'bg-blue/20 text-blue',
    },
    {
      icon: 'copiers',
      value: String(leaderboardSummary?.totalCopiers || 0),
      label: 'Total Copiers',
      color: 'bg-primary-20 text-primary',
    },
    {
      icon: 'volume',
      value: compactUsd(leaderboardSummary?.totalVolumeUsd),
      label: 'Total Volume',
      color: 'bg-primary-12 text-primary',
    },
  ]

  return (
    <main className="min-w-0 flex-1 px-10 py-14 max-md:px-4 max-md:py-8">
      <Stack className="w-full gap-8">
        <Stack className="gap-3.5">
          <h1 className="m-0 text-4xl font-semibold leading-tight text-text max-md:text-3xl">
            Agent <span className="font-normal text-primary">Leaderboard</span>
          </h1>
          <p className="m-0 text-lg text-subText">
            Automatically delegate to top on-chain AI agents. Maintain full custody of your assets. Pay fees only on
            realized profits.
          </p>
        </Stack>

        <Stack className="gap-7">
          <div className="grid grid-cols-4 gap-6 max-xl:grid-cols-2 max-md:grid-cols-1">
            {stats.map(item => (
              <StatCard key={item.label} item={item} />
            ))}
          </div>

          <HStack className="flex-wrap items-center justify-between gap-4">
            <HStack className="rounded-xl bg-buttonBlack p-1">
              {strategies.map(strategy => (
                <button
                  key={strategy}
                  type="button"
                  onClick={() => setActiveTab(strategy)}
                  className={cn(
                    'h-10 cursor-pointer rounded-lg border-0 bg-transparent px-4 text-sm text-subText transition-colors hover:bg-primary-10 hover:text-primary',
                    activeTab === strategy && 'bg-primary-12 text-primary ring-1 ring-primary-20',
                  )}
                >
                  {strategy}
                </button>
              ))}
            </HStack>

            <HStack className="h-11 w-full max-w-md items-center gap-3 rounded-xl bg-buttonBlack px-4">
              <input
                className="min-w-0 flex-1 border-0 bg-transparent text-sm text-text outline-none placeholder:text-subText"
                placeholder="Search agent, address, or strategy ..."
              />
              <Search size={18} className="shrink-0 text-subText" />
            </HStack>
          </HStack>
        </Stack>

        <Stack className="overflow-hidden rounded-xl bg-buttonBlack">
          <Stack className="overflow-hidden">
            <TableHeader columns={leaderboardColumns} className="normal-case">
              <HeaderCell>Agent</HeaderCell>
              <HeaderCell>
                Agent APR <span className="rounded-md bg-background px-2 py-1">30D</span>
              </HeaderCell>
              <HeaderCell>Win Rates</HeaderCell>
              <HeaderCell>Volume</HeaderCell>
              <HeaderCell>Copiers</HeaderCell>
              <HeaderCell>AUM</HeaderCell>
              <HeaderCell>Position</HeaderCell>
              <TableCell />
            </TableHeader>
            {leaderboard.map(agent => (
              <TableRow
                key={agent.agentId}
                columns={leaderboardColumns}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    setSelectedAgentId(agent.agentId)
                    navigate(`${APP_PATHS.COPY_TRADING}/${agent.agentId}`)
                  }
                }}
                role="button"
                tabIndex={0}
                className={cn(
                  'cursor-pointer text-base',
                  (selectedAgentId ? selectedAgentId === agent.agentId : leaderboard.indexOf(agent) === 1)
                    ? 'border-l-2 border-primary bg-primary-20'
                    : 'bg-buttonBlack',
                )}
                onClick={() => {
                  setSelectedAgentId(agent.agentId)
                  navigate(`${APP_PATHS.COPY_TRADING}/${agent.agentId}`)
                }}
              >
                <AgentCell agent={agent} className="px-3 py-2" />
                <HStack className="items-center gap-1.5 px-3 py-2 text-primary">
                  <Zap size={14} className="fill-warning text-warning" />
                  <span>{percent(agent.stats.apr30dPct)}</span>
                </HStack>
                <TableCell>{percent(agent.stats.winRatePct)}</TableCell>
                <TableCell>{compactUsd(agent.stats.volumeUsd)}</TableCell>
                <TableCell>{agent.stats.copiers.toLocaleString()}</TableCell>
                <TableCell>{compactUsd(agent.stats.aumUsd)}</TableCell>
                <TableCell>{agent.stats.openPositions}</TableCell>
                <div className="px-3 py-2">
                  <button
                    type="button"
                    onClick={event => {
                      event.stopPropagation()
                      setCopiedAgent(agent.agentId)
                    }}
                    className={cn(
                      'h-9 w-full cursor-pointer rounded-xl border-0 text-sm font-semibold transition-colors',
                      copiedAgent === agent.agentId
                        ? 'bg-primary-20 text-primary'
                        : 'bg-primary text-black hover:bg-primary-30',
                    )}
                  >
                    {copiedAgent === agent.agentId ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </TableRow>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </main>
  )
}

export default AgentListView
