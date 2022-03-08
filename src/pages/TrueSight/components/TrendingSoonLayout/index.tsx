import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import { useMedia } from 'react-use'

import Pagination from 'components/Pagination'
import LocalLoader from 'components/LocalLoader'
import TrendingSoonTokenItem from 'pages/TrueSight/components/TrendingSoonLayout/TrendingSoonTokenItem'
import TrendingSoonTokenDetail from 'pages/TrueSight/components/TrendingSoonLayout/TrendingSoonTokenDetail'
import MobileChartModal from 'pages/TrueSight/components/TrendingSoonLayout/MobileChartModal'
import useGetTrendingSoonData, { TrueSightTokenData } from 'pages/TrueSight/hooks/useGetTrendingSoonData'
import { TrueSightChartCategory, TrueSightFilter, TrueSightTimeframe } from 'pages/TrueSight/index'
import { Trans } from '@lingui/macro'
import useGetTrendingSoonChartData from 'pages/TrueSight/hooks/useGetTrendingSoonChartData'
import WarningIcon from 'components/LiveChart/WarningIcon'
import useTheme from 'hooks/useTheme'

const ITEM_PER_PAGE = 10

const TrendingSoonLayout = ({ filter }: { filter: TrueSightFilter }) => {
  const [selectedToken, setSelectedToken] = useState<TrueSightTokenData>()
  const [isOpenChartModal, setIsOpenChartModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const {
    data: trendingSoonData,
    isLoading: isLoadingTrendingSoonTokens,
    error: errorWhenLoadingTrendingSoonData,
  } = useGetTrendingSoonData(filter, currentPage, ITEM_PER_PAGE)
  const maxPage = Math.ceil((trendingSoonData?.total_number_tokens ?? 1) / ITEM_PER_PAGE)
  const trendingSoonTokens = trendingSoonData?.tokens ?? []

  const above1200 = useMedia('(min-width: 1200px)')
  useEffect(() => {
    if (above1200 && selectedToken === undefined && trendingSoonTokens.length) setSelectedToken(trendingSoonTokens[0])
  }, [above1200, selectedToken, trendingSoonTokens])

  useEffect(() => {
    if (above1200 && trendingSoonTokens.length) setSelectedToken(trendingSoonTokens[0])
  }, [currentPage, above1200, trendingSoonTokens])

  const [chartTimeframe, setChartTimeframe] = useState<TrueSightTimeframe>(TrueSightTimeframe.ONE_DAY)
  const [chartCategory, setChartCategory] = useState<TrueSightChartCategory>(TrueSightChartCategory.TRADING_VOLUME)
  const { data: chartData } = useGetTrendingSoonChartData(
    selectedToken ? selectedToken.token_id : undefined,
    chartTimeframe,
  )

  const theme = useTheme()

  return (
    <>
      <TrueSightContainer>
        {isLoadingTrendingSoonTokens ? (
          <LocalLoader />
        ) : errorWhenLoadingTrendingSoonData ? (
          <Flex
            flexDirection="column"
            height="100%"
            justifyContent="center"
            alignItems="center"
            style={{ height: '616px', gap: '16px' }}
          >
            <WarningIcon />
            <Text color={theme.disableText}>
              <Trans>No token found</Trans>
            </Text>
          </Flex>
        ) : (
          <>
            <Flex>
              <TrendingSoonTokenList>
                {trendingSoonTokens.map((tokenData, index) => (
                  <TrendingSoonTokenItem
                    key={tokenData.token_id}
                    isSelected={selectedToken?.token_id === tokenData.token_id}
                    tokenIndex={ITEM_PER_PAGE * (currentPage - 1) + index + 1}
                    tokenData={tokenData}
                    onSelect={() =>
                      setSelectedToken(prev =>
                        prev?.token_id === tokenData.token_id && !above1200 ? undefined : tokenData,
                      )
                    }
                    setIsOpenChartModal={setIsOpenChartModal}
                  />
                ))}
              </TrendingSoonTokenList>
              <TrendingSoonTokenDetailWrapper>
                {selectedToken && (
                  <TrendingSoonTokenDetail
                    tokenData={selectedToken}
                    chartData={chartData}
                    chartCategory={chartCategory}
                    setChartCategory={setChartCategory}
                    chartTimeframe={chartTimeframe}
                    setChartTimeframe={setChartTimeframe}
                  />
                )}
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
      </TrueSightContainer>
      <MobileChartModal
        isOpen={isOpenChartModal}
        setIsOpen={setIsOpenChartModal}
        chartData={chartData}
        chartCategory={chartCategory}
        setChartCategory={setChartCategory}
        chartTimeframe={chartTimeframe}
        setChartTimeframe={setChartTimeframe}
      />
    </>
  )
}

export const TrueSightContainer = styled.div`
  background: ${({ theme }) => theme.background};
  border-radius: 8px;
  min-height: 616px;
`

export const TrendingSoonTokenList = styled.div`
  width: 40%;
  min-height: 560px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    flex: 1;
  `}
`

export const TrendingSoonTokenDetailWrapper = styled.div`
  width: 60%;
  border: 1px solid ${({ theme }) => theme.border};
  border-top-right-radius: 8px;
  padding: 20px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    display: none;
  `}
`

export default TrendingSoonLayout
