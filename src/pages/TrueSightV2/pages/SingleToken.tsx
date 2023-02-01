import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { ReactNode, useRef, useState } from 'react'
import { ChevronLeft, Share2, Star } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonGray, ButtonLight } from 'components/Button'
import Column from 'components/Column'
import { Ethereum } from 'components/Icons'
import Icon from 'components/Icons/Icon'
import { DotsLoader } from 'components/Loader/DotsLoader'
import Row, { RowBetween, RowFit } from 'components/Row'
import ShareModal from 'components/ShareModal'
import { MouseoverTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useToggleModal } from 'state/application/hooks'

import DisplaySettings from '../components/DisplaySettings'
import KyberScoreMeter from '../components/KyberScoreMeter'
import PriceRange from '../components/PriceRange'
import useTokenDetailsData from '../hooks/useTokenDetailsData'
import { DiscoverTokenTab } from '../types'
import News from './News'
import OnChainAnalysis from './OnChainAnalysis'
import TechnicalAnalysis from './TechnicalAnalysis'

const Wrapper = styled.div`
  display: flex;
  align-items: stretch;
  justify-content: center;
  flex-direction: column;
  width: 100%;
  max-width: 1500px;
  color: ${({ theme }) => theme.subText};
`

const ButtonIcon = styled.div`
  border-radius: 100%;
  cursor: pointer;
  :hover {
    filter: brightness(1.8);
  }
`

const Tag = styled.div<{ active?: boolean }>`
  border-radius: 24px;
  padding: 4px 8px;
  font-size: 12px;
  line-height: 16px;
  cursor: pointer;
  user-select: none;
  transition: all 0.1s ease;
  white-space: nowrap;

  ${({ theme, active }) =>
    active
      ? css`
          color: ${theme.primary};
          background-color: ${rgba(theme.primary, 0.3)};
        `
      : css`
          color: ${theme.subText};
          background-color: ${theme.background};
        `}

  :hover {
    filter: brightness(0.8);
  }
  :active {
    filter: brightness(1.1);
    transform: scale(1.01);
  }
`

const CardWrapper = styled.div<{ gap?: string }>`
  border-radius: 20px;
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid ${({ theme }) => theme.border};
  ${({ theme, gap }) => css`
    background-color: ${theme.background};
    gap: ${gap || '0px'};
  `}
`

const TabButton = styled.div<{ active?: boolean }>`
  cursor: pointer;
  font-size: 20px;
  line-height: 24px;
  ${({ active, theme }) => active && `color: ${theme.primary};`}
  :hover {
    filter: brightness(0.8);
  }
`

const formatMoneyWithSign = (amount: number): string => {
  const isNegative = amount < 0
  return (isNegative ? '-' : '') + '$' + Math.abs(amount).toLocaleString()
}

const ExternalLinkWrapper = styled.a`
  text-decoration: none;
  color: ${({ theme }) => theme.text};
  transition: color 0.2s ease;
  :hover {
    color: ${({ theme }) => theme.primary};
  }
`
const ExternalLink = ({ href, className, children }: { href: string; className?: string; children?: ReactNode }) => {
  return (
    <ExternalLinkWrapper className={className} href={href} target="_blank" rel="noreferrer">
      {children} ↗
    </ExternalLinkWrapper>
  )
}

export default function SingleToken() {
  const theme = useTheme()
  const navigate = useNavigate()
  const above768 = useMedia('(min-width:768px)')

  const [currentTab, setCurrentTab] = useState<DiscoverTokenTab>(DiscoverTokenTab.OnChainAnalysis)
  const { data, isLoading } = useTokenDetailsData('$TOKEN_ADDRESS')

  const shareUrl = useRef<string>()
  const toggleShareModal = useToggleModal(ApplicationModal.SHARE)

  const handleShareClick = (url?: string) => {
    shareUrl.current = url
    toggleShareModal()
  }

  const RenderHeader = () => {
    const TokenNameGroup = () => (
      <>
        <ButtonIcon onClick={() => navigate('/discover')}>
          <ChevronLeft size={24} />
        </ButtonIcon>
        <Star size={20} />
        {isLoading ? (
          <DotsLoader />
        ) : (
          <>
            <Text fontSize={24} color={theme.text} fontWeight={500}>
              {data?.name}
            </Text>
            <Ethereum size={20} />
          </>
        )}
      </>
    )

    const SettingButtons = () => (
      <>
        <DisplaySettings currentTab={currentTab} />
        <ButtonGray
          color={theme.subText}
          gap="4px"
          width="36px"
          height="36px"
          padding="6px"
          style={{ boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.16))' }}
          onClick={() => handleShareClick()}
        >
          <Share2 size={16} fill="currentcolor" />
        </ButtonGray>
      </>
    )

    return above768 ? (
      <RowBetween marginBottom="24px">
        <RowFit gap="8px">
          <TokenNameGroup />
        </RowFit>
        <RowFit gap="8px">
          <SettingButtons />
          <ButtonLight height="36px" width="120px" gap="4px">
            <Icon id="swap" size={16} />
            Swap BTC
          </ButtonLight>
        </RowFit>
      </RowBetween>
    ) : (
      <Column gap="24px">
        <Row gap="8px">
          <TokenNameGroup />
        </Row>
        <RowBetween>
          <RowFit gap="8px">
            <SettingButtons />
          </RowFit>
          <ButtonLight height="36px" width="120px" gap="4px">
            <Icon id="swap" size={16} />
            Swap BTC
          </ButtonLight>
        </RowBetween>
      </Column>
    )
  }
  return (
    <Wrapper>
      <RenderHeader />
      <Text fontSize={12} color={theme.subText} marginBottom="12px">
        {isLoading ? <DotsLoader /> : data?.desc}
      </Text>
      <Row gap="8px" marginBottom="24px">
        {data?.tags.map(tag => {
          return <Tag key="tag">{tag}</Tag>
        })}
        <Tag active>View All</Tag>
      </Row>
      <Row align="stretch" gap="24px" marginBottom="38px" flexDirection={above768 ? 'row' : 'column'}>
        <CardWrapper style={{ justifyContent: 'space-between' }}>
          <Text color={theme.text} fontSize="14px" lineHeight="20px" marginBottom="24px">
            <Trans>Price</Trans>
          </Text>
          <RowFit gap="8px">
            <Text fontSize={28} lineHeight="32px" color={theme.text}>
              {isLoading ? <DotsLoader /> : '$' + (+(data?.price || 0)).toLocaleString()}
            </Text>
            <Text
              color={theme.red}
              fontSize="12px"
              backgroundColor={rgba(theme.red, 0.2)}
              display="inline"
              padding="4px 8px"
              style={{ borderRadius: '16px' }}
            >
              {data ? data?.['24hChange'].toFixed(2) : 0}%
            </Text>
          </RowFit>
          <Text color={theme.red} fontSize={12} lineHeight="16px">
            {data && formatMoneyWithSign(data?.['24hChange'] * +data?.price || 0)}
          </Text>
          <PriceRange
            title={t`Daily Range`}
            high={data?.['24hHigh'] || 0}
            low={data?.['24hLow'] || 0}
            current={+(data?.price || 0)}
          />
          <PriceRange
            title={t`1Y Range`}
            high={data?.['1yHigh'] || 0}
            low={data?.['1yLow'] || 0}
            current={data?.price ? +data.price : 0}
          />
        </CardWrapper>
        <CardWrapper style={{ fontSize: '12px' }} gap="10px">
          <Text color={theme.text} marginBottom="4px">
            Key Stats
          </Text>
          <RowBetween>
            <Text color={theme.subText}>
              <Trans>All Time Low</Trans>
            </Text>
            <Text color={theme.text}>{data?.ATL && formatMoneyWithSign(data?.ATL)}</Text>
          </RowBetween>
          <RowBetween>
            <Text color={theme.subText}>
              <Trans>All Time High</Trans>
            </Text>
            <Text color={theme.text}>{data?.ATH && formatMoneyWithSign(data?.ATH)}</Text>
          </RowBetween>
          <RowBetween>
            <Text color={theme.subText}>
              <Trans>24H Volume</Trans>
            </Text>
            <Text color={theme.text}>{data?.['24hVolume'] && formatMoneyWithSign(data?.['24hVolume'])}</Text>
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
            <Text color={theme.text}>{data?.marketCap && formatMoneyWithSign(data?.marketCap)}</Text>
          </RowBetween>
          <RowBetween>
            <Text color={theme.subText}>
              <Trans>Holders (On-chain)</Trans>
            </Text>
            <Text color={theme.text}>{data?.holders}</Text>
          </RowBetween>
          <RowBetween>
            <Text color={theme.subText}>
              <Trans>Website</Trans>
            </Text>
            {data?.webs[0] && <ExternalLink href={data?.webs[0].value || ''}>{data?.webs[0].key}</ExternalLink>}
          </RowBetween>
          <RowBetween>
            <Text color={theme.subText}>
              <Trans>Community</Trans>
            </Text>
            {data?.communities[0] && (
              <ExternalLink href={data?.communities[0].value || ''}>{data?.communities[0].key}</ExternalLink>
            )}
          </RowBetween>
          <RowBetween>
            <Text color={theme.subText}>
              <Trans>Address</Trans>
            </Text>
            <Text color={theme.subText}>0x394...5e3</Text>
          </RowBetween>
        </CardWrapper>
        <CardWrapper style={{ alignItems: 'center' }}>
          <Row marginBottom="8px">
            <MouseoverTooltip
              text={t`KyberScore is an algorithm created by us that takes into account multiple on-chain and off-chain indicators to measure the current trend of a token. The score ranges from 0 to 100.`}
              placement="top"
              width="350px"
            >
              <Text style={{ borderBottom: `1px dotted ${theme.text}` }} color={theme.text}>
                KyberScore
              </Text>
            </MouseoverTooltip>
          </Row>
          <KyberScoreMeter value={data?.kyberScore.score} />
          <Text fontSize={24} fontWeight={500} color={theme.primary} marginBottom="12px">
            {data?.kyberScore.label}
          </Text>
          <Text fontSize={14} lineHeight="20px" fontWeight={500} color={theme.text} textAlign="center">
            $BTC seems to be a <span style={{ color: theme.primary }}>{data?.kyberScore.label}</span> with a KyberScore
            of <span style={{ color: theme.primary }}>{data?.kyberScore.score}</span>/100
          </Text>
        </CardWrapper>
      </Row>
      <Row gap="28px">
        {Object.values(DiscoverTokenTab).map((tab: DiscoverTokenTab) => (
          <TabButton key={tab} active={tab === currentTab} onClick={() => setCurrentTab(tab)}>
            {tab}
          </TabButton>
        ))}
      </Row>
      {currentTab === DiscoverTokenTab.OnChainAnalysis && <OnChainAnalysis onShareClick={handleShareClick} />}
      {currentTab === DiscoverTokenTab.TechnicalAnalysis && <TechnicalAnalysis />}
      {currentTab === DiscoverTokenTab.News && <News />}
      <ShareModal title="Share with your friends" url={shareUrl.current} />
    </Wrapper>
  )
}
