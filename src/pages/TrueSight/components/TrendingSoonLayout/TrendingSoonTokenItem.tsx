import { Currency, Token } from '@dynamic-amm/sdk'
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

const StyledTrendingSoonTokenItem = styled.div<{ isSelected: boolean; isHighlightBackground: boolean }>`
  position: relative;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme, isHighlightBackground }) => (isHighlightBackground ? rgba(theme.bg8, 0.12) : 'transparent')};
  cursor: pointer;

  &:hover {
    background: ${({ theme, isHighlightBackground }) =>
      isHighlightBackground ? darken(0.12, rgba(theme.bg8, 0.12)) : darken(0.05, theme.background)};
  }
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
  isHighlightBackground: boolean
  tokenIndex: number
  token: Token
  discoveredOn: number
}

const TrendingSoonTokenItem = ({
  isSelected,
  isHighlightBackground,
  tokenIndex,
  token,
  discoveredOn
}: TrendingSoonTokenItemProps) => {
  const theme = useTheme()
  const date = dayjs(discoveredOn).format('YYYY/MM/DD')

  return (
    <StyledTrendingSoonTokenItem isSelected={isSelected} isHighlightBackground={isHighlightBackground}>
      <Flex alignItems="center">
        {isHighlightBackground ? (
          tokenIndex === 1 ? (
            <Image src={Gold} />
          ) : tokenIndex === 2 ? (
            <Image src={Silver} />
          ) : (
            <Image src={Bronze} />
          )
        ) : (
          <Text fontSize="14px" fontWeight={500} color={theme.subText} width="18px" textAlign="center">
            {tokenIndex}
          </Text>
        )}
        <CurrencyLogo currency={token} size="16px" style={{ marginLeft: '16px' }} />
        <Text fontSize="14px" fontWeight={500} color={theme.subText} marginLeft="8px">
          {token.name}
        </Text>
        <Text fontSize="14px" fontWeight={500} color={theme.disableText} marginLeft="8px">
          {token.symbol}
        </Text>
      </Flex>
      <Text fontSize="12px" color={theme.subText}>
        <Trans>Discovered on</Trans>: {date}
      </Text>
      {isSelected && <SelectedHighlight />}
    </StyledTrendingSoonTokenItem>
  )
}

export default TrendingSoonTokenItem
