import { type ReactNode } from 'react'
import { AlertTriangle, Info } from 'react-feather'

import { HStack } from 'components/Stack'
import { cn } from 'utils/cn'

const NOTICE_STYLES = {
  error: { backgroundClass: 'bg-red-20', colorClass: 'text-red', Icon: AlertTriangle },
  info: { backgroundClass: 'bg-primary-10', colorClass: 'text-primary', Icon: Info },
  warn: { backgroundClass: 'bg-warning-10', colorClass: 'text-warning', Icon: AlertTriangle },
} as const

type StopMarketNoticeProps = {
  type: keyof typeof NOTICE_STYLES
  /** Inline notices sit beside fields and fees; boxes group review warnings. */
  variant?: 'inline' | 'box'
  children: ReactNode
  /** Override the default severity icon, e.g. Info for the close-trigger hint. */
  icon?: typeof Info
  animate?: boolean
  className?: string
  dataTestId?: string
}

/**
 * Similar to ErrorWarning: a typed notice with a severity color and icon.
 * Kept local to Stop Market for its inline and review-box styles, without expandable details.
 * Callers own visibility, loading retention, retry actions and review snapshots.
 */
export const StopMarketNotice = ({
  type,
  variant = 'inline',
  children,
  icon,
  animate = true,
  className,
  dataTestId,
}: StopMarketNoticeProps) => {
  const { backgroundClass, colorClass, Icon: DefaultIcon } = NOTICE_STYLES[type]
  const Icon = icon ?? DefaultIcon
  const isBox = variant === 'box'

  return (
    <HStack
      className={cn(
        'items-start',
        colorClass,
        isBox ? 'w-full gap-2.5 rounded-xl px-3 py-2 text-sm' : 'gap-1.5 text-xs font-medium',
        isBox && backgroundClass,
        animate && 'animate-[fadeIn_0.2s_ease-out_both] motion-reduce:animate-none',
        className,
      )}
      data-testid={dataTestId}
      data-warning-type={type}
    >
      <Icon size={isBox ? 16 : 14} className={cn('shrink-0', isBox ? 'mt-0.5' : 'mt-px')} />
      <div className={cn(isBox && 'flex-1')}>{children}</div>
    </HStack>
  )
}
