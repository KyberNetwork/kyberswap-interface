import { type MouseEvent, ReactNode, forwardRef, useCallback, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Text, TextProps } from 'rebass'

import Popover, { PopoverProps } from 'components/Popover'
import Row from 'components/Row'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { cn } from 'utils/cn'

type TooltipContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  width?: string
  maxWidth?: string
  size?: number
}

const TooltipContainer = forwardRef<HTMLDivElement, TooltipContainerProps>(
  ({ width, maxWidth, size, className, style, ...rest }, ref) => (
    <div
      ref={ref}
      style={{
        width: width || '228px',
        maxWidth: maxWidth || undefined,
        fontSize: `${size || 12}px`,
        ...style,
      }}
      className={cn('px-3 py-2 font-normal leading-[150%]', className)}
      {...rest}
    />
  ),
)
TooltipContainer.displayName = 'TooltipContainer'

type TextDashedProps = TextProps & { underlineColor?: string }

export const TextDashed = ({ underlineColor, style, ...rest }: TextDashedProps) => (
  <Text
    {...rest}
    style={{ borderBottom: `1px dotted ${underlineColor || 'var(--ks-border)'}`, ...style }}
    className="w-fit"
  />
)

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
  noArrow?: boolean
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
            data-testid={dataTestId}
            onClick={e => e.stopPropagation()}
          >
            {text}
          </TooltipContainer>
        ) : null
      }
      show={!!text && show}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      {...rest}
    />
  )
}

export function ClickTooltip({
  children,
  disableTooltip,
  stopPropagationOnClick = true,
  ...rest
}: Omit<TooltipProps, 'show'> & { stopPropagationOnClick?: boolean }) {
  const [show, setShow] = useState(false)
  const nodeRef = useRef<HTMLDivElement>(null)

  useOnClickOutside(nodeRef, show ? () => setShow(false) : undefined)

  const handleClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (stopPropagationOnClick) {
        event.preventDefault()
        event.stopPropagation()
      }
      setShow(prev => !prev)
    },
    [stopPropagationOnClick],
  )

  if (disableTooltip) return <>{children}</>
  return (
    <Tooltip {...rest} show={show}>
      <div ref={nodeRef} onClick={handleClick}>
        {children}
      </div>
    </Tooltip>
  )
}

export function MouseoverTooltip({ children, disableTooltip, delay, ...rest }: Omit<TooltipProps, 'show'>) {
  const [show, setShow] = useState(false)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hovering = useRef(false)

  const open = useCallback(() => {
    if (!!rest.text) {
      hovering.current = true
      setTimeout(() => {
        if (hovering.current) setShow(true)
      }, 50)

      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }
    }
  }, [rest.text])

  const close = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
    }

    closeTimeoutRef.current = setTimeout(() => {
      hovering.current = false
      setShow(false)
      closeTimeoutRef.current = null
    }, delay || 120)
  }, [delay])

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
