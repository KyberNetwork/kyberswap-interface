import type { AgentProfile } from 'services/copyTrading/types/agents'

import CopyHelper from 'components/Copy'
import InfoHelper from 'components/InfoHelper'
import { HStack, Stack } from 'components/Stack'
import { MouseoverTooltip } from 'components/Tooltip'
import { WinRateTooltip } from 'pages/CopyTrading/AgentList/components'
import { SidePanelCard } from 'pages/CopyTrading/components/AgentSidebarCards/SidePanelCard'
import { getWinRateClassName, percent } from 'pages/CopyTrading/helpers'
import { shortenAddress } from 'utils/address'
import { cn } from 'utils/cn'

export const RiskCard = ({
  maxDrawdownPct,
  winRatePct,
}: Pick<AgentProfile['stats'], 'maxDrawdownPct' | 'winRatePct'>) => {
  return (
    <SidePanelCard bodyClassName="gap-3 py-4">
      <HStack className="min-h-6 items-center justify-between gap-2">
        <HStack as="span" className="items-center gap-1 text-sm font-medium text-subText">
          Win Rate
          <WinRateTooltip type="agent" />
        </HStack>
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

export const WhitelistedTokensCard = ({ tokens }: { tokens: AgentProfile['whitelistedTokens'] }) => {
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
            <MouseoverTooltip
              key={`${token.chainId}:${token.address}`}
              placement="top"
              width="max-content"
              maxWidth="calc(100vw - 32px)"
              text={
                <HStack className="items-center gap-2 whitespace-nowrap">
                  <span className="text-subText">Address:</span>
                  <span>{shortenAddress(token.chainId, token.address, 4, false)}</span>
                  <CopyHelper toCopy={token.address} margin="0" size={14} />
                </HStack>
              }
            >
              <span className="rounded-full border border-darkBorder bg-background px-3 py-1 text-sm font-medium text-subText">
                {token.symbol?.trim() || `${token.address.slice(0, 6)}...${token.address.slice(-4)}`}
              </span>
            </MouseoverTooltip>
          ))
        ) : (
          <p className="text-sm font-medium text-subText">No whitelisted tokens</p>
        )}
      </HStack>
    </SidePanelCard>
  )
}
