import { Zap } from 'react-feather'
import copyTradingApi from 'services/copyTrading'
import type { AdvisoryActionAvailability, AgentProfile } from 'services/copyTrading/types'

import { ButtonPrimary } from 'components/Button'
import { HStack, Stack } from 'components/Stack'
import {
  AgentRiskCard,
  CurrentCopyCard,
  SidePanelCard,
  StrategyExecutionCard,
  WishlistedTokensCard,
} from 'pages/CopyTrading/components/AgentSidebarCards'
import { useCopyTradingContext } from 'pages/CopyTrading/context'
import { formatUsd } from 'pages/CopyTrading/helpers'

const StartCopyCard = ({ availability }: { availability?: AdvisoryActionAvailability }) => {
  const disabled = Boolean(availability?.status && availability.status !== 'ADVISORY_ACTION_STATUS_AVAILABLE')

  return (
    <SidePanelCard title="Copy This Agent">
      <p className="text-sm text-subText">
        Your funds remain in your personal Smart Contract Wallet. Only proportional trades are executed.
      </p>
      <ButtonPrimary
        type="button"
        padding="10px 12px"
        disabled={disabled}
        title={disabled ? availability?.reason : undefined}
      >
        <HStack className="items-center gap-1">
          <Zap size={14} className="fill-warning text-warning" />
          Copy
        </HStack>
      </ButtonPrimary>
    </SidePanelCard>
  )
}

type AgentInstructionProps = {
  agent: AgentProfile
}

const AgentInstruction = ({ agent }: AgentInstructionProps) => {
  const { ownerAddress } = useCopyTradingContext()
  const { data: activeCopyRuns } = copyTradingApi.useGetCopyRunsQuery(
    {
      ownerAddress: ownerAddress || '',
      view: 'open',
      agentId: agent.agentId,
      limit: 1,
    },
    { skip: !ownerAddress },
  )
  const activeCopyRun = activeCopyRuns?.data[0]

  return (
    <Stack className="gap-4">
      {activeCopyRun ? (
        <CurrentCopyCard capital={formatUsd(activeCopyRun.capitalInUsd)} />
      ) : (
        <StartCopyCard availability={agent.startCopyAvailability} />
      )}
      <AgentRiskCard agent={agent} />
      <StrategyExecutionCard items={agent.strategyExecutionItems} />
      <WishlistedTokensCard tokens={agent.whitelistedSymbols} />
    </Stack>
  )
}

export default AgentInstruction
