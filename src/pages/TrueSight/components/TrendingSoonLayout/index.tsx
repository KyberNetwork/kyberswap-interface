import React from 'react'
import styled from 'styled-components'
import useTheme from 'hooks/useTheme'
import TrendingSoonTokenItem from 'pages/TrueSight/components/TrendingSoonLayout/TrendingSoonTokenItem'
import { ETHER } from '@dynamic-amm/sdk'

const TrendingSoonLayout = () => {
  const theme = useTheme()

  return (
    <TrendingSoonLayoutContainer>
      <TrendingSoonTokenList>
        <TrendingSoonTokenItem
          isSelected={true}
          isHighlightBackground={true}
          tokenIndex={1}
          token={ETHER}
          discoveredOn={Date.now()}
        />
        <TrendingSoonTokenItem
          isSelected={false}
          isHighlightBackground={true}
          tokenIndex={2}
          token={ETHER}
          discoveredOn={Date.now()}
        />
        <TrendingSoonTokenItem
          isSelected={false}
          isHighlightBackground={true}
          tokenIndex={3}
          token={ETHER}
          discoveredOn={Date.now()}
        />
        <TrendingSoonTokenItem
          isSelected={false}
          isHighlightBackground={false}
          tokenIndex={4}
          token={ETHER}
          discoveredOn={Date.now()}
        />
      </TrendingSoonTokenList>
      <TrendingSoonTokenDetail>ok</TrendingSoonTokenDetail>
    </TrendingSoonLayoutContainer>
  )
}

const TrendingSoonLayoutContainer = styled.div`
  background: ${({ theme }) => theme.background};
  display: flex;
  border-radius: 8px;
  overflow: hidden;
`

const TrendingSoonTokenList = styled.div`
  flex: 4;
`

const TrendingSoonTokenDetail = styled.div`
  flex: 6;
  border: 1px solid ${({ theme }) => theme.border};
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
`

export default TrendingSoonLayout
