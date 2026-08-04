import { Zap } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import copyTradingApi from 'services/copyTrading'
import type { AdvisoryActionAvailability, AgentProfile } from 'services/copyTrading/types'

import { ButtonPrimary } from 'components/Button'
import { HStack, Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import {
  AgentRiskCard,
  CurrentCopyCard,
  SidePanelCard,
  StrategyExecutionCard,
  WishlistedTokensCard,
} from 'pages/CopyTrading/components/AgentSidebarCards'
import { useCopyTradingContext } from 'pages/CopyTrading/context'
import { formatUsd } from 'pages/CopyTrading/helpers'
import { useCopyTradeWrite } from 'pages/CopyTrading/write/WriteContext'
import { getPreparedReasonMessage, isActionAvailable } from 'pages/CopyTrading/write/preparedAction'

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
  const { openSubscribe, openAddCapital } = useCopyTradeWrite()
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
        <CurrentCopyCard
          addCapitalAvailability={activeCopyRun.addCapitalAvailability}
          capital={formatUsd(activeCopyRun.capitalInUsd)}
          onView={() => navigate(`${APP_PATHS.COPY_TRADING}/my-copies/${activeCopyRun.copyRunId}`)}
          onAddCapital={() => openAddCapital(activeCopyRun, agent.displayName)}
        />
      ) : (
        <StartCopyCard availability={agent.startCopyAvailability} onCopy={() => openSubscribe(agent)} />
      )}
      <AgentRiskCard agent={agent} />
      <StrategyExecutionCard items={agent.strategyExecutionItems} />
      <WishlistedTokensCard tokens={agent.whitelistedSymbols} />
    </Stack>
  )
}

export default AgentInstruction
