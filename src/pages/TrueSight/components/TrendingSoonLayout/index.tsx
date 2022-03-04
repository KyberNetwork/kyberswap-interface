import React, { useState } from 'react'
import styled from 'styled-components'
import { Currency, ETHER } from '@dynamic-amm/sdk'
import { Flex } from 'rebass'

import Pagination from 'components/Pagination'
import TrendingSoonTokenItem from 'pages/TrueSight/components/TrendingSoonLayout/TrendingSoonTokenItem'
import TrendingSoonTokenDetail from 'pages/TrueSight/components/TrendingSoonLayout/TrendingSoonTokenDetail'
import { useTimeoutFn } from 'react-use'
import LocalLoader from 'components/LocalLoader'

const TrendingSoonLayout = () => {
  const [trendingSoonTokens, setTrendingSoonTokens] = useState<Currency[]>([])
  const [isLoadingTrendingSoonTokens, setIsLoadingTrendingSoonTokens] = useState(true)
  const [selectedToken, setSelectedToken] = useState(0)

  useTimeoutFn(() => {
    setTrendingSoonTokens([ETHER, ETHER, ETHER, ETHER, ETHER, ETHER, ETHER, ETHER, ETHER, ETHER])
    setIsLoadingTrendingSoonTokens(false)
  }, 1000)

  return (
    <TrendingSoonLayoutContainer>
      {isLoadingTrendingSoonTokens ? (
        <LocalLoader />
      ) : (
        <>
          <Flex>
            <TrendingSoonTokenList>
              {trendingSoonTokens.map((token, index) => (
                <TrendingSoonTokenItem
                  key={index}
                  isSelected={selectedToken === index}
                  isHighlightBackground={index <= 2}
                  tokenIndex={index + 1}
                  token={token}
                  discoveredOn={Date.now()}
                  onClick={() => setSelectedToken(index)}
                />
              ))}
            </TrendingSoonTokenList>
            <TrendingSoonTokenDetailWrapper>
              <TrendingSoonTokenDetail />
            </TrendingSoonTokenDetailWrapper>
          </Flex>
          <Pagination
            onPrev={() => null}
            onNext={() => null}
            currentPage={1}
            maxPage={99}
            style={{ padding: '20px' }}
          />
        </>
      )}
    </TrendingSoonLayoutContainer>
  )
}

const TrendingSoonLayoutContainer = styled.div`
  background: ${({ theme }) => theme.background};
  border-radius: 8px;
  overflow: hidden;
`

const TrendingSoonTokenList = styled.div`
  width: 40%;
  min-height: 560px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    flex: 1;
  `}
`

const TrendingSoonTokenDetailWrapper = styled.div`
  width: 60%;
  border: 1px solid ${({ theme }) => theme.border};
  border-top-right-radius: 8px;
  padding: 20px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    display: none;
  `}
`

export default TrendingSoonLayout
