import { useRef } from 'react'
import { Search, X } from 'react-feather'
import type { LeaderboardSummary as LeaderboardSummaryData, StrategyKey } from 'services/copyTrading/types'

import { ButtonEmpty } from 'components/Button'
import { HStack, Stack } from 'components/Stack'
import Leaderboard, { type LeaderboardStat } from 'pages/CopyTrading/components/Leaderboard'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import { compactUsd } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'

const strategyOptions = [
  { label: 'All Strategies', value: 'all' },
  { label: 'Focused', value: 'focused' },
  { label: 'Diversified', value: 'diversified' },
  { label: 'Active', value: 'active' },
] as const

export type StrategyFilter = (typeof strategyOptions)[number]['value']

export const strategyTabs = strategyOptions.map(option => option.value)

export const toStrategyKey = (strategy: StrategyFilter): StrategyKey | undefined =>
  strategy === 'all' ? undefined : (strategy as StrategyKey)

type LeaderboardSummaryProps = {
  summary?: LeaderboardSummaryData
  fallbackAgentCount?: number
}

export const LeaderboardSummary = ({ summary, fallbackAgentCount }: LeaderboardSummaryProps) => {
  const stats: LeaderboardStat[] = [
    {
      label: 'Total Agents',
      value: String(summary?.totalAgents || fallbackAgentCount || 0),
      icon: copyTradingStatIconMap.agents,
    },
    {
      label: 'Total AUM',
      value: compactUsd(summary?.totalAumUsd),
      icon: copyTradingStatIconMap.money,
    },
    {
      label: 'Total Copiers',
      value: String(summary?.totalCopiers || 0),
      icon: copyTradingStatIconMap.users,
    },
    {
      label: 'Total Volume',
      value: compactUsd(summary?.totalVolumeUsd),
      icon: copyTradingStatIconMap.volume,
    },
  ]

  return <Leaderboard items={stats} />
}

type StrategyFilterControlProps = {
  activeStrategy: StrategyFilter
  onChange: (strategy: StrategyFilter) => void
}

export const StrategyFilterControl = ({ activeStrategy, onChange }: StrategyFilterControlProps) => {
  const activeIndex = strategyOptions.findIndex(option => option.value === activeStrategy)
  const optionCount = strategyOptions.length

  return (
    <Stack className="max-w-full overflow-x-auto">
      <div
        className="relative grid min-w-[420px] gap-1 rounded-xl bg-buttonBlack p-1"
        role="tablist"
        style={{ gridTemplateColumns: `repeat(${optionCount}, minmax(0, 1fr))` }}
      >
        <div
          className="pointer-events-none absolute inset-y-1 left-1 rounded-lg bg-primary-20 [transition:transform_200ms_ease,background_200ms_ease]"
          style={{
            width: `calc((100% - 8px - ${4 * (optionCount - 1)}px) / ${optionCount})`,
            transform: `translateX(calc((100% + 4px) * ${Math.max(activeIndex, 0)}))`,
          }}
        />
        {strategyOptions.map(option => {
          const active = activeStrategy === option.value

          return (
            <ButtonEmpty
              key={option.value}
              aria-selected={active}
              className={cn('relative z-[1] rounded-lg', active ? 'text-primary' : 'text-subText hover:bg-primary-10')}
              onClick={() => onChange(option.value)}
              padding="8px 12px"
              role="tab"
              type="button"
            >
              {option.label}
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
