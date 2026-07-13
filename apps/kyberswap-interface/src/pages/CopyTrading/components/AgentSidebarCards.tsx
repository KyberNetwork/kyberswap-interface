import { type PropsWithChildren, type ReactNode } from 'react'
import type { AgentProfile } from 'services/copyTrading/types'

import { ButtonLight, ButtonPrimary } from 'components/Button'
import InfoHelper from 'components/InfoHelper'
import { Center, HStack, Stack } from 'components/Stack'
import { percent } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'

type SidePanelCardProps = PropsWithChildren<{
  bodyClassName?: string
  title?: ReactNode
}>

export const SidePanelCard = ({ bodyClassName, children, title }: SidePanelCardProps) => (
  <Stack className="overflow-hidden rounded-xl bg-buttonBlack">
    {title && <h3 className="border-b border-darkBorder px-4 py-3 text-base font-medium text-text">{title}</h3>}
    <Stack className={cn('gap-3 px-4 py-3', bodyClassName)}>{children}</Stack>
  </Stack>
)

type CurrentCopyCardProps = {
  capital: string
  title?: string
}

export const CurrentCopyCard = ({ capital, title = 'Your Current Copy' }: CurrentCopyCardProps) => (
  <SidePanelCard title={title}>
    <HStack className="items-center justify-between">
      <span className="text-subText">Capital In</span>
      <span className="text-xl font-medium text-primary">{capital}</span>
    </HStack>
    <HStack className="gap-3 max-md:flex-col">
      <div className="w-full flex-1">
        <ButtonLight type="button" padding="10px 12px">
          My Copy
        </ButtonLight>
      </div>
      <div className="w-full flex-1">
        <ButtonPrimary type="button" padding="10px 12px">
          Add Capital
        </ButtonPrimary>
      </div>
    </HStack>
  </SidePanelCard>
)

type AgentRiskCardProps = {
  agent: AgentProfile
}

export const AgentRiskCard = ({ agent }: AgentRiskCardProps) => {
  const winRatePct = agent.stats.winRatePct
  const winRate = Math.max(0, Math.min(100, Number(winRatePct || 0)))

  return (
    <SidePanelCard>
      <HStack className="items-center gap-4">
        <span className="shrink-0 text-sm font-medium text-subText">Win Rate</span>
        <div className="relative h-7 min-w-0 flex-1">
          <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-subText-20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue to-primary"
              style={{ width: `${winRate}%` }}
            />
          </div>
          <Center
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md bg-primary px-2 py-0.5 text-sm font-medium text-black shadow-sm ring-1"
            style={{ left: `${winRate}%` }}
          >
            {percent(winRatePct)}
          </Center>
        </div>
      </HStack>
      <HStack className="items-center justify-between">
        <span className="text-sm text-subText">Max Drawdown</span>
        <span className="text-sm text-text">-12.5%</span>
      </HStack>
    </SidePanelCard>
  )
}

export const StrategyExecutionCard = () => (
  <SidePanelCard title="Strategy & Execution">
    <Stack as="ul" className="list-disc gap-2 pl-4 text-sm text-subText">
      <li className="pl-0">
        <span className="font-medium text-text">Momentum Tracking:</span> Aims to capture sustained price movements
        across L2 networks.
      </li>
      <li className="pl-0">
        <span className="font-medium text-text">Execution Model:</span> Sequential follower execution. Slight lag may
        occur between agent and follower trades.
      </li>
      <li className="pl-0">
        <span className="font-medium text-text">v1 Constraints:</span> Trades only vs Stablecoins (USDC). TP/SL limits
        are manual.
      </li>
    </Stack>
  </SidePanelCard>
)

type WishlistedTokensCardProps = {
  tokens: string[]
}

export const WishlistedTokensCard = ({ tokens }: WishlistedTokensCardProps) => (
  <SidePanelCard
    title={
      <HStack className="items-center gap-1">
        Wishlisted Tokens
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
        <span className="text-sm font-medium text-subText">No wishlisted tokens</span>
      )}
    </HStack>
  </SidePanelCard>
)
