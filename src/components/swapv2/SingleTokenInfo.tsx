import React, { useEffect, useState } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { Trans } from '@lingui/macro'
import { Currency } from '@kyberswap/ks-sdk-core'
import { Box, Flex, Text } from 'rebass'
import Loader from 'components/Loader'
import CurrencyLogo from 'components/CurrencyLogo'
import useTokenInfo from 'hooks/useTokenInfo'
import { formattedNum, shortenAddress } from 'utils'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { formatLongNumber } from 'utils/formatBalance'
import { useRef } from 'react'

const NOT_AVAIALBLE = '--'
const NUM_LINE_DESC = 4

const Wrapper = styled.div<{ first?: boolean }>`
  width: 100%;
  border-bottom: ${({ first, theme }) => (first ? `1px solid ${theme.border}` : 'none')};
  padding-left: 0px;
  padding-right: 0px;
  margin-bottom: ${({ first }) => (first ? `30px` : '0px')};
  padding-bottom: ${({ first }) => (first ? `30px` : '0px')};
  @media only screen and (max-width: 768px) {
    margin-top: 24px;
    margin-bottom: ${({ first }) => (first ? `10px` : '0px')};
    padding-bottom: ${({ first }) => (first ? `10px` : '0px')};
  }
`

const InfoRow = styled.div<{ isFirst?: boolean; isLast?: boolean }>`
  padding: 7px 0px 7px ${({ isFirst }) => (isFirst ? '0px' : '40px')};
  border-left: ${({ theme, isFirst }) => (isFirst ? 'none' : `1px solid ${theme.border}`)};
  width: 33%;
  @media only screen and (max-width: 768px) {
    width: 100%;
    border-left: none;
    padding: 20px 0px;
    border-bottom: ${({ theme, isLast }) => (isLast ? 'none' : `1px solid ${theme.border}`)};
  }
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

const AboutText = styled.div`
  color: ${({ theme }) => theme.text};
  font-size: 20px;
  font-weight: 400;
  margin-left: 10px;
  margin-bottom: 10px;
`
const DescText = styled(InfoRowLabel)<{ showLimitLine: boolean }>`
  margin: 10px 0px;
  @media only screen and (max-width: 768px) {
    margin-bottom: 0px;
  }
  p {
    line-height: 24px;
    margin: 0;
    ${({ showLimitLine }) =>
      showLimitLine
        ? `
    text-overflow:ellipsis;
    overflow:hidden;
    display: -webkit-box !important;
    -webkit-line-clamp: ${NUM_LINE_DESC};
    -webkit-box-orient: vertical;
    white-space: normal;
  `
        : ''}
  }
`
const SeeMore = styled.a`
  cursor: pointer;
  margin-top: 5px;
  display: block;
`

function removeAtag(text: string) {
  if (!text) return ''
  return text.replace(/<a[^>]*>/g, '').replace(/<\/a>/g, '')
}

const TokenInfo = ({ currency, borderBottom }: { currency?: Currency; borderBottom?: boolean }) => {
  const inputNativeCurrency = useCurrencyConvertedToNative(currency)
  const inputToken = inputNativeCurrency?.wrapped
  const { data: tokenInfo, loading } = useTokenInfo(inputToken)

  const isEmptyData = !tokenInfo.price && !tokenInfo.description && !tokenInfo.tradingVolume && !tokenInfo.marketCapRank

  const description = removeAtag(tokenInfo?.description?.en)
  const [showMoreDesc, setShowMoreDesc] = useState(false)

  const ref = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const descTag = ref.current
    if (descTag) {
      const lineHeight = +getComputedStyle(descTag).lineHeight.replace('px', '')
      const lines = descTag.getBoundingClientRect().height / lineHeight
      setShowMoreDesc(lines >= NUM_LINE_DESC)
    }
  }, [description])

  if (!currency || isEmptyData) return null

  return (
    <Wrapper first={borderBottom}>
      <Flex>
        <CurrencyLogo currency={inputNativeCurrency} size="24px" />
        <AboutText>About {inputNativeCurrency?.symbol}</AboutText>
      </Flex>

      <DescText showLimitLine={showMoreDesc}>
        <p
          ref={ref}
          dangerouslySetInnerHTML={{
            __html: description,
          }}
        ></p>
        {showMoreDesc && <SeeMore onClick={() => setShowMoreDesc(!showMoreDesc)}>See more</SeeMore>}
      </DescText>

      <Flex flexWrap={'wrap'}>
        <InfoRow isFirst={true}>
          <InfoRowLabel>
            <Trans>Price</Trans>
          </InfoRowLabel>
          <InfoRowValue>
            {loading ? <Loader /> : tokenInfo.price ? formattedNum(tokenInfo.price.toString(), true) : NOT_AVAIALBLE}
          </InfoRowValue>
        </InfoRow>

        <InfoRow>
          <InfoRowLabel>
            <Trans>Market Cap Rank</Trans>
          </InfoRowLabel>

          <InfoRowValue>
            {loading ? (
              <Loader />
            ) : tokenInfo.marketCapRank ? (
              `#${formattedNum(tokenInfo.marketCapRank.toString())}`
            ) : (
              NOT_AVAIALBLE
            )}
          </InfoRowValue>
        </InfoRow>

        <InfoRow isLast={true}>
          <InfoRowLabel>
            <Trans>24H Volume</Trans>
          </InfoRowLabel>

          <InfoRowValue>
            {loading ? (
              <Loader />
            ) : tokenInfo.tradingVolume ? (
              formatLongNumber(tokenInfo.tradingVolume.toString(), true)
            ) : (
              NOT_AVAIALBLE
            )}
          </InfoRowValue>
        </InfoRow>
      </Flex>
    </Wrapper>
  )
}

export default TokenInfo
