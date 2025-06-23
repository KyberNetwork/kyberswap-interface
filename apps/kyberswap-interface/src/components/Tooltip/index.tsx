import { ReactNode, useCallback, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Text } from 'rebass'
import styled from 'styled-components'

import Popover, { PopoverProps } from 'components/Popover'
import Row from 'components/Row'

const TooltipContainer = styled.div<{ width?: string; maxWidth?: string; size?: number }>`
  width: ${({ width }) => width || '228px'};
  max-width: ${({ maxWidth }) => maxWidth || ''};
  padding: 0.5rem 0.75rem;
  line-height: 150%;
  font-weight: 400;
  font-size: ${({ size }) => size || 12}px;
`

export const TextDashed = styled(Text)<{ color?: string; underlineColor?: string }>`
  width: fit-content;
  border-bottom: 1px dotted ${({ theme, underlineColor }) => underlineColor || theme.border};
`

export const TextDotted = styled(Text)<{ $underlineColor?: string }>`
  width: fit-content;
  border-bottom: 1px dotted ${({ theme, $underlineColor }) => $underlineColor || theme.border};
`

interface TooltipProps extends Omit<PopoverProps, 'content'> {
  text: string | ReactNode
  delay?: number
  width?: string
  maxWidth?: string
  size?: number
  disableTooltip?: boolean
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>
  onMouseLeave?: React.MouseEventHandler<HTMLDivElement>
  children?: React.ReactNode
  dataTestId?: string
}

export default function Tooltip({
  text,
  width,
  maxWidth,
  size,
  onMouseEnter,
  onMouseLeave,
  show,
  dataTestId,
  ...rest
}: TooltipProps) {
  return (
    <Popover
      content={
        text ? (
          <TooltipContainer
            width={width}
            maxWidth={maxWidth}
            size={size}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            data-testid={dataTestId}
            onClick={e => e.stopPropagation()}
          >
            {text}
          </TooltipContainer>
        ) : null
      }
      show={!!text && show}
      {...rest}
    />
  )
}

export function MouseoverTooltip({ children, disableTooltip, delay, ...rest }: Omit<TooltipProps, 'show'>) {
  const [show, setShow] = useState(false)
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null)
  const hovering = useRef(false)
  const open = useCallback(() => {
    if (!!rest.text) {
      hovering.current = true
      setTimeout(() => {
        if (hovering.current) setShow(true)
      }, 50)

      if (closeTimeout) {
        clearTimeout(closeTimeout)
        setCloseTimeout(null)
      }
    }
  }, [rest.text, closeTimeout])
  const close = useCallback(
    () =>
      setCloseTimeout(
        setTimeout(() => {
          hovering.current = false
          setShow(false)
        }, delay || 50),
      ),
    [delay],
  )
  if (disableTooltip) return <>{children}</>
  return (
    <Tooltip {...rest} show={show} onMouseEnter={open} onMouseLeave={close}>
      <Row onMouseOver={open} onMouseLeave={close}>
        {children}
      </Row>
    </Tooltip>
  )
}

export function MouseoverTooltipDesktopOnly(props: Omit<TooltipProps, 'show'>) {
  if (isMobile) return <>{props.children}</>

  return <MouseoverTooltip {...props} />
}
