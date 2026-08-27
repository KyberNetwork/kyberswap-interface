import { useRef } from 'react'
import { Search, X } from 'react-feather'
import type { LeaderboardSummary as LeaderboardSummaryData } from 'services/copyTrading/types/agents'
import type { StrategyKey } from 'services/copyTrading/types/primitives'

import { ButtonEmpty } from 'components/Button'
import { HStack, Stack } from 'components/Stack'
import Leaderboard, { type LeaderboardStat } from 'pages/CopyTrading/components/Leaderboard'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import { compactUsd, formatCount } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'

export const strategyTabs = ['all', 'focused', 'diversified', 'active'] as const

export type StrategyFilter = (typeof strategyTabs)[number]

type StrategyOption = {
  label: string
  shortLabel?: string
  value: StrategyFilter
}

const strategyOptions: readonly StrategyOption[] = [
  { label: 'All Strategies', shortLabel: 'All', value: 'all' },
  { label: 'Focused', value: 'focused' },
  { label: 'Diversified', value: 'diversified' },
  { label: 'Active', value: 'active' },
]

export const toStrategyKey = (strategy: StrategyFilter): StrategyKey | undefined =>
  strategy === 'all' ? undefined : (strategy as StrategyKey)

type LeaderboardSummaryProps = {
  summary?: LeaderboardSummaryData
  loading?: boolean
}

export const LeaderboardSummary = ({ summary, loading }: LeaderboardSummaryProps) => {
  const stats: LeaderboardStat[] = [
    {
      label: 'Total Agents',
      value: formatCount(summary?.totalAgents),
      icon: copyTradingStatIconMap.agents,
      status: summary?.metrics.agentCount?.status,
    },
    {
      label: 'Total AUM',
      value: compactUsd(summary?.totalAumUsd),
      icon: copyTradingStatIconMap.money,
      status: summary?.metrics.totalAumUsd?.status,
    },
    {
      label: 'Total Copiers',
      value: formatCount(summary?.totalCopiers),
      icon: copyTradingStatIconMap.usersPurple,
      status: summary?.metrics.totalCopierCount?.status,
    },
    {
      label: 'Total Volume',
      value: compactUsd(summary?.totalVolumeUsd),
      icon: copyTradingStatIconMap.volume,
      status: summary?.metrics.lifetimeVolumeUsd?.status,
    },
  ]

  return <Leaderboard items={stats} loading={loading} />
}

type StrategyFilterControlProps = {
  activeStrategy: StrategyFilter
  onChange: (strategy: StrategyFilter) => void
}

export const StrategyFilterControl = ({ activeStrategy, onChange }: StrategyFilterControlProps) => {
  return (
    <Stack className="w-full max-w-full lg:w-auto">
      <div className="grid w-full grid-cols-4 gap-1 rounded-xl bg-buttonBlack p-1 lg:min-w-[420px]" role="tablist">
        {strategyOptions.map(option => {
          const active = activeStrategy === option.value

          return (
            <ButtonEmpty
              key={option.value}
              aria-selected={active}
              className={cn(
                'whitespace-nowrap rounded-lg px-1 py-2 text-xs transition-colors sm:px-3 sm:text-sm',
                active ? 'bg-primary-20 text-primary' : 'text-subText hover:bg-primary-10',
              )}
              onClick={() => onChange(option.value)}
              role="tab"
              type="button"
            >
              <span className="sm:hidden">{option.shortLabel || option.label}</span>
              <span className="hidden sm:inline">{option.label}</span>
            </ButtonEmpty>
          )
        })}
      </div>
    </Stack>
  )
}

type SearchInputProps = {
  value: string
  onChange: (value: string) => void
}

export const SearchInput = ({ value, onChange }: SearchInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClear = () => {
    onChange('')
    inputRef.current?.focus()
  }

  return (
    <HStack className="h-11 w-full max-w-sm items-center gap-3 rounded-xl bg-buttonBlack px-4 py-2">
      <input
        ref={inputRef}
        value={value}
        onChange={event => onChange(event.target.value)}
        className="min-w-0 flex-1 border-0 bg-transparent text-sm text-text outline-none placeholder:text-subText"
        placeholder="Search agent, address, or strategy..."
      />
      <HStack className="items-center gap-2">
        {!!value && (
          <ButtonEmpty
            aria-label="Clear search"
            className="size-5 justify-center rounded-full text-subText hover:bg-buttonGray hover:text-text"
            onClick={handleClear}
            padding="0"
            type="button"
          >
            <X size={14} />
          </ButtonEmpty>
        )}
        <Search size={18} className="shrink-0 text-subText" />
      </HStack>
    </HStack>
  )
}
