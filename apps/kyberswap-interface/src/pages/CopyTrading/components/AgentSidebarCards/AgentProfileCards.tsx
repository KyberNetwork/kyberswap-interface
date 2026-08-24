import type { AgentProfile } from 'services/copyTrading/types/agents'

import Badge, { BadgeVariant } from 'components/Badge'
import InfoHelper from 'components/InfoHelper'
import { HStack, Stack } from 'components/Stack'
import { SidePanelCard } from 'pages/CopyTrading/components/AgentSidebarCards/SidePanelCard'
import { getWinRateClassName, getWinRateTone, percent } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'

export const AgentRiskCard = ({ agent }: { agent: AgentProfile }) => {
  const winRatePct = agent.stats.winRatePct
  const winRate = Math.max(0, Math.min(100, Number(winRatePct || 0)))
  const winRateBackgroundClassName = getWinRateClassName(winRatePct, 'background')
  const winRateTone = getWinRateTone(winRatePct)
  const winRateBadgeVariant =
    winRateTone === 'positive'
      ? BadgeVariant.PRIMARY
      : winRateTone === 'warning'
      ? BadgeVariant.WARNING
      : winRateTone === 'negative'
      ? BadgeVariant.NEGATIVE
      : undefined

  return (
    <SidePanelCard>
      <HStack className="items-center gap-4">
        <span className="shrink-0 text-sm font-medium text-subText">Win Rate</span>
        <div className="relative h-7 min-w-0 flex-1">
          <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-subText-20">
            <div className={cn('h-full rounded-full', winRateBackgroundClassName)} style={{ width: winRate + '%' }} />
          </div>
          <Badge
            variant={winRateBadgeVariant}
            className={cn(
              'absolute top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-md py-0.5 text-sm shadow-[0_6px_14px_rgba(0,0,0,0.55)] ring-1 ring-white/20',
              winRateBackgroundClassName,
              winRateTone === 'negative' ? 'text-text' : 'text-black',
            )}
            style={{ left: 'clamp(20px, ' + winRate + '%, calc(100% - 20px))' }}
          >
            {percent(winRatePct)}
          </Badge>
        </div>
      </HStack>
      <HStack className="items-center justify-between">
        <span className="text-sm font-medium text-subText">Max Drawdown</span>
        <span className="text-sm text-text">{percent(agent.stats.maxDrawdownPct)}</span>
      </HStack>
    </SidePanelCard>
  )
}

export const StrategyExecutionCard = ({ items }: { items: AgentProfile['strategyExecutionItems'] }) => {
  return (
    <SidePanelCard title="Strategy & Execution">
      {items.length ? (
        <Stack as="ul" className="list-disc gap-2 pl-4 text-sm text-subText">
          {items.map(item => (
            <li key={item.label + '-' + item.description} className="pl-0">
              <span className="font-medium text-text">{item.label}:</span> {item.description}
            </li>
          ))}
        </Stack>
      ) : (
        <p className="text-sm text-subText">No strategy or execution details available</p>
      )}
    </SidePanelCard>
  )
}

export const WhitelistedTokensCard = ({ tokens }: { tokens: string[] }) => {
  return (
    <SidePanelCard
      title={
        <HStack as="span" className="items-center gap-1">
          Whitelisted Tokens
          <InfoHelper margin={false} placement="top" size={14} text="Agent will trade within this list of tokens" />
        </HStack>
      }
    >
      <HStack className="flex-wrap gap-2">
        {tokens.length ? (
          tokens.map(token => (
            <span
              key={token}
              className="rounded-full border border-darkBorder bg-background px-3 py-1 text-sm font-medium text-subText"
            >
              {token}
            </span>
          ))
        ) : (
          <p className="text-sm font-medium text-subText">No whitelisted tokens</p>
        )}
      </HStack>
    </SidePanelCard>
  )
}
