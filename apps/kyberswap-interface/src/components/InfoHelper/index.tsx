import { Placement } from '@popperjs/core'
import { CSSProperties, ReactNode, useCallback, useState } from 'react'
import { Info } from 'react-feather'
import styled from 'styled-components'

import Tooltip, { MouseoverTooltip } from 'components/Tooltip'
import { Z_INDEXS } from 'constants/styles'

const InfoWrapper = styled.div<{ isActive?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  outline: none;
  cursor: default;
  border-radius: 36px;
  color: ${({ theme, isActive }) => (isActive ? theme.textReverse : theme.subText)};

  :hover,
  :focus {
    opacity: 0.7;
  }
`

const InfoHelperWrapper = styled.span<{ $margin: boolean }>`
  display: inline-flex;
  justify-content: center;
  align-items: center;
  margin-left: ${({ $margin }) => ($margin ? '0.25rem' : '0')};
  line-height: 100%;
  vertical-align: middle;
`

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
    <InfoHelperWrapper
      $margin={margin}
      onClick={e => {
        e.stopPropagation()
        open()
      }}
      style={style}
      onMouseEnter={open}
      onMouseLeave={close}
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
        <InfoWrapper isActive={isActive}>
          <Info size={size || 12} color={color || 'currentcolor'} />
        </InfoWrapper>
      </Tooltip>
    </InfoHelperWrapper>
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
