import { ReactNode } from 'react'

import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'
import { MouseoverTooltip } from 'components/Tooltip'
import { cn } from 'utils/cn'

export const QuoteDetails = ({ children, className }: { children: ReactNode; className?: string }) => (
  <Stack as="section" aria-label="Swap quote" className={cn('min-w-0 gap-3 text-xs', className)}>
    {children}
  </Stack>
)

const QuoteDetailLabel = ({ children, hasTooltip }: { children: ReactNode; hasTooltip: boolean }) => (
  <span className={cn('shrink-0 font-normal text-subText', hasTooltip && 'border-b border-dotted border-border')}>
    {children}
  </span>
)

type QuoteDetailRowProps = {
  label: ReactNode
  loading?: boolean
  tooltip?: ReactNode
  children: ReactNode
}

export const QuoteDetailRow = ({ label, tooltip, children, loading = false }: QuoteDetailRowProps) => (
  <HStack className="min-h-5 w-full items-center justify-between gap-3 text-xs">
    {tooltip ? (
      <MouseoverTooltip text={tooltip} placement="right">
        <QuoteDetailLabel hasTooltip>{label}</QuoteDetailLabel>
      </MouseoverTooltip>
    ) : (
      <QuoteDetailLabel hasTooltip={false}>{label}</QuoteDetailLabel>
    )}
    <div className="min-w-0 text-right font-medium text-text">
      {loading ? <Skeleton width={80} height={14} randomWidth /> : children}
    </div>
  </HStack>
)
