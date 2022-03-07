import { ETHER } from '@dynamic-amm/sdk'
import React from 'react'
import styled from 'styled-components'
import { darken, rgba } from 'polished'
import { Trans } from '@lingui/macro'

import useTheme from 'hooks/useTheme'
import { Flex, Image, Text } from 'rebass'
import CurrencyLogo from 'components/CurrencyLogo'
import dayjs from 'dayjs'
import Gold from 'assets/svg/gold_icon.svg'
import Silver from 'assets/svg/silver_icon.svg'
import Bronze from 'assets/svg/bronze_icon.svg'
import { useMedia } from 'react-use'
import { ChevronDown } from 'react-feather'
import { ButtonOutlined } from 'components/Button'
import Tags from 'pages/TrueSight/components/Tags'
import Divider from 'components/Divider'
import { ExternalLink } from 'theme'
import AddressButton from 'pages/TrueSight/components/AddressButton'
import CommunityButton from 'pages/TrueSight/components/CommunityButton'
import SwapButtonWithOptions from 'pages/TrueSight/components/SwapButtonWithOptions'
import { ReactComponent as BarChartIcon } from 'assets/svg/bar_chart_icon.svg'
import { TrendingSoonTokenData } from 'pages/TrueSight/hooks/useTrendingSoonData'

const StyledTrendingSoonTokenItem = styled(Flex)<{
  isSelected: boolean
  isHighlightBackground: boolean
}>`
  position: relative;
  padding: 0 20px;
  height: 56px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme, isHighlightBackground }) => (isHighlightBackground ? rgba(theme.bg8, 0.12) : 'transparent')};
  cursor: pointer;

  &:hover {
    background: ${({ theme, isHighlightBackground }) =>
      isHighlightBackground ? darken(0.12, rgba(theme.bg8, 0.12)) : darken(0.05, theme.background)};
  }

  ${({ theme, isHighlightBackground, isSelected }) => theme.mediaWidth.upToLarge`
    &, &:hover {
      background: ${isSelected ? theme.tableHeader : isHighlightBackground ? rgba(theme.bg8, 0.12) : 'transparent'};
    }
  `};

  ${({ theme }) => theme.mediaWidth.upToLarge`
    padding: 10px 20px 10.5px;
    height: auto;
  `}
`

const SelectedHighlight = styled.div`
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  background: ${({ theme }) => theme.primary};
  height: 40px;
  width: 4px;
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
`

interface TrendingSoonTokenItemProps {
  isSelected: boolean
  tokenIndex: number
  tokenData: TrendingSoonTokenData
  onSelect: () => void
  setIsOpenChartModal: React.Dispatch<React.SetStateAction<boolean>>
}

const TrendingSoonTokenItem = ({
  isSelected,
  tokenIndex,
  tokenData,
  onSelect,
  setIsOpenChartModal
}: TrendingSoonTokenItemProps) => {
  const theme = useTheme()
  const date = dayjs(tokenData.discovered_on * 1000).format('YYYY/MM/DD')
  const above1200 = useMedia('(min-width: 1200px)')

  const MedalIndex = () =>
    tokenData.rank === 1 ? (
      <Image src={Gold} />
    ) : tokenData.rank === 2 ? (
      <Image src={Silver} />
    ) : tokenData.rank === 3 ? (
      <Image src={Bronze} />
    ) : (
      <Text fontSize="14px" fontWeight={500} color={theme.subText} width="18px" textAlign="center">
        {tokenIndex}
      </Text>
    )

  if (above1200) {
    return (
      <StyledTrendingSoonTokenItem
        justifyContent="space-between"
        alignItems="center"
        isSelected={isSelected}
        isHighlightBackground={tokenData.rank <= 3}
        onClick={onSelect}
      >
        <Flex alignItems="center">
          <MedalIndex />
          <img
            src="https://picsum.photos/200"
            style={{ minWidth: '16px', width: '16px', marginLeft: '16px', borderRadius: '50%' }}
            alt="logo"
          />
          <Text fontSize="14px" fontWeight={500} color={theme.subText} marginLeft="8px">
            {tokenData.name}
          </Text>
          <Text fontSize="14px" fontWeight={500} color={theme.disableText} marginLeft="8px">
            {tokenData.symbol}
          </Text>
        </Flex>
        <Text fontSize="12px" color={theme.subText}>
          <Trans>Discovered on</Trans>: {date}
        </Text>
        {isSelected && <SelectedHighlight />}
      </StyledTrendingSoonTokenItem>
    )
  }

  return (
    <StyledTrendingSoonTokenItem
      flexDirection="column"
      isSelected={isSelected}
      isHighlightBackground={tokenData.rank <= 3}
    >
      <Flex justifyContent="space-between" alignItems="center" onClick={onSelect}>
        <MedalIndex />
        <Flex alignItems="center" style={{ gap: '8px' }}>
          <img
            src="https://picsum.photos/200"
            style={{ minWidth: '24px', width: '24px', borderRadius: '50%' }}
            alt="logo"
          />
          <Flex flexDirection="column" style={{ gap: '4px' }}>
            <Flex>
              <Text fontSize="14px" fontWeight={500} color={theme.subText}>
                {tokenData.name}
              </Text>
              <Text fontSize="14px" fontWeight={500} color={theme.disableText} marginLeft="8px">
                {tokenData.symbol}
              </Text>
            </Flex>
            <Text fontSize="12px" color={theme.subText}>
              <Trans>Discovered on</Trans>: {date}
            </Text>
          </Flex>
        </Flex>
        <ChevronDown size={16} style={{ transform: isSelected ? 'rotate(180deg)' : 'unset' }} />
      </Flex>
      {isSelected && (
        <>
          <Flex style={{ gap: '20px', marginTop: '20px' }}>
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

          <Flex flexDirection="column" style={{ gap: '16px', marginTop: '20px' }}>
            <Flex justifyContent="space-between" alignItems="center">
              <FieldName>
                <Trans>Tag</Trans>
              </FieldName>
              <Tags />
            </Flex>
            <Divider />
            <Flex justifyContent="space-between" alignItems="center">
              <FieldName>
                <Trans>Price</Trans>
              </FieldName>
              <FieldValue>
                <Trans>$0.00003879</Trans>
              </FieldValue>
            </Flex>
            <Divider />
            <Flex justifyContent="space-between" alignItems="center">
              <FieldName>
                <Trans>Trading Volume (24H)</Trans>
              </FieldName>
              <FieldValue>
                <Trans>$21,532,441,584</Trans>
              </FieldValue>
            </Flex>
            <Divider />
            <Flex justifyContent="space-between" alignItems="center">
              <FieldName>
                <Trans>Market Cap</Trans>
              </FieldName>
              <FieldValue>
                <Trans>$20,905,903,135</Trans>
              </FieldValue>
            </Flex>
            <Divider />
            <Flex justifyContent="space-between" alignItems="center">
              <FieldName>
                <Trans>Price</Trans>
              </FieldName>
              <FieldValue>
                <Trans>$0.00003879</Trans>
              </FieldValue>
            </Flex>
            <Divider />
            <Flex justifyContent="space-between" alignItems="center">
              <FieldName>
                <Trans>Holders</Trans>
              </FieldName>
              <FieldValue>
                <Trans>100,000</Trans>
              </FieldValue>
            </Flex>
            <Divider />
            <Flex justifyContent="space-between" alignItems="center">
              <FieldName>
                <Trans>Website</Trans>
              </FieldName>
              <FieldValue as={ExternalLink} target="_blank" href="https://www.google.com">
                <Trans>website.com ↗</Trans>
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
    </StyledTrendingSoonTokenItem>
  )
}

export default TrendingSoonTokenItem

const FieldName = styled(Text)`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.subText};
`

const FieldValue = styled(Text)`
  font-size: 12px;
  font-weight: 400;
  color: ${({ theme }) => theme.text};
`
