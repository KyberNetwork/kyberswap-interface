import React from 'react'
import styled from 'styled-components'
import { rgba } from 'polished'
import { Trans } from '@lingui/macro'

import useTheme from 'hooks/useTheme'
import { Box, Flex, Text } from 'rebass'
import dayjs from 'dayjs'
import { ChevronDown } from 'react-feather'
import { ButtonOutlined } from 'components/Button'
import Tags from 'pages/TrueSight/components/Tags'
import Divider from 'components/Divider'
import { ExternalLink } from 'theme'
import AddressButton from 'pages/TrueSight/components/AddressButton'
import CommunityButton from 'pages/TrueSight/components/CommunityButton'
import SwapButtonWithOptions from 'pages/TrueSight/components/SwapButtonWithOptions'
import { ReactComponent as BarChartIcon } from 'assets/svg/bar_chart_icon.svg'
import { formattedNum } from 'utils'
import {
  FieldName,
  FieldValue,
  TruncatedText,
} from 'pages/TrueSight/components/TrendingSoonLayout/TrendingSoonTokenItem'
import { TrueSightTokenData } from 'pages/TrueSight/hooks/useGetTrendingSoonData'
import DiscoverIconTriangle from 'assets/svg/discover_icon_triangle.svg'
import { TRUESIGHT_WHEN_TO_K } from 'pages/TrueSight/index'
import { TableBodyItemSmallDiff } from 'pages/TrueSight/components/TrendingLayout/index'

const StyledTrendingTokenItem = styled(Flex)<{
  isSelected: boolean
  isTrueSightToken: boolean
}>`
  position: relative;
  padding: 10px 20px 10.5px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme, isTrueSightToken }) => (isTrueSightToken ? rgba(theme.bg8, 0.12) : 'transparent')};
  cursor: pointer;
  gap: 16px;

  ${({ theme, isTrueSightToken, isSelected }) => `
    &, &:hover {
      background: ${isSelected ? theme.tableHeader : isTrueSightToken ? rgba(theme.bg8, 0.12) : 'transparent'};
    }
  `};
`

const DiscoverIconImg = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
`

interface TrendingTokenItemProps {
  isSelected: boolean
  tokenData: TrueSightTokenData
  onSelect: () => void
  setIsOpenChartModal: React.Dispatch<React.SetStateAction<boolean>>
}

const TrendingTokenItemMobileOnly = ({
  isSelected,
  tokenData,
  onSelect,
  setIsOpenChartModal,
}: TrendingTokenItemProps) => {
  const theme = useTheme()
  const date = dayjs(tokenData.discovered_on * 1000).format('YYYY/MM/DD')

  const isTrueSightToken = tokenData.discovered_on !== 0

  return (
    <StyledTrendingTokenItem flexDirection="column" isSelected={isSelected} isTrueSightToken={isTrueSightToken}>
      {isTrueSightToken && <DiscoverIconImg src={DiscoverIconTriangle} alt="discover_icon_triangle" />}
      <Flex justifyContent="space-between" alignItems="center" onClick={onSelect} style={{ gap: '16px' }}>
        <Flex alignItems="center">
          <img
            src={tokenData.logo_url}
            style={{ minWidth: '24px', width: '24px', minHeight: '24px', height: '24px', borderRadius: '50%' }}
            alt="logo"
          />
          <Flex flexDirection="column" style={{ gap: '4px', marginLeft: '8px' }}>
            <Flex>
              <TruncatedText fontSize="14px" fontWeight={500} color={theme.subText}>
                {tokenData.name}
              </TruncatedText>
              <Text fontSize="14px" fontWeight={500} color={theme.disableText} marginLeft="8px">
                {tokenData.symbol}
              </Text>
            </Flex>
            {tokenData.discovered_on ? (
              <Text fontSize="12px" color={theme.subText}>
                <Trans>We discovered this on</Trans> {date}
              </Text>
            ) : null}
          </Flex>
        </Flex>
        <ChevronDown size={16} style={{ transform: isSelected ? 'rotate(180deg)' : 'unset', minWidth: '16px' }} />
      </Flex>
      {isSelected && (
        <>
          <Flex style={{ gap: '20px', marginTop: '4px' }}>
            <ButtonOutlined
              height="36px"
              fontSize="14px"
              padding="0"
              flex="1"
              onClick={() => setIsOpenChartModal(true)}
            >
              <BarChartIcon />
              <span style={{ marginLeft: '6px' }}>
                <Trans>View chart</Trans>
              </span>
            </ButtonOutlined>
            <SwapButtonWithOptions platforms={tokenData.platforms} style={{ flex: 1, padding: 0, minWidth: 'unset' }} />
          </Flex>

          <Flex flexDirection="column" style={{ gap: '16px', marginTop: '4px' }}>
            <Flex justifyContent="space-between" alignItems="center">
              <FieldName>
                <Trans>Tag</Trans>
              </FieldName>
              <Tags tags={tokenData.tags} style={{ justifyContent: 'flex-end' }} />
            </Flex>

            <Divider />

            <Box>
              <Flex justifyContent="space-between" alignItems="center">
                <FieldName>
                  <Trans>Price</Trans>
                </FieldName>
                <FieldValue>{formattedNum(tokenData.price.toString(), true, TRUESIGHT_WHEN_TO_K)}</FieldValue>
              </Flex>
              {isTrueSightToken && (
                <Flex justifyContent="space-between" alignItems="center" marginTop="8px">
                  <SubFieldName>Since {date}</SubFieldName>
                  <Flex alignItems="center" style={{ gap: '4px' }}>
                    <SubFieldValue>$0.000000000003</SubFieldValue>
                    <TableBodyItemSmallDiff up={true}>1,423%</TableBodyItemSmallDiff>
                  </Flex>
                </Flex>
              )}
            </Box>

            <Divider />

            <Box>
              <Flex justifyContent="space-between" alignItems="center">
                <FieldName>
                  <Trans>Trading Volume (24H)</Trans>
                </FieldName>
                <FieldValue>{formattedNum(tokenData.trading_volume.toString(), true, TRUESIGHT_WHEN_TO_K)}</FieldValue>
              </Flex>
              {isTrueSightToken && (
                <Flex justifyContent="space-between" alignItems="center" marginTop="8px">
                  <SubFieldName>Since {date}</SubFieldName>
                  <Flex alignItems="center" style={{ gap: '4px' }}>
                    <SubFieldValue>$0.000000000003</SubFieldValue>
                    <TableBodyItemSmallDiff up={true}>1,423%</TableBodyItemSmallDiff>
                  </Flex>
                </Flex>
              )}
            </Box>

            <Divider />

            <Box>
              <Flex justifyContent="space-between" alignItems="center">
                <FieldName>
                  <Trans>Market Cap</Trans>
                </FieldName>
                <FieldValue>{formattedNum(tokenData.market_cap.toString(), true, TRUESIGHT_WHEN_TO_K)}</FieldValue>
              </Flex>
              {isTrueSightToken && (
                <Flex justifyContent="space-between" alignItems="center" marginTop="8px">
                  <SubFieldName>Since {date}</SubFieldName>
                  <Flex alignItems="center" style={{ gap: '4px' }}>
                    <SubFieldValue>$0.000000000003</SubFieldValue>
                    <TableBodyItemSmallDiff up={true}>1,423%</TableBodyItemSmallDiff>
                  </Flex>
                </Flex>
              )}
            </Box>

            <Divider />

            <Box>
              <Flex justifyContent="space-between" alignItems="center">
                <FieldName>
                  <Trans>Holders</Trans>
                </FieldName>
                <FieldValue>
                  {tokenData.number_holders === -1
                    ? '--'
                    : formattedNum(tokenData.number_holders.toString(), false, TRUESIGHT_WHEN_TO_K)}
                </FieldValue>
              </Flex>
              {isTrueSightToken && (
                <Flex justifyContent="space-between" alignItems="center" marginTop="8px">
                  <SubFieldName>Since {date}</SubFieldName>
                  <Flex alignItems="center" style={{ gap: '4px' }}>
                    <SubFieldValue>$0.000000000003</SubFieldValue>
                    <TableBodyItemSmallDiff up={false}>-1,423%</TableBodyItemSmallDiff>
                  </Flex>
                </Flex>
              )}
            </Box>

            <Divider />

            <Flex justifyContent="space-between" alignItems="center">
              <FieldName>
                <Trans>Website</Trans>
              </FieldName>
              <FieldValue as={ExternalLink} target="_blank" href={tokenData.official_web}>
                <Trans>{tokenData.official_web} ↗</Trans>
              </FieldValue>
            </Flex>
            <Divider />
            <Flex justifyContent="space-between" alignItems="center">
              <CommunityButton communityOption={tokenData.social_urls} />
              <AddressButton platforms={tokenData.platforms} />
            </Flex>
          </Flex>
        </>
      )}
    </StyledTrendingTokenItem>
  )
}

export default TrendingTokenItemMobileOnly

const SubFieldName = styled.div`
  color: ${({ theme }) => theme.disableText};
  font-size: 12px;
  font-style: italic;
`

const SubFieldValue = styled.div`
  color: ${({ theme }) => theme.disableText};
  font-size: 12px;
  font-style: normal;
`
