import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import { useMedia } from 'react-use'

import Pagination from 'components/Pagination'
import LocalLoader from 'components/LocalLoader'
import TrendingSoonTokenItem from 'pages/TrueSight/components/TrendingSoonLayout/TrendingSoonTokenItem'
import TrendingSoonTokenDetail from 'pages/TrueSight/components/TrendingSoonLayout/TrendingSoonTokenDetail'
import MobileChartModal from 'pages/TrueSight/components/TrendingSoonLayout/MobileChartModal'
import useTrendingSoonData, { TrendingSoonTokenData } from 'pages/TrueSight/hooks/useTrendingSoonData'
import { TrueSightFilter } from 'pages/TrueSight/index'
import { Trans } from '@lingui/macro'

const ITEM_PER_PAGE = 10

const TrendingSoonLayout = ({ filter }: { filter: TrueSightFilter }) => {
  const [selectedToken, setSelectedToken] = useState<TrendingSoonTokenData>()
  const [isOpenChartModal, setIsOpenChartModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const {
    data: trendingSoonData,
    isLoading: isLoadingTrendingSoonTokens,
    error: errorWhenLoadingTrendingSoonData
  } = useTrendingSoonData(filter, currentPage, ITEM_PER_PAGE)
  const maxPage = Math.ceil((trendingSoonData?.total_number_tokens ?? 1) / ITEM_PER_PAGE)
  const trendingSoonTokens = trendingSoonData?.tokens ?? []

  const above1200 = useMedia('(min-width: 1200px)')
  useEffect(() => {
    if (above1200 && selectedToken === undefined && trendingSoonTokens.length) setSelectedToken(trendingSoonTokens[0])
  }, [above1200, selectedToken, trendingSoonTokens])

  return (
    <>
      <TrendingSoonLayoutContainer>
        {isLoadingTrendingSoonTokens ? (
          <LocalLoader />
        ) : errorWhenLoadingTrendingSoonData ? (
          <Text style={{ height: '180px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Trans>The data is not ready. Please try again later.</Trans>
          </Text>
        ) : (
          <>
            <Flex>
              <TrendingSoonTokenList>
                {trendingSoonTokens.map((tokenData, index) => (
                  <TrendingSoonTokenItem
                    key={tokenData.token_id}
                    isSelected={selectedToken?.token_id === tokenData.token_id}
                    tokenIndex={ITEM_PER_PAGE * (currentPage - 1) + index}
                    tokenData={tokenData}
                    onSelect={() =>
                      setSelectedToken(prev =>
                        prev?.token_id === tokenData.token_id && !above1200 ? undefined : tokenData
                      )
                    }
                    setIsOpenChartModal={setIsOpenChartModal}
                  />
                ))}
              </TrendingSoonTokenList>
              <TrendingSoonTokenDetailWrapper>
                {selectedToken && <TrendingSoonTokenDetail tokenData={selectedToken} />}
              </TrendingSoonTokenDetailWrapper>
            </Flex>
            <Pagination
              onPrev={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              onNext={() => setCurrentPage(prev => Math.min(maxPage, prev + 1))}
              currentPage={currentPage}
              maxPage={maxPage}
              style={{ padding: '20px' }}
            />
          </>
        )}
      </TrendingSoonLayoutContainer>
      <MobileChartModal isOpen={isOpenChartModal} setIsOpen={setIsOpenChartModal} />
    </>
  )
}

const TrendingSoonLayoutContainer = styled.div`
  background: ${({ theme }) => theme.background};
  border-radius: 8px;
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
