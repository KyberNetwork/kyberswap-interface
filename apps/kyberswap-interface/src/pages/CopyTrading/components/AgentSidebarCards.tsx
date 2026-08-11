import { AnimatePresence, motion } from 'framer-motion'
import { type PropsWithChildren, type ReactNode, useState } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import type { AdvisoryActionAvailability, AgentProfile } from 'services/copyTrading/types'

import { ButtonLight, ButtonPrimary } from 'components/Button'
import InfoHelper from 'components/InfoHelper'
import { Center, HStack, Stack } from 'components/Stack'
import { percent } from 'pages/CopyTrading/helpers'
import { getPreparedReasonMessage, isActionAvailable } from 'pages/CopyTrading/write/preparedAction'
import { cn } from 'utils/cn'

type SidePanelCardProps = PropsWithChildren<{
  bodyClassName?: string
  collapsible?: boolean
  headerRight?: ReactNode
  title?: ReactNode
}>

export const SidePanelCard = ({ bodyClassName, children, collapsible, headerRight, title }: SidePanelCardProps) => {
  const [expanded, setExpanded] = useState(true)

  if (collapsible && title) {
    return (
      <Stack className="overflow-hidden rounded-xl bg-buttonBlack">
        <button
          type="button"
          aria-expanded={expanded}
          className={cn(
            'w-full border-b border-transparent px-4 py-3 text-left outline-none hover:bg-white-04',
            expanded && 'border-darkBorder',
          )}
          onClick={() => setExpanded(value => !value)}
        >
          <HStack className="items-center justify-between gap-4">
            <h3 className="min-w-0 text-base font-medium text-text">{title}</h3>
            <HStack className="shrink-0 items-center gap-1">
              {headerRight}
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </HStack>
          </HStack>
        </button>
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <Stack className={cn('gap-3 px-4 py-3', bodyClassName)}>{children}</Stack>
            </motion.div>
          )}
        </AnimatePresence>
      </Stack>
    )
  }

  return (
    <Stack className="overflow-hidden rounded-xl bg-buttonBlack">
      {title && <h3 className="border-b border-darkBorder px-4 py-3 text-base font-medium text-text">{title}</h3>}
      <Stack className={cn('gap-3 px-4 py-3', bodyClassName)}>{children}</Stack>
    </Stack>
  )
}

type CurrentCopyCardProps = {
  addCapitalAvailability?: AdvisoryActionAvailability
  capital: string
  stopCopyAvailability?: AdvisoryActionAvailability
  title?: string
  onView?: () => void
  onAddCapital?: () => void
  onStopCopy?: () => void
}

export const CurrentCopyCard = ({
  addCapitalAvailability,
  capital,
  stopCopyAvailability,
  title = 'Your Current Copy',
  onView,
  onAddCapital,
  onStopCopy,
}: CurrentCopyCardProps) => {
  const addCapitalDisabled = !isActionAvailable(addCapitalAvailability)
  const stopCopyDisabled = !isActionAvailable(stopCopyAvailability)

  return (
    <SidePanelCard title={title}>
      <HStack className="items-center justify-between">
        <span className="text-subText">Capital In</span>
        <span className="text-xl font-medium text-primary">{capital}</span>
      </HStack>
      <HStack className="gap-3 max-md:flex-col">
        {onStopCopy && (
          <div className="w-full flex-1">
            <ButtonLight
              type="button"
              padding="10px 12px"
              color="var(--ks-warning)"
              disabled={stopCopyDisabled}
              title={stopCopyDisabled ? getPreparedReasonMessage(stopCopyAvailability?.reason) : undefined}
              onClick={onStopCopy}
            >
              Stop Copy
            </ButtonLight>
          </div>
        )}
        {onView && (
          <div className="w-full flex-1">
            <ButtonLight type="button" padding="10px 12px" onClick={onView}>
              My Copy
            </ButtonLight>
          </div>
        )}
        <div className="w-full flex-1">
          <ButtonPrimary
            type="button"
            padding="10px 12px"
            disabled={addCapitalDisabled}
            title={addCapitalDisabled ? getPreparedReasonMessage(addCapitalAvailability?.reason) : undefined}
            onClick={onAddCapital}
          >
            Add Capital
          </ButtonPrimary>
        </div>
      </HStack>
    </SidePanelCard>
  )
}

type WithdrawQuoteCardProps = {
  availability?: AdvisoryActionAvailability
  onWithdraw: () => void
}

export const WithdrawQuoteCard = ({ availability, onWithdraw }: WithdrawQuoteCardProps) => {
  const disabled = !isActionAvailable(availability)

  return (
    <SidePanelCard title="Advanced">
      <span className="text-sm text-subText">Withdraw available quote balance without selling positions.</span>
      <ButtonPrimary
        type="button"
        disabled={disabled}
        title={disabled ? getPreparedReasonMessage(availability?.reason) : undefined}
        onClick={onWithdraw}
      >
        Withdraw
      </ButtonPrimary>
    </SidePanelCard>
  )
}

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
            style={{ left: `clamp(20px, ${winRate}%, calc(100% - 20px))` }}
          >
            {percent(winRatePct)}
          </Center>
        </div>
      </HStack>
      <HStack className="items-center justify-between">
        <span className="text-sm font-medium text-subText">Max Drawdown</span>
        <span className="text-sm text-text">{percent(agent.stats.maxDrawdownPct)}</span>
      </HStack>
    </SidePanelCard>
  )
}

export const StrategyExecutionCard = ({ items }: { items: AgentProfile['strategyExecutionItems'] }) => (
  <SidePanelCard title="Strategy & Execution">
    <Stack as="ul" className="list-disc gap-2 pl-4 text-sm text-subText">
      {items.map(item => (
        <li key={`${item.label}-${item.description}`} className="pl-0">
          <span className="font-medium text-text">{item.label}:</span> {item.description}
        </li>
      ))}
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
