import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Trans } from '@lingui/macro'
import { Flex } from 'rebass'
import Loader from 'components/Loader'
import CurrencyLogo from 'components/CurrencyLogo'
import { formattedNum } from 'utils'
import { useRef } from 'react'
import { formatDollarAmount } from 'utils/numbers'
import { isMobile } from 'react-device-detect'

const NOT_AVAIALBLE = '--'
const NUM_LINE_DESC = 5

const Wrapper = styled.div<{ first?: boolean }>`
  width: 100%;
  border-bottom: ${({ first, theme }) => (first ? `1px solid ${theme.border}` : 'none')};
  padding-left: 0px;
  padding-right: 0px;
  margin-bottom: ${({ first }) => (first ? `30px` : '0px')};
  padding-bottom: ${({ first }) => (first ? `30px` : '0px')};
  margin-top: 0px;
  ${({ theme, first }) => theme.mediaWidth.upToSmall`
    margin-bottom: ${first ? `10px` : '0px'};
    padding-bottom: ${first ? `10px` : '0px'};
    margin-top: 24px;
`}
`

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
`

const AboutText = styled.div`
  color: ${({ theme }) => theme.subText};
  font-size: 20px;
  font-weight: 500;
  margin-left: 10px;
  margin-bottom: 10px;
`

const LINE_HEIGHT = 24
const DescText = styled(InfoRowLabel)<{ showLimitLine: boolean }>`
  margin: 10px 0px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin: 10px 0px 0px 0px;
  `}
  p {
    line-height: ${LINE_HEIGHT}px;
    margin: 0;
    ${({ showLimitLine }) =>
      showLimitLine
        ? `
    text-overflow:ellipsis;
    overflow:hidden;
    display: -webkit-box !important;
    height: ${LINE_HEIGHT * NUM_LINE_DESC}px;
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
  text-align: right;
`

function removeAtag(text: string) {
  if (!text) return ''
  return text
    .replace(/<a[^>]*>/g, '')
    .replace(/<\/a>/g, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
}
const SeeStatus = {
  NOT_SHOW: 0,
  SEE_MORE: 1,
  SEE_LESS: 2,
}
const TokenInfo = ({
  data: tokenInfo,
  borderBottom,
  currency,
  loading,
}: {
  data: any
  currency?: any
  borderBottom?: boolean
  loading: boolean
}) => {
  const description = removeAtag(tokenInfo?.description?.en)
  const [seeMoreStatus, setShowMoreDesc] = useState(SeeStatus.NOT_SHOW)

  const ref = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const descTag = ref.current
    if (descTag && description) {
      const lineHeight = +getComputedStyle(descTag).lineHeight.replace('px', '')
      const lines = descTag.getBoundingClientRect().height / lineHeight
      setShowMoreDesc(lines < NUM_LINE_DESC ? SeeStatus.NOT_SHOW : SeeStatus.SEE_MORE)
    }
  }, [description])

  const isSeeMore = seeMoreStatus === SeeStatus.SEE_MORE

  const toggleSeeMore = () => setShowMoreDesc(isSeeMore ? SeeStatus.SEE_LESS : SeeStatus.SEE_MORE)

  return (
    <Wrapper first={borderBottom}>
      <Flex>
        <CurrencyLogo currency={currency} size="24px" />
        <AboutText>About {currency?.symbol}</AboutText>
      </Flex>

      <DescText showLimitLine={isSeeMore}>
        <p
          ref={ref}
          dangerouslySetInnerHTML={{
            __html: isSeeMore ? description : description.replaceAll('\r\n\r\n', '<pre></pre>'),
          }}
        ></p>
        {seeMoreStatus !== SeeStatus.NOT_SHOW && (
          <SeeMore onClick={toggleSeeMore}>See {isSeeMore ? 'more' : 'less'}</SeeMore>
        )}
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
            ) : !tokenInfo.tradingVolume ? (
              NOT_AVAIALBLE
            ) : isMobile ? (
              formatDollarAmount(tokenInfo.tradingVolume, 2).toUpperCase()
            ) : (
              formattedNum(tokenInfo.tradingVolume.toString(), true)
            )}
          </InfoRowValue>
        </InfoRow>
      </Flex>
    </Wrapper>
  )
}

export default TokenInfo
