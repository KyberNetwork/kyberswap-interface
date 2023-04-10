import React, { ReactElement, ReactNode, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import styled from 'styled-components'

const Wrapper = styled.div`
  padding: 16px;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.tableHeader};
`

const Arrow = styled.div`
  width: 12px;
  height: 12px;
  z-index: 99;

  ::before {
    position: absolute;
    width: 12px;
    height: 12px;
    z-index: 99;

    content: '';
    border: 1px solid transparent;
    transform: rotate(45deg);
    background: ${({ theme }) => theme.tableHeader};
  }

  &.arrow-top {
    bottom: -7px;
    ::before {
      border-top: none;
      border-left: none;
    }
  }

  &.arrow-bottom {
    top: -7px;
    ::before {
      border-bottom: none;
      border-right: none;
    }
  }

  &.arrow-left {
    right: -7px;

    ::before {
      border-bottom: none;
      border-left: none;
    }
  }

  &.arrow-right {
    left: -7px;
    ::before {
      border-right: none;
      border-top: none;
    }
  }
`

export default function SimpleTooltip({
  text,
  delay = 50,
  children,
}: {
  text: ReactNode
  delay?: number
  children: ReactElement
}) {
  const ref = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState<boolean>(false)
  const hovering = useRef(false)
  const handleMouseEnter = () => {
    hovering.current = true

    setTimeout(() => {
      if (hovering.current) {
        setShow(true)
      }
    }, delay)
  }
  const handleMouseLeave = () => {
    hovering.current = false
    setShow(false)
  }

  const clientRect = ref.current?.getBoundingClientRect()
  const wrapperRect = wrapperRef.current?.getBoundingClientRect()
  const inset = `${(clientRect?.top || 0) - (wrapperRect?.height || 50)}px 0 0 ${clientRect?.left || 0}px`

  return (
    <>
      {React.cloneElement(children, { ref: ref, onMouseEnter: handleMouseEnter, onMouseOut: handleMouseLeave })}
      {show &&
        ReactDOM.createPortal(
          <div
            style={{
              position: 'absolute',
              inset: inset,
              zIndex: 100,
              width: 'fit-content',
              height: 'fit-content',
              transform: 'translateX(-50%)',
            }}
          >
            <Wrapper ref={wrapperRef}>
              {text}
              <Arrow className={`arrow-top`} />
            </Wrapper>
          </div>,
          document.body,
        )}
    </>
  )
}
