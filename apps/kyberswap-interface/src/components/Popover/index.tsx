import { Placement } from '@popperjs/core'
import Portal from '@reach/portal'
import React, { useCallback, useState } from 'react'
import { usePopper } from 'react-popper'
import styled from 'styled-components'

import { Z_INDEXS } from 'constants/styles'
import useInterval from 'hooks/useInterval'

const PopoverContainer = styled.div<{ show: boolean; opacity?: number }>`
  z-index: ${Z_INDEXS.POPOVER_CONTAINER};

  visibility: ${props => (props.show ? 'visible' : 'hidden')};
  opacity: ${props => (props.show ? props.opacity || 0.95 : 0)};
  transition: visibility 150ms linear, opacity 150ms linear;

  background: ${({ theme }) => theme.tableHeader};
  border: 1px solid transparent;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.32);
  color: ${({ theme }) => theme.text2};
  border-radius: 8px;
`

const ReferenceElement = styled.div`
  display: block;
`

const Arrow = styled.div`
  width: 10px;
  height: 10px;
  z-index: ${Z_INDEXS.POPOVER_CONTAINER - 1};

  ::before {
    position: absolute;
    width: 10px;
    height: 10px;
    z-index: ${Z_INDEXS.POPOVER_CONTAINER - 1};

    content: '';
    border: 1px solid transparent;
    transform: rotate(45deg);
    background: ${({ theme }) => theme.tableHeader};
  }

  &.arrow-top {
    bottom: -5px;
    ::before {
      border-top: none;
      border-left: none;
    }
  }

  &.arrow-bottom {
    top: -5px;
    ::before {
      border-bottom: none;
      border-right: none;
    }
  }

  &.arrow-left {
    right: -5px;

    ::before {
      border-bottom: none;
      border-left: none;
    }
  }

  &.arrow-right {
    left: -5px;
    ::before {
      border-right: none;
      border-top: none;
    }
  }
`

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

  return (
    <>
      <ReferenceElement ref={setReferenceElement as any} style={containerStyle}>
        {children}
      </ReferenceElement>
      {show && (
        <Portal>
          <PopoverContainer
            show={show}
            ref={setPopperElement as any}
            opacity={opacity}
            style={{ ...styles.popper, ...style }}
          >
            {content}
            {noArrow || (
              <Arrow
                className={`arrow-${attributes.popper?.['data-popper-placement'] ?? ''}`}
                ref={setArrowElement as any}
                style={styles.arrow}
                {...attributes.arrow}
              />
            )}
          </PopoverContainer>
        </Portal>
      )}
    </>
  )
}
