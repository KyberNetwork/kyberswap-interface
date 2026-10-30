import { type ComponentProps, type ReactNode } from 'react'

import { HStack } from 'components/Stack'
import ValueWithLoadingSkeleton from 'components/SwapForm/SwapModal/SwapDetails/ValueWithLoadingSkeleton'
import { TextHelper } from 'components/Text'
import { cn } from 'utils/cn'

const DETAIL_TOOLTIP_WIDTH = '200px'
const DETAIL_TOOLTIP_PLACEMENT: ComponentProps<typeof TextHelper>['placement'] = 'right'

export const DetailLabel = ({
  className,
  placement = DETAIL_TOOLTIP_PLACEMENT,
  tooltipWidth = DETAIL_TOOLTIP_WIDTH,
  ...props
}: ComponentProps<typeof TextHelper>) => (
  <TextHelper
    fontSize={12}
    fontWeight={400}
    className={cn('text-xs text-subText', className)}
    placement={placement}
    tooltipWidth={tooltipWidth}
    {...props}
  />
)

type DetailRowProps = {
  children: ReactNode
  className?: string
  isLoading?: boolean
  label: ReactNode
  skeletonWidth?: string
}

export const DetailRow = ({ children, className, isLoading, label, skeletonWidth = '64px' }: DetailRowProps) => (
  <HStack className={cn('min-h-5 w-full items-center justify-between gap-4', className)}>
    <HStack className="w-fit min-w-max items-center">{label}</HStack>
    {isLoading === undefined ? (
      children
    ) : (
      <ValueWithLoadingSkeleton
        skeletonStyle={{
          width: skeletonWidth,
        }}
        isShowingSkeleton={isLoading}
        content={children}
      />
    )}
  </HStack>
)
