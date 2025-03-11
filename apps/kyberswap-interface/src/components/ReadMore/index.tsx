import { Trans } from '@lingui/macro'
import { useState } from 'react'
import styled from 'styled-components'

const Wrapper = styled.div`
  overflow: hidden;
  position: relative;
`

const ContentWrapper = styled.div``
const ReadMoreWrapper = styled.div<{ backgroundColor: string }>`
  font-size: 12px;
  line-height: 16px;
  height: 20px;
  color: ${({ theme }) => theme.primary};
  position: absolute;
  bottom: 0;
  background: linear-gradient(0, ${({ backgroundColor }) => backgroundColor} 10%, rgba(0, 0, 0, 0) 100%);
  width: 100%;

  cursor: pointer;
  display: flex;
  align-items: flex-end;
`
type ReadMoreProps = {
  open?: boolean
  textStyles?: React.CSSProperties
  contentHeight?: string
  buttonHeight?: string
  backgroundColor?: string
  children: React.ReactNode
}

export default function ReadMore({
  open,
  textStyles,
  contentHeight = '50px',
  // height of read more button and transparent background
  buttonHeight = '30px',
  // change this on different background to mimic transparent
  backgroundColor = '#0F0F0F',
  children,
}: ReadMoreProps) {
  const [isShow, setIsShow] = useState(!!open)
  if (isShow) return <>{children}</>
  return (
    <Wrapper style={{ height: contentHeight }}>
      <ContentWrapper>{children}</ContentWrapper>
      <ReadMoreWrapper
        onClick={() => setIsShow(true)}
        style={{ ...textStyles, height: buttonHeight }}
        backgroundColor={backgroundColor}
      >
        <Trans>Read more</Trans>
      </ReadMoreWrapper>
    </Wrapper>
  )
}
