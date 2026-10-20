import { ReactNode } from 'react'

import { HStack, Stack } from 'components/Stack'
import { MouseoverTooltip } from 'components/Tooltip'
import { cn } from 'utils/cn'

export const QuoteDetails = ({ children, className }: { children: ReactNode; className?: string }) => (
  <Stack as="section" aria-label="Swap quote" className={cn('min-w-0 gap-3 text-xs', className)}>
    {children}
  </Stack>
)

export const QuoteDetailRow = ({
  label,
  tooltip,
  children,
}: {
  label: ReactNode
  tooltip?: ReactNode
  children: ReactNode
}) => {
  const labelContent = (
    <span className={cn('shrink-0 font-normal text-subText', tooltip && 'border-b border-dotted border-border')}>
      {label}
    </span>
  )

  return (
    <HStack className="min-h-5 w-full items-center justify-between gap-3 text-xs">
      {tooltip ? (
        <MouseoverTooltip text={tooltip} placement="right">
          {labelContent}
        </MouseoverTooltip>
      ) : (
        labelContent
      )}
      <div className="min-w-0 text-right font-medium text-text">{children}</div>
    </HStack>
  )
}
