import React from 'react'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import { ETHER } from '@dynamic-amm/sdk'
import { Trans } from '@lingui/macro'

import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import SwapButtonWithOptions from 'pages/TrueSight/components/SwapButtonWithOptions'
import AddressButton from 'pages/TrueSight/components/AddressButton'
import CommunityButton, { WebsiteCommunityButton } from 'pages/TrueSight/components/CommunityButton'
import { ExternalLink } from 'theme'
import Tags from 'pages/TrueSight/components/Tags'
import Chart from 'pages/TrueSight/components/Chart'
import { TrendingSoonTokenData } from 'pages/TrueSight/hooks/useTrendingSoonData'
import { formatDollarAmount, formattedNum } from 'utils'

const TrendingSoonTokenDetail = ({ tokenData }: { tokenData: TrendingSoonTokenData }) => {
  return (
    <Flex height="100%" flexDirection="column" style={{ gap: '24px' }}>
      <LogoNameSwapContainer>
        <LogoNameContainer>
          <CurrencyLogo currency={ETHER} size="36px" />
          <Text fontWeight={500} style={{ textTransform: 'uppercase' }}>
            {tokenData.name}
          </Text>
        </LogoNameContainer>
        {/* TODO: */}
        <SwapButtonWithOptions />
      </LogoNameSwapContainer>
      <TagWebsiteCommunityAddressContainer>
        {/* TODO: */}
        <Tags />
        <WebsiteCommunityAddressContainer>
          {/* TODO: */}
          <WebsiteCommunityButton
            as={ExternalLink}
            href="https://www.google.com"
            target="_blank"
            style={{ fontWeight: 400 }}
          >
            Website ↗
          </WebsiteCommunityButton>
          {/* TODO: */}
          <CommunityButton />
          {/* TODO: */}
          <AddressButton />
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
        <TokenStatisticsValue>{formattedNum(tokenData.number_holders.toString(), false)}</TokenStatisticsValue>
        <TokenStatisticsValue>{formattedNum(tokenData.price.toString(), true)}</TokenStatisticsValue>
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
