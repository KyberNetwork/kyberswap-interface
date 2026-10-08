import { type MotionValue, animate, motion, useMotionValueEvent, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useMeasure } from 'react-use'
import type { AgentProfile } from 'services/copyTrading/types/agents'

import InfoHelper from 'components/InfoHelper'
import { HStack, Stack } from 'components/Stack'
import { SidePanelCard } from 'pages/CopyTrading/components/AgentSidebarCards/SidePanelCard'
import { getWinRateClassName, percent } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'

type RiskCardProps = Pick<AgentProfile['stats'], 'maxDrawdownPct' | 'winRatePct'> & {
  winRateProgress: MotionValue<number>
}

const WIN_RATE_SEGMENTS = 20
const WIN_RATE_SEGMENT_GAP = 2

export const RiskCard = ({ maxDrawdownPct, winRatePct, winRateProgress }: RiskCardProps) => {
  const reduceMotion = useReducedMotion()
  const [visibleSegments, setVisibleSegments] = useState(() => Math.round(winRateProgress.get()))
  useMotionValueEvent(winRateProgress, 'change', value => setVisibleSegments(Math.round(value)))
  const [winRateBarRef, { width: winRateBarWidth }] = useMeasure<HTMLDivElement>()
  const winRate = Math.max(0, Math.min(100, Number(winRatePct || 0)))
  const winRateLabel = percent(winRatePct)
  const winRateUnavailable = winRateLabel === 'N/A'
  const filledSegments = winRateUnavailable ? 0 : Math.round((winRate / 100) * WIN_RATE_SEGMENTS)
  const totalGapWidth = (WIN_RATE_SEGMENTS - 1) * WIN_RATE_SEGMENT_GAP
  // Keep SVG coordinates in whole CSS pixels instead of stretching a viewBox.
  const segmentWidth = Math.max(1, Math.floor((winRateBarWidth - totalGapWidth) / WIN_RATE_SEGMENTS))
  const barOffset = Math.max(0, Math.floor((winRateBarWidth - segmentWidth * WIN_RATE_SEGMENTS - totalGapWidth) / 2))

  useEffect(() => {
    const animation = animate(winRateProgress, filledSegments, {
      duration: reduceMotion ? 0 : Math.abs(filledSegments - winRateProgress.get()) * 0.04,
      ease: 'linear',
    })
    return () => animation.stop()
  }, [filledSegments, reduceMotion, winRateProgress])

  return (
    <div className="grid grid-cols-2 gap-4">
      <SidePanelCard bodyClassName="gap-3 py-4">
        <HStack className="min-h-6 items-center justify-between gap-2">
          <span className="text-sm font-medium text-subText">Win Rate</span>
          <span className={cn('text-base font-medium', getWinRateClassName(winRatePct))}>{winRateLabel}</span>
        </HStack>
        <div ref={winRateBarRef} className="h-5 min-w-0">
          <svg className="block h-5 w-full" aria-hidden>
            {winRateBarWidth > 0 &&
              Array.from({ length: WIN_RATE_SEGMENTS }, (_, index) => (
                <g key={index} transform={`translate(${barOffset + index * (segmentWidth + WIN_RATE_SEGMENT_GAP)} 0)`}>
                  <rect width={segmentWidth} height={20} rx={2} className="text-subText-20" fill="currentColor" />
                  <motion.rect
                    width={segmentWidth}
                    height={20}
                    rx={2}
                    initial={false}
                    animate={{ opacity: index < visibleSegments ? 1 : 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.12 }}
                    fill={`color-mix(in srgb, rgb(var(--ks-blue-rgb)), rgb(var(--ks-primary-rgb)) ${
                      Math.min(1, index / Math.max(visibleSegments - 1, 1)) * 100
                    }%)`}
                  />
                </g>
              ))}
          </svg>
        </div>
      </SidePanelCard>
      <SidePanelCard bodyClassName="gap-3 py-4">
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
      </SidePanelCard>
    </div>
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

export const WhitelistedTokensCard = ({ tokens }: { tokens: string[] }) => {
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
            <span
              key={token}
              className="rounded-full border border-darkBorder bg-background px-3 py-1 text-sm font-medium text-subText"
            >
              {token}
            </span>
          ))
        ) : (
          <p className="text-sm font-medium text-subText">No whitelisted tokens</p>
        )}
      </HStack>
    </SidePanelCard>
  )
}
