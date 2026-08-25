import { Zap } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import copyRunApi from 'services/copyTrading/api/endpoints/copyRuns'
import type { AdvisoryActionAvailability } from 'services/copyTrading/types/actionAvailability'
import type { AgentProfile } from 'services/copyTrading/types/agents'

import { ButtonPrimary } from 'components/Button'
import { HStack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import { agentProfileResponsiveOrder } from 'pages/CopyTrading/AgentProfile/responsiveOrder'
import {
  AgentRiskCard,
  StrategyExecutionCard,
  WhitelistedTokensCard,
} from 'pages/CopyTrading/components/AgentSidebarCards/AgentProfileCards'
import { CopyCapitalCard } from 'pages/CopyTrading/components/AgentSidebarCards/CopyActionCards'
import { SidePanelCard } from 'pages/CopyTrading/components/AgentSidebarCards/SidePanelCard'
import { ResponsiveDetailContents, ResponsiveDetailItem } from 'pages/CopyTrading/components/common/layout'
import { useCopyTradingContext } from 'pages/CopyTrading/context'
import {
  formatUsd,
  getDisplayCapitalInUsd,
  getPreparedReasonMessage,
  isActionAvailable,
} from 'pages/CopyTrading/helpers'
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

  const { currentData: activeCopyRuns } = copyRunApi.useGetCopyRunsQuery(
    {
      ownerAddress: ownerAddress || '',
      view: 'open',
      agentId: agent.agentId,
      limit: 1,
    },
    { pollingInterval: 10_000, skip: !ownerAddress },
  )

  const activeCopyRun = activeCopyRuns?.data[0]
  const copyActionCard = activeCopyRun ? (
    <CopyCapitalCard
      addCapitalAvailability={activeCopyRun.addCapitalAvailability}
      capital={formatUsd(getDisplayCapitalInUsd(activeCopyRun))}
      onView={() => navigate(`${APP_PATHS.COPY_TRADING}/my-copies/${activeCopyRun.copyRunId}`)}
      onAddCapital={() => openAddCapital(activeCopyRun, agent.displayName)}
    />
  ) : (
    <StartCopyCard availability={agent.startCopyAvailability} onCopy={() => openStartCopy(agent)} />
  )

  return (
    <ResponsiveDetailContents>
      <ResponsiveDetailItem responsiveOrder={agentProfileResponsiveOrder.copyAction}>
        {copyActionCard}
      </ResponsiveDetailItem>
      <ResponsiveDetailItem responsiveOrder={agentProfileResponsiveOrder.risk}>
        <AgentRiskCard agent={agent} />
      </ResponsiveDetailItem>
      <ResponsiveDetailItem responsiveOrder={agentProfileResponsiveOrder.strategy}>
        <StrategyExecutionCard items={agent.strategyExecutionItems} />
      </ResponsiveDetailItem>
      <ResponsiveDetailItem responsiveOrder={agentProfileResponsiveOrder.tokens}>
        <WhitelistedTokensCard tokens={agent.whitelistedSymbols} />
      </ResponsiveDetailItem>
    </ResponsiveDetailContents>
  )
}

export default AgentInstruction
