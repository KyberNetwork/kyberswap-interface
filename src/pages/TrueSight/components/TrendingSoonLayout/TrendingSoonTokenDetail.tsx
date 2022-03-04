import React, { useState } from 'react'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import { ETHER } from '@dynamic-amm/sdk'
import { Trans } from '@lingui/macro'

import CurrencyLogo from 'components/CurrencyLogo'
import { ChevronDown } from 'react-feather'
import useTheme from 'hooks/useTheme'
import Divider from 'components/Divider'
import SwapButtonWithOptions from 'pages/TrueSight/components/SwapButtonWithOptions'
import { rgba } from 'polished'
import LineChart from 'components/LiveChart/LineChart'
import { LiveDataTimeframeEnum } from 'hooks/useLiveChartData'
import { TrueSightChartDataType, TrueSightTimeframe } from 'pages/TrueSight/index'
import AddressButton from 'pages/TrueSight/components/AddressButton'
import CommunityButton, { WebsiteCommunityButton } from 'pages/TrueSight/components/CommunityButton'
import { ExternalLink } from 'theme'
import Tags from 'pages/TrueSight/components/Tags'
import Chart from 'pages/TrueSight/components/Chart'

const TrendingSoonTokenDetail = () => {
  return <TrendingSoonTokenDesktop />
}

const TrendingSoonTokenDesktop = () => {
  const theme = useTheme()

  return (
    <Flex height="100%" flexDirection="column" style={{ gap: '24px' }}>
      <LogoNameSwapContainer>
        <LogoNameContainer>
          <CurrencyLogo currency={ETHER} size="36px" />
          <Text fontWeight={500} style={{ textTransform: 'uppercase' }}>
            Baby Floki Billionaire
          </Text>
        </LogoNameContainer>
        <SwapButtonWithOptions />
      </LogoNameSwapContainer>

      <TagWebsiteCommunityAddressContainer>
        <Tags />
        <WebsiteCommunityAddressContainer>
          <WebsiteCommunityButton
            as={ExternalLink}
            href="https://www.google.com"
            target="_blank"
            style={{ fontWeight: 400 }}
          >
            Website ↗
          </WebsiteCommunityButton>
          <CommunityButton />
          <AddressButton />
        </WebsiteCommunityAddressContainer>
      </TagWebsiteCommunityAddressContainer>

      <Divider />

      <TokenStatisticsContainer>
        <TokenStatisticsFieldName style={{ textAlign: 'left' }}>
          <Trans>Trading Volume</Trans>
        </TokenStatisticsFieldName>
        <TokenStatisticsFieldName>
          <Trans>24h</Trans>
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
        <TokenStatisticsValue style={{ textAlign: 'left' }}>$21,532,441,584</TokenStatisticsValue>
        <Flex justifyContent="flex-end" alignItems="center" style={{ gap: '4px' }}>
          <ChevronDown size="16px" color={theme.apr} style={{ transform: 'rotate(180deg)' }} />
          <TokenStatisticsValue style={{ color: theme.apr, fontWeight: 500 }}>1,232%</TokenStatisticsValue>
        </Flex>
        <TokenStatisticsValue>$807,381,607,897</TokenStatisticsValue>
        <TokenStatisticsValue>200,000,000</TokenStatisticsValue>
        <TokenStatisticsValue>$0.000000004234</TokenStatisticsValue>
      </TokenStatisticsContainer>
      <Chart />
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
`

const WebsiteCommunityAddressContainer = styled(Flex)`
  align-items: center;
  gap: 8px;
`

const TokenStatisticsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 0.5fr 1fr 1fr 1fr;
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
