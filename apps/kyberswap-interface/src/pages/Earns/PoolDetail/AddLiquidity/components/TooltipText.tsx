import { Placement } from '@popperjs/core'
import { ComponentProps, ReactNode } from 'react'

import { MouseoverTooltip, TextDashed } from 'components/Tooltip'

type TooltipTextProps = ComponentProps<typeof TextDashed> & {
  tooltip?: ReactNode
  tooltipWidth?: string
  placement?: Placement
}

const TooltipText = ({ tooltip, tooltipWidth = '240px', placement = 'top', children, ...props }: TooltipTextProps) => (
  <MouseoverTooltip text={tooltip} width={tooltipWidth} placement={placement}>
    <TextDashed {...props}>{children}</TextDashed>
  </MouseoverTooltip>
)

export default TooltipText
