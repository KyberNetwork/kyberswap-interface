import React from 'react'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import { Trans } from '@lingui/macro'
import Divider from 'components/Divider'
import SwapButtonWithOptions from 'pages/TrueSight/components/SwapButtonWithOptions'
import AddressButton from 'pages/TrueSight/components/AddressButton'
import CommunityButton, { StyledCommunityButton } from 'pages/TrueSight/components/CommunityButton'
import { ExternalLink } from 'theme'
import Tags from 'pages/TrueSight/components/Tags'
import Chart from 'pages/TrueSight/components/Chart'
import { TrueSightTokenData } from 'pages/TrueSight/hooks/useGetTrendingSoonData'
import { formattedNum } from 'utils'
import { TrendingSoonChartData } from 'pages/TrueSight/hooks/useGetTrendingSoonChartData'
import { TrueSightChartCategory, TrueSightTimeframe } from 'pages/TrueSight/index'

const TrendingSoonTokenDetail = ({
  tokenData,
  chartData,
  chartCategory,
  setChartCategory,
  chartTimeframe,
  setChartTimeframe,
}: {
  tokenData: TrueSightTokenData
  chartData: TrendingSoonChartData
  chartCategory: TrueSightChartCategory
  setChartCategory: React.Dispatch<React.SetStateAction<TrueSightChartCategory>>
  chartTimeframe: TrueSightTimeframe
  setChartTimeframe: React.Dispatch<React.SetStateAction<TrueSightTimeframe>>
}) => {
  return (
    <Flex height="100%" flexDirection="column" style={{ gap: '24px' }}>
      <LogoNameSwapContainer>
        <LogoNameContainer>
          <img src={tokenData.logo_url} style={{ minWidth: '36px', width: '36px', borderRadius: '50%' }} alt="logo" />
          <Text fontWeight={500} style={{ textTransform: 'uppercase' }}>
            {tokenData.name}
          </Text>
        </LogoNameContainer>
        <SwapButtonWithOptions platforms={tokenData.platforms} />
      </LogoNameSwapContainer>
      <TagWebsiteCommunityAddressContainer>
        <Tags tags={tokenData.tags} />
        <WebsiteCommunityAddressContainer>
          <StyledCommunityButton
            as={ExternalLink}
            href={tokenData.official_web}
            target="_blank"
            style={{ fontWeight: 400 }}
          >
            Website ↗
          </StyledCommunityButton>
          <CommunityButton communityOption={tokenData.social_urls} />
          <AddressButton platforms={tokenData.platforms} />
        </WebsiteCommunityAddressContainer>
      </TagWebsiteCommunityAddressContainer>

      <Divider />

      <TokenStatisticsContainer>
        <TokenStatisticsFieldName style={{ textAlign: 'left' }}>
          <Trans>Trading Volume (24H)</Trans>
        </TokenStatisticsFieldName>
        <TokenStatisticsFieldName>
          <Trans>Market Cap</Trans>
        </TokenStatisticsFieldName>
        <TokenStatisticsFieldName>
          <Trans>Holders</Trans>
        </TokenStatisticsFieldName>
        <TokenStatisticsFieldName>
          <Trans>Price</Trans>
        </TokenStatisticsFieldName>
        <TokenStatisticsValue style={{ textAlign: 'left' }}>
          {formattedNum(tokenData.trading_volume.toString(), true)}
        </TokenStatisticsValue>
        <TokenStatisticsValue>{formattedNum(tokenData.market_cap.toString(), true)}</TokenStatisticsValue>
        <TokenStatisticsValue>
          {tokenData.number_holders === -1 ? '--' : formattedNum(tokenData.number_holders.toString(), false)}
        </TokenStatisticsValue>
        <TokenStatisticsValue>{formattedNum(tokenData.price.toString(), true)}</TokenStatisticsValue>
      </TokenStatisticsContainer>
      <Chart
        chartData={chartData}
        chartCategory={chartCategory}
        setChartCategory={setChartCategory}
        chartTimeframe={chartTimeframe}
        setChartTimeframe={setChartTimeframe}
      />
    </Flex>
  )
}

const LogoNameSwapContainer = styled(Flex)`
  justify-content: space-between;
  align-items: center;
`

const LogoNameContainer = styled(Flex)`
  align-items: center;
  gap: 8px;
`

const TagWebsiteCommunityAddressContainer = styled(Flex)`
  justify-content: space-between;
  align-items: center;
  gap: 16px;
`

const WebsiteCommunityAddressContainer = styled(Flex)`
  align-items: center;
  gap: 8px;
`

const TokenStatisticsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 4px;
`

const TokenStatisticsFieldName = styled(Text)`
  font-weight: 500;
  font-size: 12px;
  text-transform: uppercase;
  text-align: right;
`

const TokenStatisticsValue = styled(Text)`
  font-weight: 400;
  font-size: 14px;
  color: ${({ theme }) => theme.text};
  text-align: right;
`

export default TrendingSoonTokenDetail
