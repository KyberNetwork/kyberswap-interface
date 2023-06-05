import React, { CSSProperties, ReactNode, forwardRef, useCallback } from 'react'
import { CheckCircle } from 'react-feather'
import { Flex } from 'rebass'
import styled, { keyframes } from 'styled-components'

import CopyIcon from 'components/Icons/CopyIcon'
import useCopyClipboard from 'hooks/useCopyClipboard'

const Wrapper = styled.div<{ margin?: string; size?: string }>`
  flex-shrink: 0;
  margin-left: 4px;
  text-decoration: none;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  :hover,
  :active,
  :focus {
    opacity: 0.8;
  }
`

const copy = keyframes`
  0%{
    transform: translateY(0);
    visibility: visible;
  }
  20%{
    transform: translateY(100%);
    visibility: hidden;
  }
  80%{
    transform: translateY(-100%);
    visibility: hidden;
  }
  100%{
    transform: translateY(0);
    visibility: visible;
  }
`
const check = keyframes`
  0%{
    transform: translateY(-100%);
  }
  20%{
    transform: translateY(0);
  }
  80%{
    transform: translateY(0);
  }
  100%{
    transform: translateY(100%);
  }
`

const CopyIconWrapper = styled.div`
  position: absolute;
  display:flex;
  align-items: center
  left: 0;
  &.copied {
    animation: ${copy} 1.5s;
  }
`
const CheckIconWrapper = styled.div`
  transform: translateY(-100%);
  color: ${({ theme }) => theme.primary};
  &.copied {
    animation: ${check} 1.5s;
  }
`

type Props = {
  toCopy: string
  children?: React.ReactNode
  margin?: string
  style?: CSSProperties
  size?: string
  text?: ReactNode
  color?: string
}

const CopyHelper = forwardRef<HTMLDivElement, Props>(function CopyHelper(
  { toCopy, margin, style = {}, size, text, color },
  ref,
) {
  const [isCopied, setCopied] = useCopyClipboard(2000)

  const onCopy = useCallback(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      event.stopPropagation()
      setCopied(toCopy)
    },
    [toCopy, setCopied],
  )
  const copyIcon = (
    <>
      <CopyIconWrapper className={isCopied ? 'copied' : ''} style={{ color: color }}>
        <CopyIcon size={size || 14} />
      </CopyIconWrapper>
      <CheckIconWrapper className={isCopied ? 'copied' : ''}>
        <CheckCircle size={size || 14} />
      </CheckIconWrapper>
    </>
  )

  return (
    <Wrapper ref={ref} onMouseDown={onCopy} margin={margin} style={style}>
      {text ? (
        <Flex>
          {copyIcon}&nbsp;{text}
        </Flex>
      ) : (
        copyIcon
      )}
    </Wrapper>
  )
})

export default CopyHelper
