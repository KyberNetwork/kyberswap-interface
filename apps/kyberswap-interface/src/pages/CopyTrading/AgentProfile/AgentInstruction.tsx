import { Zap } from 'react-feather'
import copyTradingApi from 'services/copyTrading'
import type { AgentProfile } from 'services/copyTrading/types'

import { ButtonPrimary } from 'components/Button'
import { HStack, Stack } from 'components/Stack'
import {
  AgentRiskCard,
  CurrentCopyCard,
  SidePanelCard,
  StrategyExecutionCard,
  WishlistedTokensCard,
} from 'pages/CopyTrading/components/AgentSidebarCards'
import { OWNER_ADDRESS, formatUsd } from 'pages/CopyTrading/helpers'

const StartCopyCard = () => (
  <SidePanelCard title="Copy This Agent">
    <p className="text-sm text-subText">
      Your funds remain in your personal Smart Contract Wallet. Only proportional trades are executed.
    </p>
    <ButtonPrimary type="button" padding="10px 12px">
      <HStack className="items-center gap-1">
        <Zap size={14} className="fill-warning text-warning" />
        Copy
      </HStack>
    </ButtonPrimary>
  </SidePanelCard>
)

type AgentInstructionProps = {
  agent: AgentProfile
}

const AgentInstruction = ({ agent }: AgentInstructionProps) => {
  const { data: activeCopyRuns } = copyTradingApi.useGetCopyRunsQuery({
    ownerAddress: OWNER_ADDRESS,
    status: 'active',
    agentId: agent.agentId,
    limit: 1,
  })
  const activeCopyRun = activeCopyRuns?.data[0]

  return (
    <Stack className="gap-4">
      {activeCopyRun ? <CurrentCopyCard capital={formatUsd(activeCopyRun.capitalInUsd)} /> : <StartCopyCard />}
      <AgentRiskCard agent={agent} />
      <StrategyExecutionCard />
      <WishlistedTokensCard tokens={agent.whitelistedSymbols} />
    </Stack>
  )
}

export default AgentInstruction
