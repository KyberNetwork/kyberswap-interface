import React, { useState } from 'react'
import { useMedia } from 'react-use'
import { TrueSightContainer } from 'pages/TrueSight/components/TrendingSoonLayout'
import TrendingTokenItemMobileOnly from 'pages/TrueSight/components/TrendingLayout/TrendingTokenItemMobileOnly'
import { TrueSightTokenData } from 'pages/TrueSight/hooks/useGetTrendingSoonData'
import { TrueSightChartCategory, TrueSightFilter, TrueSightTimeframe } from 'pages/TrueSight/index'
import useGetTrendingSoonChartData from 'pages/TrueSight/hooks/useGetTrendingSoonChartData'
import useTheme from 'hooks/useTheme'
import Pagination from 'components/Pagination'
import { Flex, Text } from 'rebass'
import MobileChartModal from 'pages/TrueSight/components/TrendingSoonLayout/MobileChartModal'
import useGetTrendingData from 'pages/TrueSight/hooks/useGetTrendingData'
import LocalLoader from 'components/LocalLoader'
import WarningIcon from 'components/LiveChart/WarningIcon'
import { Trans } from '@lingui/macro'

const ITEM_PER_PAGE_DESKTOP = 20
const ITEM_PER_PAGE_MOBILE = 10

const TrendingLayout = ({ filter }: { filter: TrueSightFilter }) => {
  const [selectedToken, setSelectedToken] = useState<TrueSightTokenData>()
  const [isOpenChartModal, setIsOpenChartModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const above1200 = useMedia('(min-width: 1200px)')
  const ITEM_PER_PAGE = above1200 ? ITEM_PER_PAGE_DESKTOP : ITEM_PER_PAGE_MOBILE
  const {
    data: trendingSoonData,
    isLoading: isLoadingTrendingSoonTokens,
    error: errorWhenLoadingTrendingSoonData,
  } = useGetTrendingData(filter, currentPage, ITEM_PER_PAGE)
  const maxPage = Math.ceil((trendingSoonData?.total_number_tokens ?? 1) / ITEM_PER_PAGE)
  const trendingSoonTokens = trendingSoonData?.tokens ?? []

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
            {trendingSoonTokens.map(tokenData => (
              <TrendingTokenItemMobileOnly
                key={tokenData.token_id}
                isSelected={selectedToken?.token_id === tokenData.token_id}
                tokenData={tokenData}
                onSelect={() =>
                  setSelectedToken(prev => (prev?.token_id === tokenData.token_id ? undefined : tokenData))
                }
                setIsOpenChartModal={setIsOpenChartModal}
              />
            ))}
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

export default TrendingLayout
