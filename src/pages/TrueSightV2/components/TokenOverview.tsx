import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { rgba } from 'polished'
import { ReactNode, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import Column from 'components/Column'
import CopyHelper from 'components/Copy'
import DropdownIcon from 'components/Icons/DropdownIcon'
import Icon from 'components/Icons/Icon'
import { DotsLoader } from 'components/Loader/DotsLoader'
import Row, { RowBetween, RowFit } from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { MIXPANEL_TYPE, useMixpanelKyberAI } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'
import { getEtherscanLink, shortenAddress } from 'utils'

import { ShareButton } from '.'
import { MIXPANEL_KYBERAI_TAG, NETWORK_IMAGE_URL, NETWORK_TO_CHAINID } from '../constants'
import { IAssetOverview } from '../types'
import { calculateValueToColor, formatLocaleStringNum, formatTokenPrice } from '../utils'
import ChevronIcon from './ChevronIcon'
import KyberAIShareModal from './KyberAIShareModal'
import KyberScoreMeter from './KyberScoreMeter'
import PriceRange from './PriceRange'
import SimpleTooltip from './SimpleTooltip'
import KyberScoreChart from './chart/KyberScoreChart'
import KyberScoreShareContent from './shareContent/KyberScoreShareContent'

const CardWrapper = styled.div<{ gap?: string }>`
  --background-color: ${({ theme }) => (theme.darkMode ? theme.text + '22' : theme.subText + '20')};

  position: relative;
  overflow: hidden;
  border-radius: 20px;
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  background: linear-gradient(
    200deg,
    ${({ theme }) => (theme.darkMode ? rgba(24, 24, 24, 0.15) : rgba(224, 224, 224, 0.15))} -4%,
    var(--background-color) 100%
  );
  box-shadow: inset 0px 2px 2px rgba(255, 255, 255, 0.2), 0px 4px 8px var(--background-color);
  transition: all 0.5s ease;
  ::after {
    bottom: 0;
    left: 0;
    right: 0;
    content: ' ';
    display: block;
    position: absolute;
    width: 100%;
    height: 20%;
    background: var(--background-color);
    filter: blur(140px) brightness(1.5);
    z-index: 1;
  }

  &.bullish {
    --background-color: ${({ theme }) => (theme.darkMode ? theme.primary + '32' : theme.primary + '40')};
  }
  &.bearish {
    --background-color: ${({ theme }) => (theme.darkMode ? theme.red + '32' : theme.red + '60')};
  }

  ${({ theme, gap }) => css`
    background-color: ${theme.background};
    gap: ${gap || '0px'};
  `}
  > * {
    flex: 1;
    z-index: 2;
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 16px;
  `}
`

const ExpandableBox = styled.div<{ expanded?: boolean; height?: number }>`
  height: 0px;
  overflow: hidden;
  transition: all 0.2s ease;
  flex: unset;
  ${({ expanded, height }) => (expanded ? `height: ${height}px;` : ``)}
`

const StyledTokenAddress = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
  cursor: pointer;
  :hover {
    color: ${({ theme }) => theme.primary};
  }
`

const getCommunityLabelFromURL = (url: string) => {
  if (url.includes('facebook')) {
    return 'Facebook'
  }
  if (url.includes('twitter')) {
    return 'Twitter'
  }
  if (url.includes('discord')) {
    return 'Discord'
  }
  if (url.includes('t.me')) {
    return 'Telegram'
  }
  if (url.includes('medium')) {
    return 'Medium'
  }
  if (url.includes('instagram')) {
    return 'Instagram'
  }

  return url.split('://')[1]
}

const ExternalLinkWrapper = styled.a`
  text-decoration: none;
  color: ${({ theme }) => theme.text};
  transition: all 0.2s ease;
  background-color: ${({ theme }) => theme.background + '80'};
  padding: 4px 6px;
  border-radius: 4px;
  :hover {
    color: ${({ theme }) => theme.primary};
    background-color: ${({ theme }) => theme.tableHeader + '80'};
  }
`
const ExternalLink = ({ href, className, children }: { href: string; className?: string; children?: ReactNode }) => {
  return (
    <ExternalLinkWrapper className={className} href={href} target="_blank" rel="noreferrer">
      {children}
    </ExternalLinkWrapper>
  )
}

export const TokenOverview = ({ data, isLoading }: { data?: IAssetOverview; isLoading?: boolean }) => {
  const theme = useTheme()
  const { chain } = useParams()
  const mixpanelHandler = useMixpanelKyberAI()
  const above768 = useMedia(`(min-width:${MEDIA_WIDTHS.upToSmall}px)`)
  const [expanded, setExpanded] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const ref1 = useRef<HTMLDivElement>(null)
  const ref2 = useRef<HTMLDivElement>(null)

  const latestKyberscore = useMemo(() => {
    if (!data?.kyberScore?.ks3d) return undefined
    return data?.kyberScore.ks3d[data?.kyberScore.ks3d.length - 1]
  }, [data])

  const cardClassname = useMemo(() => {
    if (!data?.kyberScore || data?.kyberScore.score === 0) return ''
    if (data?.kyberScore.score >= 60) return 'bullish'
    if (data?.kyberScore.score < 40) return 'bearish'
    return ''
  }, [data])
  const priceChangeColor = data && data.price24hChangePercent > 0 ? theme.primary : theme.red
  return (
    <>
      {above768 ? (
        <>
          <Row align="stretch" gap="24px" flexDirection={above768 ? 'row' : 'column'} marginBottom="12px">
            <CardWrapper className={cardClassname}>
              <Column flex={0}>
                <Text color={theme.text} fontSize="14px" lineHeight="20px" marginBottom="12px" fontWeight={500}>
                  <Trans>Price</Trans>
                </Text>
                <RowFit gap="8px">
                  <Text fontSize={28} lineHeight="32px" color={theme.text}>
                    {isLoading ? <DotsLoader /> : '$' + formatTokenPrice(data?.price || 0)}
                  </Text>
                  <Text
                    color={data && data.price24hChangePercent > 0 ? theme.primary : theme.red}
                    fontSize="12px"
                    backgroundColor={rgba(data && data.price24hChangePercent > 0 ? theme.primary : theme.red, 0.2)}
                    display="inline"
                    padding="4px 8px"
                    style={{ borderRadius: '16px' }}
                  >
                    <RowFit gap="2px">
                      <ChevronIcon
                        rotate={data && data.price24hChangePercent > 0 ? '180deg' : '0deg'}
                        color={priceChangeColor}
                      />
                      {data?.price24hChangePercent ? Math.abs(data.price24hChangePercent).toFixed(2) : 0}%
                    </RowFit>
                  </Text>
                </RowFit>
                <Row color={priceChangeColor} fontSize={12} lineHeight="16px">
                  <ChevronIcon
                    rotate={data && data.price24hChangePercent > 0 ? '180deg' : '0deg'}
                    color={priceChangeColor}
                  />
                  {data && '$' + formatTokenPrice(Math.abs(data.price24hChangePercent * data.price) / 100, 2)}
                </Row>
              </Column>
              <Column justifyContent="center">
                <PriceRange
                  title={t`Daily Range`}
                  high={data?.['24hHigh'] || 0}
                  low={data?.['24hLow'] || 0}
                  current={+(data?.price || 0)}
                  style={{ flex: 'initial' }}
                  color={calculateValueToColor(data?.kyberScore?.score || 0, theme)}
                />
                <PriceRange
                  title={t`1Y Range`}
                  high={data?.['1yHigh'] || 0}
                  low={data?.['1yLow'] || 0}
                  current={data?.price ? +data.price : 0}
                  style={{ flex: 'initial' }}
                  color={calculateValueToColor(data?.kyberScore?.score || 0, theme)}
                />
              </Column>
              {/*  <Column gap="6px" style={{ justifyContent: 'end' }}>
                <Text fontSize="12px">
                  <Trans>Performance</Trans>
                </Text>
                <Row gap="8px">
                  <PerformanceCard color={theme.red}>
                    <Text fontSize="12px">-8.36%</Text>
                    <Text color={theme.text} fontSize="10px">
                      1W
                    </Text>
                  </PerformanceCard>
                  <PerformanceCard color={theme.primary}>
                    <Text color={theme.primary} fontSize="12px">
                      18.33%
                    </Text>
                    <Text color={theme.text} fontSize="10px">
                      1M
                    </Text>
                  </PerformanceCard>
                  <PerformanceCard color={theme.primary}>
                    <Text color={theme.primary} fontSize="12px">
                      142.55%
                    </Text>
                    <Text color={theme.text} fontSize="10px">
                      3M
                    </Text>
                  </PerformanceCard>
                  <PerformanceCard color={theme.primary}>
                    <Text color={theme.primary} fontSize="12px">
                      32.27%
                    </Text>
                    <Text color={theme.text} fontSize="10px">
                      6M
                    </Text>
                  </PerformanceCard>
                </Row> 
              </Column>*/}
            </CardWrapper>
            <CardWrapper style={{ alignItems: 'center', gap: '12px' }} className={cardClassname}>
              <RowBetween marginBottom="4px">
                <MouseoverTooltip
                  text={
                    <Trans>
                      KyberScore uses AI to measure the upcoming trend of a token (bullish or bearish) by taking into
                      account multiple on-chain and off-chain indicators. The score ranges from 0 to 100. Higher the
                      score, more bullish the token in the short-term. Read more{' '}
                      <a
                        href="https://docs.kyberswap.com/kyberswap-solutions/kyberai/kyberscore"
                        target="_blank"
                        rel="noreferrer"
                      >
                        here ↗
                      </a>
                    </Trans>
                  }
                  placement="top"
                  width="350px"
                >
                  <Text
                    style={{ borderBottom: `1px dotted ${theme.text}` }}
                    color={theme.text}
                    fontSize="14px"
                    lineHeight="20px"
                    fontWeight={500}
                  >
                    KyberScore
                  </Text>
                </MouseoverTooltip>
                <ShareButton onClick={() => setShowShare(true)} />
              </RowBetween>
              <KyberScoreMeter
                key={data ? data.symbol + data.address : undefined}
                value={data?.kyberScore?.score}
                style={{ width: '211px', height: '128px' }}
              />
              <RowFit gap="6px" marginBottom="12px">
                <Text
                  fontSize={24}
                  fontWeight={500}
                  color={isLoading ? theme.subText : calculateValueToColor(data?.kyberScore?.score || 0, theme)}
                >
                  {isLoading
                    ? t`Loading`
                    : data?.kyberScore === undefined || data?.kyberScore?.score === 0
                    ? t`Not Applicable`
                    : data.kyberScore.label}
                </Text>
                <MouseoverTooltip
                  text={
                    latestKyberscore ? (
                      <>
                        <Column color={theme.subText} style={{ fontSize: '12px', lineHeight: '16px' }}>
                          <Text>
                            Calculated at {dayjs(latestKyberscore.created_at * 1000).format('DD/MM/YYYY HH:mm A')}
                          </Text>
                          <Text>
                            KyberScore:{' '}
                            <span style={{ color: calculateValueToColor(latestKyberscore.kyber_score || 0, theme) }}>
                              {latestKyberscore.kyber_score || '--'} ({latestKyberscore.tag || t`Not Applicable`})
                            </span>
                          </Text>
                          <Text>
                            Token Price:{' '}
                            <span style={{ color: theme.text }}>{formatTokenPrice(latestKyberscore.price || 0)}</span>
                          </Text>
                        </Column>
                      </>
                    ) : (
                      <>
                        <Text fontSize="12px" fontStyle="italic">
                          <Trans>KyberScore is not applicable for stablecoins</Trans>
                        </Text>
                      </>
                    )
                  }
                  disableTooltip={data?.symbol === 'KNC'}
                  placement="top"
                >
                  <Icon id="timer" size={16} />
                </MouseoverTooltip>
              </RowFit>
              <Column style={{ width: '100%' }} gap="2px">
                <Text fontSize="12px" lineHeight="16px">
                  <Trans>Last 3D KyberScores</Trans>
                </Text>
                <KyberScoreChart width="100%" height="36px" data={data?.kyberScore?.ks3d} index={1} />
              </Column>
            </CardWrapper>
            <CardWrapper style={{ fontSize: '12px' }} gap="10px" className={cardClassname}>
              <Text color={theme.text} marginBottom="4px" fontSize="14px" lineHeight="20px" fontWeight={500}>
                Key Stats
              </Text>
              <RowBetween>
                <Text color={theme.subText}>
                  <Trans>All Time Low</Trans>
                </Text>
                <Text color={theme.text} fontWeight={500}>
                  {data?.atl ? `$${formatTokenPrice(data?.atl, 4)}` : '--'}
                </Text>
              </RowBetween>
              <RowBetween>
                <Text color={theme.subText}>
                  <Trans>All Time High</Trans>
                </Text>
                <Text color={theme.text} fontWeight={500}>
                  {data?.ath ? `$${formatTokenPrice(data?.ath, 4)}` : '--'}
                </Text>
              </RowBetween>
              <RowBetween>
                <Text color={theme.subText}>
                  <Trans>24H Volume</Trans>
                </Text>
                <Text color={theme.text} fontWeight={500}>
                  {data?.['24hVolume'] ? `$${formatLocaleStringNum(data?.['24hVolume'], 0)}` : '--'}
                </Text>
              </RowBetween>
              <RowBetween>
                <Text color={theme.subText}>
                  <Trans>Circulating Supply</Trans>
                </Text>
                <Text color={theme.text} fontWeight={500}>
                  {data?.circulatingSupply
                    ? `${formatLocaleStringNum(data.circulatingSupply, 0)} ${data.symbol}`
                    : '--'}
                </Text>
              </RowBetween>
              <RowBetween>
                <Text color={theme.subText}>
                  <Trans>Market Cap</Trans>
                </Text>
                <Text color={theme.text} fontWeight={500}>
                  {data?.marketCap ? `$${formatLocaleStringNum(data?.marketCap)}` : '--'}
                </Text>
              </RowBetween>
              <RowBetween>
                <Text color={theme.subText}>
                  <Trans>Holders (On-chain)</Trans>
                </Text>
                <Text color={theme.text} fontWeight={500}>
                  {data?.numberOfHolders || '--'}
                </Text>
              </RowBetween>
              <RowBetween>
                <Text color={theme.subText}>
                  <Trans>Website</Trans>
                </Text>
                {data?.webs?.[0] && <ExternalLink href={data.webs[0] || ''}>{data?.webs[0]}</ExternalLink>}
              </RowBetween>
              <RowBetween align="flex-start">
                <Text color={theme.subText} lineHeight="24px">
                  <Trans>Community</Trans>
                </Text>
                <Row gap="6px" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {data?.communities?.map((c, index) => {
                    return (
                      <ExternalLink key={index} href={c}>
                        {getCommunityLabelFromURL(c)}
                      </ExternalLink>
                    )
                  })}
                </Row>
              </RowBetween>
              <RowBetween>
                <Text color={theme.subText}>
                  <Trans>Address</Trans>
                </Text>
                {data && chain ? (
                  <RowFit gap="4px">
                    <SimpleTooltip text={t`Open scan explorer`}>
                      <a
                        style={{
                          borderRadius: '50%',
                          cursor: 'pointer',
                        }}
                        target="_blank"
                        rel="noopener noreferrer"
                        href={getEtherscanLink(NETWORK_TO_CHAINID[chain], data.address, 'token')}
                      >
                        <RowFit gap="4px">
                          <img
                            src={NETWORK_IMAGE_URL[chain || 'ethereum']}
                            alt="eth"
                            width="16px"
                            height="16px"
                            style={{ display: 'block' }}
                          />
                          <StyledTokenAddress>{shortenAddress(1, data.address)}</StyledTokenAddress>
                        </RowFit>
                      </a>
                    </SimpleTooltip>
                    <SimpleTooltip
                      text={
                        <Text style={{ whiteSpace: 'nowrap' }}>
                          <Trans>Copy token address</Trans>
                        </Text>
                      }
                    >
                      <CopyHelper toCopy={data?.address || ''} />
                    </SimpleTooltip>
                  </RowFit>
                ) : (
                  <></>
                )}
              </RowBetween>
            </CardWrapper>
          </Row>
          <Row justify="center" marginBottom="38px">
            <Text fontSize="12px" lineHeight="16px" fontStyle="italic">
              <Trans>Disclaimer: This should not be considered as financial advice</Trans>
            </Text>
          </Row>
        </>
      ) : (
        <CardWrapper style={{ marginBottom: '24px' }} className={cardClassname}>
          <RowFit gap="8px">
            <Text fontSize={28} lineHeight="32px" fontWeight={500} color={theme.text}>
              {isLoading ? <DotsLoader /> : '$' + formatTokenPrice(+(data?.price || 0))}
            </Text>
            <Text
              color={theme.red}
              fontSize="12px"
              backgroundColor={rgba(data && data.price24hChangePercent > 0 ? theme.primary : theme.red, 0.2)}
              display="inline"
              padding="4px 8px"
              style={{ borderRadius: '16px' }}
            >
              {data?.price24hChangePercent ? data?.price24hChangePercent.toFixed(2) : 0}%
            </Text>
          </RowFit>
          <ExpandableBox expanded={expanded} height={ref1?.current?.scrollHeight} ref={ref1}>
            <PriceRange
              title={t`Daily Range`}
              high={data?.['24hHigh'] || 0}
              low={data?.['24hLow'] || 0}
              current={+(data?.price || 0)}
              style={{ marginBottom: '16px' }}
              color={calculateValueToColor(data?.kyberScore?.score || 0, theme)}
            />
            <PriceRange
              title={t`1Y Range`}
              high={data?.['1yHigh'] || 0}
              low={data?.['1yLow'] || 0}
              current={data?.price ? +data.price : 0}
              color={calculateValueToColor(data?.kyberScore?.score || 0, theme)}
            />
          </ExpandableBox>
          <Row style={{ borderBottom: `1px solid ${theme.border}`, margin: '16px 0' }} />
          <RowBetween marginBottom="8px">
            <MouseoverTooltip
              text={
                <Trans>
                  KyberScore uses AI to measure the upcoming trend of a token (bullish or bearish) by taking into
                  account multiple on-chain and off-chain indicators. The score ranges from 0 to 100. Higher the score,
                  more bullish the token in the short-term. Read more <a href="https://docs.kyberswap.com">here ↗</a>
                </Trans>
              }
              placement="top"
              width="350px"
            >
              <Text
                fontSize="14px"
                fontWeight={500}
                style={{ borderBottom: `1px dotted ${theme.text}` }}
                color={theme.text}
              >
                KyberScore
              </Text>
            </MouseoverTooltip>
            <ShareButton onClick={() => setShowShare(true)} />
          </RowBetween>
          <Row justify="center" marginBottom="12px">
            <KyberScoreMeter value={latestKyberscore?.kyber_score} />
          </Row>

          <Row marginBottom="16px" justify="center" gap="6px">
            <Text
              fontSize="24px"
              lineHeight="28px"
              fontWeight={500}
              color={isLoading ? theme.subText : calculateValueToColor(data?.kyberScore?.score || 0, theme)}
            >
              {isLoading
                ? t`Loading`
                : data?.kyberScore === undefined || data?.kyberScore?.score === 0
                ? t`Not Applicable`
                : data.kyberScore.label}
            </Text>
            <MouseoverTooltip
              text={
                <>
                  <Column color={theme.subText} style={{ fontSize: '12px', lineHeight: '16px' }}>
                    <Text>
                      {latestKyberscore && dayjs(latestKyberscore?.created_at * 1000).format('DD/MM/YYYY HH:mm A')}
                    </Text>
                    <Text>
                      KyberScore:{' '}
                      <span style={{ color: calculateValueToColor(latestKyberscore?.kyber_score || 0, theme) }}>
                        {latestKyberscore?.kyber_score || '--'} ({latestKyberscore?.tag || t`Not Applicable`})
                      </span>
                    </Text>
                    <Text>
                      Token Price:{' '}
                      <span style={{ color: theme.text }}>{formatTokenPrice(latestKyberscore?.price || 0)}</span>
                    </Text>
                  </Column>
                </>
              }
              placement="top"
            >
              <Icon id="timer" size={16} />
            </MouseoverTooltip>
          </Row>
          <Column style={{ width: '100%' }} gap="2px">
            <Text fontSize="12px" lineHeight="16px">
              <Trans>Last 3D KyberScores</Trans>
            </Text>
            <KyberScoreChart width="100%" height="32px" data={data?.kyberScore?.ks3d} index={1} />
          </Column>
          <ExpandableBox expanded={expanded} height={ref2?.current?.scrollHeight} ref={ref2}>
            <Row style={{ borderBottom: `1px solid ${theme.border}`, margin: '16px 0' }} />
            <Column gap="10px" style={{ fontSize: '12px', lineHeight: '16px' }}>
              <Text fontSize="14px" lineHeight="20px" color={theme.text} marginBottom="4px">
                Key Stats
              </Text>
              <RowBetween>
                <Text color={theme.subText}>
                  <Trans>All Time Low</Trans>
                </Text>
                <Text color={theme.text}>{data?.atl ? `$${formatTokenPrice(data?.atl)}` : '--'}</Text>
              </RowBetween>
              <RowBetween>
                <Text color={theme.subText}>
                  <Trans>All Time High</Trans>
                </Text>
                <Text color={theme.text}>{data?.ath ? `$${formatTokenPrice(data?.ath)}` : '--'}</Text>
              </RowBetween>
              <RowBetween>
                <Text color={theme.subText}>
                  <Trans>24H Volume</Trans>
                </Text>
                <Text color={theme.text}>
                  {data?.['24hVolume'] ? `$${formatLocaleStringNum(data?.['24hVolume'])}` : '--'}
                </Text>
              </RowBetween>
              <RowBetween>
                <Text color={theme.subText}>
                  <Trans>Circulating Supply</Trans>
                </Text>
                <Text color={theme.text}>{data && data.circulatingSupply + ' ' + data.symbol}</Text>
              </RowBetween>
              <RowBetween>
                <Text color={theme.subText}>
                  <Trans>Market Cap</Trans>
                </Text>
                <Text color={theme.text}>{data?.marketCap ? `$${formatLocaleStringNum(data?.marketCap)}` : '--'}</Text>
              </RowBetween>
              <RowBetween>
                <Text color={theme.subText}>
                  <Trans>Holders (On-chain)</Trans>
                </Text>
                <Text color={theme.text}>{data?.numberOfHolders}</Text>
              </RowBetween>
              <RowBetween>
                <Text color={theme.subText}>
                  <Trans>Website</Trans>
                </Text>
                {data?.webs?.[0] && <ExternalLink href={data.webs[0] || ''}>{data?.webs[0]}</ExternalLink>}
              </RowBetween>
              <RowBetween>
                <Text color={theme.subText}>
                  <Trans>Community</Trans>
                </Text>
                <Row gap="6px" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {data?.communities?.map((c, index) => {
                    return (
                      <ExternalLink key={index} href={c}>
                        {getCommunityLabelFromURL(c)}
                      </ExternalLink>
                    )
                  })}
                </Row>
              </RowBetween>
              <RowBetween>
                <Text color={theme.subText}>
                  <Trans>Address</Trans>
                </Text>
                {data && chain ? (
                  <RowFit gap="4px">
                    <SimpleTooltip text={t`Open scan explorer`}>
                      <a
                        style={{
                          borderRadius: '50%',
                          cursor: 'pointer',
                        }}
                        target="_blank"
                        rel="noopener noreferrer"
                        href={getEtherscanLink(NETWORK_TO_CHAINID[chain], data.address, 'token')}
                      >
                        <img
                          src={NETWORK_IMAGE_URL[chain || 'ethereum']}
                          alt="eth"
                          width="16px"
                          height="16px"
                          style={{ display: 'block' }}
                        />
                      </a>
                    </SimpleTooltip>
                    <Text color={theme.subText} fontWeight={500}>
                      {shortenAddress(1, data.address)}
                    </Text>
                    <CopyHelper toCopy={data?.address || ''} />
                  </RowFit>
                ) : (
                  <></>
                )}
              </RowBetween>
            </Column>
          </ExpandableBox>

          <Row justify="center" onClick={() => setExpanded(p => !p)} marginTop="6px">
            <div style={{ transform: expanded ? 'rotate(180deg)' : '', transition: 'all 0.2s ease' }}>
              <DropdownIcon />
            </div>
            <Text fontSize="12px" lineHeight="16px" fontWeight={500}>
              {expanded ? <Trans>View Less Stats</Trans> : <Trans>View More Stats</Trans>}
            </Text>
          </Row>
        </CardWrapper>
      )}
      <KyberAIShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        content={mobileMode => <KyberScoreShareContent token={data} mobileMode={mobileMode} />}
        title="Kyberscore"
        onShareClick={social =>
          mixpanelHandler(MIXPANEL_TYPE.KYBERAI_SHARE_TOKEN_CLICK, {
            token_name: data?.symbol?.toUpperCase(),
            network: chain,
            source: MIXPANEL_KYBERAI_TAG.EXPLORE_SHARE_THIS_TOKEN,
            share_via: social,
          })
        }
      />
    </>
  )
}
