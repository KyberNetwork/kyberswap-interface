import React from 'react'
import styled from 'styled-components'
import { ETHER } from '@dynamic-amm/sdk'
import { Flex } from 'rebass'

import Pagination from 'components/Pagination'
import TrendingSoonTokenItem from 'pages/TrueSight/components/TrendingSoonLayout/TrendingSoonTokenItem'
import TrendingSoonTokenDetail from 'pages/TrueSight/components/TrendingSoonLayout/TrendingSoonTokenDetail'

const TrendingSoonLayout = () => {
  return (
    <TrendingSoonLayoutContainer>
      <Flex>
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
          <TrendingSoonTokenItem
            isSelected={false}
            isHighlightBackground={false}
            tokenIndex={5}
            token={ETHER}
            discoveredOn={Date.now()}
          />
          <TrendingSoonTokenItem
            isSelected={false}
            isHighlightBackground={false}
            tokenIndex={6}
            token={ETHER}
            discoveredOn={Date.now()}
          />
          <TrendingSoonTokenItem
            isSelected={false}
            isHighlightBackground={false}
            tokenIndex={7}
            token={ETHER}
            discoveredOn={Date.now()}
          />
          <TrendingSoonTokenItem
            isSelected={false}
            isHighlightBackground={false}
            tokenIndex={8}
            token={ETHER}
            discoveredOn={Date.now()}
          />
          <TrendingSoonTokenItem
            isSelected={false}
            isHighlightBackground={false}
            tokenIndex={9}
            token={ETHER}
            discoveredOn={Date.now()}
          />
          <TrendingSoonTokenItem
            isSelected={false}
            isHighlightBackground={false}
            tokenIndex={10}
            token={ETHER}
            discoveredOn={Date.now()}
          />
        </TrendingSoonTokenList>
        <TrendingSoonTokenDetailWrapper>
          <TrendingSoonTokenDetail />
        </TrendingSoonTokenDetailWrapper>
      </Flex>
      <Pagination onPrev={() => null} onNext={() => null} currentPage={1} maxPage={99} style={{ padding: '20px' }} />
    </TrendingSoonLayoutContainer>
  )
}

const TrendingSoonLayoutContainer = styled.div`
  background: ${({ theme }) => theme.background};
  border-radius: 8px;
  overflow: hidden;
`

const TrendingSoonTokenList = styled.div`
  flex: 4;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    flex: 1;
  `}
`

const TrendingSoonTokenDetailWrapper = styled.div`
  flex: 6;
  border: 1px solid ${({ theme }) => theme.border};
  border-top-right-radius: 8px;
  padding: 20px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    display: none;
  `}
`

export default TrendingSoonLayout
