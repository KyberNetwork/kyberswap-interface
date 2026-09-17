import { Zap } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import type { AgentProfile } from 'services/copyTrading/types/agents'
import type { CopyRunListItem } from 'services/copyTrading/types/copyRuns'

import { ButtonPrimary } from 'components/Button'
import { HStack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import { agentProfileResponsiveOrder } from 'pages/CopyTrading/AgentProfile/responsiveOrder'
import {
  RiskCard,
  StrategyExecutionCard,
  WhitelistedTokensCard,
} from 'pages/CopyTrading/components/AgentSidebarCards/AgentProfileCards'
import { CopyCapitalCard } from 'pages/CopyTrading/components/AgentSidebarCards/CopyActionCards'
import { SidePanelCard } from 'pages/CopyTrading/components/AgentSidebarCards/SidePanelCard'
import { ResponsiveDetailContents, ResponsiveDetailItem } from 'pages/CopyTrading/components/common/layout'
import { CapitalInCardValue } from 'pages/CopyTrading/components/common/status'
import { useCopyTradingContext } from 'pages/CopyTrading/context'
import { getStartGenerationChoices } from 'pages/CopyTrading/generations'
import { canAttemptPreparation, getPreparedReasonMessage } from 'pages/CopyTrading/helpers'
import { useCopyTradingModal } from 'pages/CopyTrading/modals/context'

const StartCopyCard = ({ agent, onCopy }: { agent: AgentProfile; onCopy: () => void }) => {
  const { chains } = useCopyTradingContext()
  const choices = getStartGenerationChoices(
    chains.find(chain => chain.chainId === agent.chainId),
    agent,
  )
  const disabled = choices.filter(choice => canAttemptPreparation(choice.availability)).length !== 1
  const unavailableReason = choices.length === 1 ? choices[0].availability?.reason : undefined

  return (
    <SidePanelCard title="Copy This Agent">
      <p className="text-sm text-subText">
        Your funds remain in your personal Smart Contract Wallet. Only proportional trades are executed.
      </p>
      <ButtonPrimary
        type="button"
        altDisabledStyle
        padding="10px 12px"
        disabled={disabled}
        title={disabled ? getPreparedReasonMessage(unavailableReason) : undefined}
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
  activeCopyRun?: CopyRunListItem
  agent: AgentProfile
}

const AgentInstruction = ({ activeCopyRun, agent }: AgentInstructionProps) => {
  const navigate = useNavigate()
  const { openStartCopy, openAddCapital } = useCopyTradingModal()

  const copyActionCard = activeCopyRun ? (
    <CopyCapitalCard
      addCapitalAvailability={activeCopyRun.addCapitalAvailability}
      capital={<CapitalInCardValue run={activeCopyRun} />}
      onView={() => navigate(`${APP_PATHS.COPY_TRADING}/my-copies/${activeCopyRun.copyRunId}`)}
      onAddCapital={() => openAddCapital(activeCopyRun)}
    />
  ) : (
    <StartCopyCard agent={agent} onCopy={() => openStartCopy(agent)} />
  )

  return (
    <ResponsiveDetailContents>
      <ResponsiveDetailItem responsiveOrder={agentProfileResponsiveOrder.copyAction}>
        {copyActionCard}
      </ResponsiveDetailItem>
      <ResponsiveDetailItem responsiveOrder={agentProfileResponsiveOrder.risk}>
        <RiskCard maxDrawdownPct={agent.stats.maxDrawdownPct} winRatePct={agent.stats.winRatePct} />
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
