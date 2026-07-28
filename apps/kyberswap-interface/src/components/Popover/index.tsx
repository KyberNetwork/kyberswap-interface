import { Placement } from '@popperjs/core'
import Portal from '@reach/portal'
import React, { CSSProperties, useCallback, useState } from 'react'
import { usePopper } from 'react-popper'

import { Z_INDEXS } from 'constants/styles'
import useInterval from 'hooks/useInterval'
import { cn } from 'utils/cn'

export interface PopoverProps {
  content: React.ReactNode
  show: boolean
  children?: React.ReactNode
  placement?: Placement
  noArrow?: boolean
  opacity?: number
  style?: React.CSSProperties
  containerStyle?: React.CSSProperties
  offset?: [number, number]
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>
  onMouseLeave?: React.MouseEventHandler<HTMLDivElement>
}

// Reference https://popper.js.org/docs/v2/modifiers/offset/#skidding
const defaultOffset: [number, number] = [0 /* skidding */, 8 /* distance */]

export default function Popover({
  content,
  show,
  children,
  placement = 'auto',
  noArrow = false,
  opacity,
  style = {},
  containerStyle = {},
  offset = defaultOffset,
  onMouseEnter,
  onMouseLeave,
}: PopoverProps) {
  const [referenceElement, setReferenceElement] = useState<HTMLDivElement | null>(null)
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null)
  const [arrowElement, setArrowElement] = useState<HTMLDivElement | null>(null)
  const { styles, update, attributes } = usePopper(referenceElement, popperElement, {
    placement,
    strategy: 'fixed',
    modifiers: [
      { name: 'offset', options: { offset } },
      { name: 'arrow', options: { element: arrowElement } },
    ],
  })
  const updateCallback = useCallback(() => {
    update && update()
  }, [update])
  useInterval(updateCallback, show ? 100 : null)

  const popoverInline: CSSProperties = {
    zIndex: Z_INDEXS.POPOVER_CONTAINER,
    opacity: show ? opacity ?? 0.95 : 0,
    visibility: show ? 'visible' : 'hidden',
    ...styles.popper,
    ...style,
  }
  const popperPlacement = attributes.popper?.['data-popper-placement']
  const arrowPlacement = popperPlacement?.split('-')[0]

  return (
    <>
      <div ref={setReferenceElement} style={containerStyle} className="block">
        {children}
      </div>
      {show && (
        <Portal>
          <div
            ref={setPopperElement}
            style={popoverInline}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            {...attributes.popper}
            className={cn(
              'ks-popover-container rounded-lg border border-transparent bg-tableHeader text-text2 shadow-[0_4px_24px_rgba(0,0,0,0.6)]',
              '[transition:visibility_150ms_linear,opacity_150ms_linear]',
            )}
          >
            {content}
            {noArrow || (
              <div
                ref={setArrowElement}
                style={{ ...styles.arrow, zIndex: Z_INDEXS.POPOVER_CONTAINER - 1 }}
                {...attributes.arrow}
                className={cn('ks-popover-arrow', arrowPlacement && `arrow-${arrowPlacement}`)}
              />
            )}
          </div>
        </Portal>
      )}
    </>
  )
}
