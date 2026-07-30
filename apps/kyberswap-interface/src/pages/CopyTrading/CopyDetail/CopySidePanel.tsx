import type { AgentProfile, CopyRunSummary } from 'services/copyTrading/types'

import { HStack, Stack } from 'components/Stack'
import {
  AgentRiskCard,
  CurrentCopyCard,
  StrategyExecutionCard,
  WishlistedTokensCard,
} from 'pages/CopyTrading/components/AgentSidebarCards'
import { formatUsd, isCopyRunClosed, signedUsd } from 'pages/CopyTrading/helpers'
import { useCopyTradeWrite } from 'pages/CopyTrading/write/WriteContext'
import { cn } from 'utils/cn'

type CopyStatusCardProps = {
  run: CopyRunSummary
}

const ClosedCopySummary = ({ run }: CopyStatusCardProps) => {
  const realizedPnl = signedUsd(run.realizedPnlUsd)

  return (
    <HStack className="min-h-24 items-center justify-between gap-4 rounded-xl bg-buttonBlack p-6">
      <span className="text-base text-subText">Total Realised P&L</span>
      <span className={cn('text-2xl font-medium', realizedPnl.startsWith('-') ? 'text-red' : 'text-primary')}>
        {realizedPnl}
      </span>
    </HStack>
  )
}

type CopySidePanelProps = {
  agent: AgentProfile
  run: CopyRunSummary
}

const CopySidePanel = ({ agent, run }: CopySidePanelProps) => {
  const { openAddCapital } = useCopyTradeWrite()

  if (isCopyRunClosed(run.status)) {
    return (
      <Stack className="gap-4">
        <ClosedCopySummary run={run} />
        <StrategyExecutionCard items={agent.strategyExecutionItems} />
      </Stack>
    )
  }

  return (
    <Stack className="gap-4">
      <CurrentCopyCard
        capital={formatUsd(run.capitalInUsd)}
        title="Current Copying"
        onAddCapital={() => openAddCapital(run, agent.displayName)}
      />
      <AgentRiskCard agent={agent} />
      <StrategyExecutionCard items={agent.strategyExecutionItems} />
      <WishlistedTokensCard tokens={agent.whitelistedSymbols} />
    </Stack>
  )
}

export default CopySidePanel
