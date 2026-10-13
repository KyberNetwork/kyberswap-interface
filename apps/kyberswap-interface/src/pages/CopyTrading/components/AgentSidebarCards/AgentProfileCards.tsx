import type { AgentProfile } from 'services/copyTrading/types/agents'

import InfoHelper from 'components/InfoHelper'
import { HStack, Stack } from 'components/Stack'
import { SidePanelCard } from 'pages/CopyTrading/components/AgentSidebarCards/SidePanelCard'
import { getWinRateClassName, percent } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'

type RiskCardProps = Pick<AgentProfile['stats'], 'maxDrawdownPct' | 'winRatePct'>

export const RiskCard = ({ maxDrawdownPct, winRatePct }: RiskCardProps) => {
  return (
    <SidePanelCard bodyClassName="gap-3 py-4">
      <HStack className="min-h-6 items-center justify-between gap-2">
        <span className="text-sm font-medium text-subText">Win Rate</span>
        <span className={cn('text-base font-medium leading-5', getWinRateClassName(winRatePct))}>
          {percent(winRatePct)}
        </span>
      </HStack>
      <HStack className="min-h-6 items-center justify-between gap-2">
        <HStack className="min-h-6 items-center gap-1 text-sm font-medium text-subText">
          <span>Max Drawdown</span>
          <InfoHelper
            margin={false}
            placement="top"
            size={12}
            text="The largest percentage decline from a peak to a subsequent low in the agent's portfolio value."
          />
        </HStack>
        <span className="text-base font-medium leading-5 text-text">{percent(maxDrawdownPct)}</span>
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
