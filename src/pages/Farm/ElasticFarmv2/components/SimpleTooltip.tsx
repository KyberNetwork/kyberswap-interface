import { ReactNode } from 'react'
import styled from 'styled-components'

const TooltipWrapper = styled.span`
  left: 50%;
  position: absolute;
  visibility: hidden;
  opacity: 0;
  transition: all 0.05s linear;
  transition-delay: 0.2s;

  padding: 12px;
  border-radius: 4px;
  background-color: var(--table-header);
  font-size: 12px;
  line-height: 16px;
  color: var(--subtext);

  width: max-content;
  max-width: 250px;
  :after {
    content: '';
    height: 0;
    left: 25%;
    width: 0;
    position: absolute;
  }
`

const Wrapper = styled.div<{ placement?: 'top' | 'bottom' }>`
  position: relative;
  width: fit-content;
  max-width: 250px;
  box-shadow: 0 0 5px 0px var(--button-black);
  &.top {
    ${TooltipWrapper} {
      bottom: calc(100% + 6px);
      transform: translate(-25%, -12px);
      :after {
        border-right: 6px solid transparent;
        border-top: 6px solid var(--table-header);
        border-left: 6px solid transparent;
        bottom: -6px;
      }
    }
  }
  &.bottom {
    ${TooltipWrapper} {
      top: calc(100% + 6px);
      transform: translate(-25%, 12px);
      :after {
        border-right: 6px solid transparent;
        border-bottom: 6px solid var(--table-header);
        border-left: 6px solid transparent;
        top: -6px;
      }
    }
  }

  &:hover {
    ${TooltipWrapper} {
      visibility: visible;
      opacity: 1;
      transform: translate(-25%, 0);
    }
  }
`

export default function SimpleTooltip({
  placement,
  text,
  children,
}: {
  placement?: 'top' | 'bottom'
  text: string
  children: ReactNode
}) {
  return (
    <Wrapper className={placement || 'top'}>
      {children}
      <TooltipWrapper>{text}</TooltipWrapper>
    </Wrapper>
  )
}
