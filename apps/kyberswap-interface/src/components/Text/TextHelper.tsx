import { Placement } from '@popperjs/core'
import { ComponentProps, ReactNode } from 'react'

import { TextDashed } from 'components/Text'
import { MouseoverTooltip } from 'components/Tooltip'

type TextHelperProps = ComponentProps<typeof TextDashed> & {
  tooltip?: ReactNode
  tooltipWidth?: string
  placement?: Placement
}

const TextHelper = ({ tooltip, tooltipWidth = '240px', placement = 'top', children, ...props }: TextHelperProps) => (
  <MouseoverTooltip text={tooltip} width={tooltipWidth} placement={placement}>
    <TextDashed {...props}>{children}</TextDashed>
  </MouseoverTooltip>
)

export default TextHelper
