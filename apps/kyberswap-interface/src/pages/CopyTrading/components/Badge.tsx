import { type PropsWithChildren } from 'react'
import type { StrategyKey } from 'services/copyTrading/types'

import { strategyLabel } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'

export type BadgeColor = 'red' | 'blue' | 'primary' | 'gray'

type BadgeProps = PropsWithChildren<{
  color: BadgeColor
}>

export const Badge = ({ children, color }: BadgeProps) => (
  <span
    className={cn(
      'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium',
      color === 'red' && 'bg-red-20 text-red',
      color === 'blue' && 'bg-blue/20 text-blue',
      color === 'primary' && 'bg-primary-12 text-primary',
      color === 'gray' && 'bg-subText-20 px-3 font-normal text-subText',
    )}
  >
    {children}
  </span>
)

type StrategyBadgeProps = {
  strategy: StrategyKey
}

const getStrategyBadgeColor = (strategy: StrategyKey): BadgeColor =>
  strategy === 'active' ? 'red' : strategy === 'diversified' ? 'blue' : 'primary'

export const StrategyBadge = ({ strategy }: StrategyBadgeProps) => (
  <Badge color={getStrategyBadgeColor(strategy)}>{strategyLabel(strategy)}</Badge>
)
