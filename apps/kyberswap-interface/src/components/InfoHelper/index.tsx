import { Placement } from '@popperjs/core'
import { CSSProperties, ReactNode, useCallback, useState } from 'react'
import { Info } from 'react-feather'

import Tooltip, { MouseoverTooltip } from 'components/Tooltip'
import { Z_INDEXS } from 'constants/styles'
import { cn } from 'utils/cn'

export default function InfoHelper({
  text,
  size,
  fontSize,
  isActive = false,
  color,
  placement,
  width,
  style,
  zIndexTooltip = Z_INDEXS.POPOVER_CONTAINER,
  noArrow = false,
  margin = true,
}: {
  text: string | ReactNode
  size?: number
  fontSize?: number
  isActive?: boolean
  color?: string
  placement?: Placement
  width?: string
  style?: CSSProperties
  zIndexTooltip?: number
  noArrow?: boolean
  margin?: boolean
}) {
  const [show, setShow] = useState<boolean>(false)

  const open = useCallback(() => setShow(true), [setShow])
  const close = useCallback(() => setShow(false), [setShow])

  return (
    <span
      onClick={e => {
        e.stopPropagation()
        open()
      }}
      style={style}
      onMouseEnter={open}
      onMouseLeave={close}
      className={cn('inline-flex items-center justify-center align-middle leading-none', margin ? 'ml-1' : 'ml-0')}
    >
      <Tooltip
        text={text}
        show={show}
        placement={placement}
        width={width}
        size={fontSize || size}
        style={{ zIndex: zIndexTooltip }}
        noArrow={noArrow}
      >
        <div
          className={cn(
            'flex cursor-default items-center justify-center rounded-[36px] border-none bg-transparent outline-none hover:opacity-70 focus:opacity-70',
            isActive ? 'text-textReverse' : 'text-subText',
          )}
        >
          <Info size={size || 12} color={color || 'currentcolor'} />
        </div>
      </Tooltip>
    </span>
  )
}

export const InfoHelperWithDelay = ({
  text,
  size,
  color,
  placement,
  width,
  style,
}: {
  text: string | ReactNode
  size?: number
  color?: string
  placement?: Placement
  width?: string
  style?: CSSProperties
}) => (
  <MouseoverTooltip text={text} width={width} placement={placement} delay={200}>
    <Info size={size || 12} color={color || 'currentcolor'} style={style} />
  </MouseoverTooltip>
)
