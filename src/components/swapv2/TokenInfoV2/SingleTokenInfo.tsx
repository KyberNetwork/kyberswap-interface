import React, { useRef } from 'react'
import styled from 'styled-components'
import { Trans } from '@lingui/macro'
import { Flex, Text } from 'rebass'
import { Currency } from '@kyberswap/ks-sdk-core'
import { isMobile } from 'react-device-detect'

import Loader from 'components/Loader'
import CurrencyLogo from 'components/CurrencyLogo'
import { TokenInfo } from 'hooks/useTokenInfo'
import useTheme from 'hooks/useTheme'
import { formatDollarAmount } from 'utils/numbers'
import { formattedNum } from 'utils'

import BlockWrapper from './BlockWrapper'

const NOT_AVAILABLE = '--'

const InfoRow = styled.div<{ isFirst?: boolean; isLast?: boolean }>`
  width: 33%;
  text-align: ${({ isLast }) => (isLast ? 'right' : `left`)};
  padding: 7px 0px 7px ${({ isFirst }) => (isFirst ? '0px' : '40px')};
  border-left: ${({ theme, isFirst }) => (isFirst ? 'none' : `1px solid ${theme.border}`)};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    border: none;
    padding: 20px 0px;
`}
`

const InfoRowValue = styled.div`
  color: ${({ theme }) => theme.text};
  font-size: 20px;
  font-weight: 400;
`

const InfoRowLabel = styled.div`
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
  font-weight: 500;
  padding-bottom: 8px;
  line-height: 24px;
`

const AboutText = styled.h2`
  color: ${({ theme }) => theme.subText};
  font-size: 20px;
  font-weight: 500;
  margin: 0;
`

/**
 * replace a tag, script tag.    the others tags will remain.
 * @param text
 * @returns
 */
function replaceHtml(text: string) {
  if (!text) return ''
  return text
    .replace(/\u200B/g, '') // remove zero width space
    .replace(/<a[^>]*>/g, '') // replace a tag
    .replace(/<\/a>/g, '') // replace a close tag
    .replace(/<.*?script.*?>.*?<\/.*?script.*?>/gim, '') // replace script tag
}

/**
 * Tether (USDT) => Tether
 * @param text
 * @returns
 */
function formatString(text: string | undefined) {
  return text ? text.replace(/\s\(.*\)/i, '') : ''
}

const SwapInstruction = styled.div`
  margin-top: 16px;
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
  font-weight: 500;
  line-height: 24px;
`

export function HowToSwap({
  fromCurrency,
  toCurrency,
  fromCurrencyInfo,
  toCurrencyInfo,
  expandedOnMount,
}: {
  fromCurrency: Currency | undefined
  toCurrency: Currency | undefined
  fromCurrencyInfo: TokenInfo
  toCurrencyInfo: TokenInfo
  expandedOnMount?: boolean
}) {
  const theme = useTheme()

  if (!fromCurrency || !toCurrency || !fromCurrencyInfo || !toCurrencyInfo) return null
  const symbol1 = fromCurrency.symbol
  const symbol2 = toCurrency.symbol
  const name1 = fromCurrency.name
  const name2 = toCurrency.name

  const fromName = formatString(fromCurrencyInfo.name || name1)
  const toName = formatString(toCurrencyInfo.name || name2)

  return (
    <BlockWrapper
      expandedOnMount={expandedOnMount}
      header={
        <Text
          as="h2"
          sx={{
            color: theme.subText,
            fontSize: '20px',
            fontWeight: 500,
          }}
        >
          How to swap {symbol1} to {symbol2}?
        </Text>
      }
    >
      <SwapInstruction>
        <Text as="span">
          {fromName} ({symbol1}) can be exchanged to {toName} ({symbol1} to {symbol2}) on KyberSwap, a cryptocurrency
          decentralized exchange. By using KyberSwap, users can trade {symbol1} to {symbol2} on networks at the best
          rates, and earn more with your {symbol1} token without needing to check rates across multiple platforms.
        </Text>
      </SwapInstruction>
    </BlockWrapper>
  )
}

const SingleTokenInfo = ({
  data: tokenInfo,
  currency,
  loading,
  expandedOnMount,
}: {
  data: TokenInfo
  currency?: Currency
  loading: boolean
  expandedOnMount?: boolean
}) => {
  const description = replaceHtml(tokenInfo?.description?.en)

  const ref = useRef<HTMLParagraphElement>(null)

  const symbol = currency?.symbol
  const currencyName = tokenInfo.name || currency?.name

  const listField = [
    { label: 'Price', value: tokenInfo.price ? formattedNum(tokenInfo.price.toString(), true) : NOT_AVAILABLE },
    {
      label: 'Market Cap Rank',
      value: tokenInfo.marketCapRank ? `#${formattedNum(tokenInfo.marketCapRank.toString())}` : NOT_AVAILABLE,
    },
    {
      label: '24H Volume',
      value: !tokenInfo.tradingVolume
        ? NOT_AVAILABLE
        : isMobile
        ? formatDollarAmount(tokenInfo.tradingVolume, 2).toUpperCase()
        : formattedNum(tokenInfo.tradingVolume.toString(), true),
    },
  ]
  return (
    <BlockWrapper
      expandedOnMount={expandedOnMount}
      header={
        <Flex alignItems="center">
          <CurrencyLogo currency={currency} size="24px" style={{ marginRight: 10 }} />
          <AboutText>
            {/* About Usdt (Tether(...)) => Usdt (Tether) */}
            About {symbol} {currencyName !== symbol ? `(${formatString(currencyName)})` : null}
          </AboutText>
        </Flex>
      }
    >
      <InfoRowLabel
        className="desc"
        ref={ref}
        dangerouslySetInnerHTML={{
          __html: description.replaceAll('\r\n\r\n', '<br><br>'),
        }}
      />
      <Flex flexWrap="wrap">
        {listField.map((item, i) => (
          <InfoRow key={item.label} isFirst={i === 0} isLast={i === listField.length - 1}>
            <InfoRowLabel>
              <Trans>{item.label}</Trans>
            </InfoRowLabel>
            <InfoRowValue>{loading ? <Loader /> : item.value}</InfoRowValue>
          </InfoRow>
        ))}
      </Flex>
    </BlockWrapper>
  )
}

export default SingleTokenInfo
