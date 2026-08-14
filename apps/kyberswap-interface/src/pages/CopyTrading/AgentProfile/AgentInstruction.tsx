import { Zap } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import copyRunApi from 'services/copyTrading/api/endpoints/copyRuns'
import type { AdvisoryActionAvailability } from 'services/copyTrading/types/actionAvailability'
import type { AgentProfile } from 'services/copyTrading/types/agents'

import { ButtonPrimary } from 'components/Button'
import { HStack, Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import {
  AgentRiskCard,
  StrategyExecutionCard,
  WhitelistedTokensCard,
} from 'pages/CopyTrading/components/AgentSidebarCards/AgentProfileCards'
import { CopyCapitalCard } from 'pages/CopyTrading/components/AgentSidebarCards/CopyActionCards'
import { SidePanelCard } from 'pages/CopyTrading/components/AgentSidebarCards/SidePanelCard'
import { useCopyTradingContext } from 'pages/CopyTrading/context'
import { formatUsd, getPreparedReasonMessage, isActionAvailable } from 'pages/CopyTrading/helpers'
import { useCopyTradingModal } from 'pages/CopyTrading/modals/context'

const StartCopyCard = ({ availability, onCopy }: { availability?: AdvisoryActionAvailability; onCopy: () => void }) => {
  const disabled = !isActionAvailable(availability)

  return (
    <SidePanelCard title="Copy This Agent">
      <p className="text-sm text-subText">
        Your funds remain in your personal Smart Contract Wallet. Only proportional trades are executed.
      </p>
      <ButtonPrimary
        type="button"
        padding="10px 12px"
        disabled={disabled}
        title={disabled ? getPreparedReasonMessage(availability?.reason) : undefined}
        onClick={onCopy}
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
  const navigate = useNavigate()
  const { ownerAddress } = useCopyTradingContext()
  const { openStartCopy, openAddCapital } = useCopyTradingModal()

  const { data: activeCopyRuns } = copyRunApi.useGetCopyRunsQuery(
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
        <CopyCapitalCard
          addCapitalAvailability={activeCopyRun.addCapitalAvailability}
          capital={formatUsd(activeCopyRun.capitalInUsd)}
          onView={() => navigate(`${APP_PATHS.COPY_TRADING}/my-copies/${activeCopyRun.copyRunId}`)}
          onAddCapital={() => openAddCapital(activeCopyRun, agent.displayName)}
        />
      ) : (
        <StartCopyCard availability={agent.startCopyAvailability} onCopy={() => openStartCopy(agent)} />
      )}
      <AgentRiskCard agent={agent} />
      <StrategyExecutionCard items={agent.strategyExecutionItems} />
      <WhitelistedTokensCard tokens={agent.whitelistedSymbols} />
    </Stack>
  )
}

export default AgentInstruction
