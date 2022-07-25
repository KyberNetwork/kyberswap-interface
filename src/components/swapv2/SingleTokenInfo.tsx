import React, { useEffect, useState, useRef } from 'react'
import styled, { css } from 'styled-components'
import { Trans } from '@lingui/macro'
import { Flex } from 'rebass'
import Loader from 'components/Loader'
import { formattedNum } from 'utils'
import { formatDollarAmount } from 'utils/numbers'
import { isMobile, isIOS, isSafari } from 'react-device-detect'
import { TokenInfo } from 'hooks/useTokenInfo'
import { Currency } from '@kyberswap/ks-sdk-core'
import { useIsDarkMode } from 'state/user/hooks'

const NOT_AVAIALBLE = '--'

const Wrapper = styled.div`
  width: 100%;
  padding: 0px;
  margin-top: 0px;
  margin-bottom: 0px;
  border: none;
`

const InfoRow = styled.div`
  width: 33%;
  padding: 7px 0px 7px 0px;
  :nth-child(2) {
    text-align: center;
  }
  :last-child {
    text-align: right;
  }
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
`

const LINE_HEIGHT = 24
const HEIGHT = 280
const DescText = styled(InfoRowLabel)<{ showLimitLine: boolean }>`
  line-height: ${LINE_HEIGHT}px;
  ${({ showLimitLine }) =>
    showLimitLine
      ? css`
          margin: 10px 0px;
          overflow: hidden;
          height: ${HEIGHT}px;
        `
      : css`
          margin: 10px 0px 0px 0px;
          height: unset;
        `}
`
const hex2rgba = (hex: string, alpha = 1) => {
  const match = hex.match(/\w\w/g) || []
  const [r, g, b] = match.map(x => parseInt(x, 16))
  return `rgba(${r},${g},${b},${alpha})`
}

function transparent(isDarkMode: boolean, color: string) {
  // https://stackoverflow.com/questions/38391457/linear-gradient-to-transparent-bug-in-latest-safari
  const value = isDarkMode ? 0 : 255
  return isIOS || isSafari ? `rgba(${value}, ${value}, ${value}, 0)` : `${hex2rgba(color, 0)}`
}

const SeeMore = styled.a<{ isSeeMore: boolean; isDarkMode: boolean }>`
  cursor: pointer;
  margin: 0px 0px 15px 0px;
  display: block;
  text-align: right;
  position: relative;
  &::before {
    content: '';
    position: absolute;
    left: 0px;
    bottom: 20px;
    width: 100%;
    height: 8em;
    background: ${({ theme, isSeeMore, isDarkMode }) =>
      isSeeMore
        ? `linear-gradient(180deg, ${transparent(isDarkMode, theme.background)}, ${theme.background})`
        : 'transparent'};
  }
  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin: 10px 0px;
  `}
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

enum SeeStatus {
  NOT_SHOW,
  SEE_MORE,
  SEE_LESS,
}

/**
 * Tether (USDT) => Tether
 * @param text
 * @returns
 */
export function formatString(text: string | undefined) {
  return text ? text.replace(/\s\(.*\)/i, '') : ''
}

export function HowToSwap({
  fromCurrency,
  toCurrency,
  fromCurrencyInfo,
  toCurrencyInfo,
}: {
  fromCurrency: Currency | undefined
  toCurrency: Currency | undefined
  fromCurrencyInfo: TokenInfo
  toCurrencyInfo: TokenInfo
}) {
  if (!fromCurrency || !toCurrency || !fromCurrencyInfo || !toCurrencyInfo) return null
  const symbol1 = fromCurrency.symbol
  const symbol2 = toCurrency.symbol
  const name1 = fromCurrency.name
  const name2 = toCurrency.name

  const fromName = formatString(fromCurrencyInfo.name || name1)
  const toName = formatString(toCurrencyInfo.name || name2)

  return (
    <Wrapper>
      <DescText showLimitLine={false}>
        <p style={{ marginBottom: 0 }}>
          {fromName} ({symbol1}) can be exchanged to {toName} ({symbol1} to {symbol2}) on KyberSwap, a cryptocurrency
          decentralized exchange. By using KyberSwap, users can trade {symbol1} to {symbol2} on networks at the best
          rates, and earn more with your {symbol1} token without needing to check rates across multiple platforms.
        </p>
      </DescText>
    </Wrapper>
  )
}

const SingleTokenInfo = ({ data: tokenInfo, loading }: { data: TokenInfo; loading: boolean }) => {
  const isDarkMode = useIsDarkMode()
  const description = replaceHtml(tokenInfo?.description?.en)
  const [seeMoreStatus, setShowMoreDesc] = useState(SeeStatus.NOT_SHOW)

  const ref = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const descTag = ref.current
    if (descTag && description) {
      const contentHeight = descTag.getBoundingClientRect().height
      setShowMoreDesc(contentHeight < HEIGHT ? SeeStatus.NOT_SHOW : SeeStatus.SEE_MORE)
    }
  }, [description])

  const isSeeMore = seeMoreStatus === SeeStatus.SEE_MORE

  const toggleSeeMore = () => setShowMoreDesc(isSeeMore ? SeeStatus.SEE_LESS : SeeStatus.SEE_MORE)

  const listField = [
    { label: 'Price', value: tokenInfo.price ? formattedNum(tokenInfo.price.toString(), true) : NOT_AVAIALBLE },
    {
      label: 'Market Cap Rank',
      value: tokenInfo.marketCapRank ? `#${formattedNum(tokenInfo.marketCapRank.toString())}` : NOT_AVAIALBLE,
    },
    {
      label: '24H Volume',
      value: !tokenInfo.tradingVolume
        ? NOT_AVAIALBLE
        : isMobile
        ? formatDollarAmount(tokenInfo.tradingVolume, 2).toUpperCase()
        : formattedNum(tokenInfo.tradingVolume.toString(), true),
    },
  ]
  return (
    <Wrapper>
      <DescText showLimitLine={isSeeMore}>
        <div
          ref={ref}
          dangerouslySetInnerHTML={{
            __html: description.replaceAll('\r\n\r\n', '<br><br>'),
          }}
        ></div>
      </DescText>
      {seeMoreStatus !== SeeStatus.NOT_SHOW && (
        <SeeMore onClick={toggleSeeMore} isSeeMore={isSeeMore} isDarkMode={isDarkMode}>
          {isSeeMore ? <Trans>See more</Trans> : <Trans>See less</Trans>}
        </SeeMore>
      )}

      <Flex justifyContent="space-between">
        {listField.map(item => (
          <InfoRow key={item.label}>
            <InfoRowLabel>
              <Trans>{item.label}</Trans>
            </InfoRowLabel>
            <InfoRowValue>{loading ? <Loader /> : item.value}</InfoRowValue>
          </InfoRow>
        ))}
      </Flex>
    </Wrapper>
  )
}

export default SingleTokenInfo
