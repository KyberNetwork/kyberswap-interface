import { type CSSProperties, type MouseEvent, ReactNode, forwardRef, useCallback, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'

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

type RebassishProps = {
  fontSize?: number | string
  fontWeight?: number | string
  color?: string
  lineHeight?: number | string
  height?: number | string
  width?: number | string
  minWidth?: number | string
  maxWidth?: number | string
  margin?: number | string
  marginLeft?: number | string
  marginRight?: number | string
  marginTop?: number | string
  marginBottom?: number | string
  padding?: number | string
  paddingLeft?: number | string
  paddingRight?: number | string
  paddingTop?: number | string
  paddingBottom?: number | string
  sx?: CSSProperties
}

type TextDashedProps = Omit<React.HTMLAttributes<HTMLSpanElement>, 'color'> &
  RebassishProps & {
    underlineColor?: string
  }

const REBASSISH_KEYS: ReadonlyArray<keyof RebassishProps> = [
  'fontSize',
  'fontWeight',
  'color',
  'lineHeight',
  'height',
  'width',
  'minWidth',
  'maxWidth',
  'margin',
  'marginLeft',
  'marginRight',
  'marginTop',
  'marginBottom',
  'padding',
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'paddingBottom',
  'sx',
]

const NUMERIC_PX_KEYS = new Set<keyof RebassishProps>([
  'fontSize',
  'lineHeight',
  'height',
  'width',
  'minWidth',
  'maxWidth',
  'margin',
  'marginLeft',
  'marginRight',
  'marginTop',
  'marginBottom',
  'padding',
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'paddingBottom',
])

export const TextDashed = forwardRef<HTMLSpanElement, TextDashedProps>(
  ({ underlineColor, style, className, ...rest }, ref) => {
    const inline: Record<string, unknown> = {
      borderBottom: `1px dotted ${underlineColor || 'var(--ks-border)'}`,
    }
    const passthrough: Record<string, unknown> = {}
    for (const key of Object.keys(rest)) {
      const value = (rest as Record<string, unknown>)[key]
      if (value === undefined) continue
      if ((REBASSISH_KEYS as readonly string[]).includes(key)) {
        if (key === 'sx' && value && typeof value === 'object') {
          Object.assign(inline, value)
        } else if (NUMERIC_PX_KEYS.has(key as keyof RebassishProps) && typeof value === 'number') {
          inline[key] = `${value}px`
        } else {
          inline[key] = value
        }
      } else {
        passthrough[key] = value
      }
    }
    return <span ref={ref} {...passthrough} style={{ ...inline, ...style }} className={cn('w-fit', className)} />
  },
)
TextDashed.displayName = 'TextDashed'

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
