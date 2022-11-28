import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useState } from 'react'
import { ChevronLeft, Share2, Sliders, Star } from 'react-feather'
import { useHistory } from 'react-router-dom'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonGray, ButtonLight } from 'components/Button'
import { Ethereum } from 'components/Icons'
import Icon from 'components/Icons/Icon'
import Row, { RowBetween, RowFit } from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'

import KyberScoreMeter from './KyberScoreMeter'
import OnChainAnalysis from './OnChainAnalysis'
import PriceRange from './PriceRange'

const Wrapper = styled.div`
  display: flex;
  align-items: stretch;
  justify-content: center;
  flex-direction: column;
  width: 100%;
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

  ${({ theme, gap }) => css`
    background-color: ${theme.background};
    gap: ${gap || '0px'};
  `}
`

enum DiscoverTokenTab {
  OnChainAnalysis = 'On-Chain Analysis',
  TechnicalAnalysis = 'Technical Analysis',
  SocialSentiment = 'Social Sentiment',
  News = 'News',
}

const TabButton = styled.div<{ active?: boolean }>`
  cursor: pointer;
  font-size: 20px;
  line-height: 24px;
  ${({ active, theme }) => active && `color: ${theme.primary};`}
  :hover {
    filter: brightness(0.8);
  }
`

export default function SingleToken() {
  const theme = useTheme()
  const history = useHistory()
  const [currentTab, setCurrentTab] = useState<DiscoverTokenTab>(DiscoverTokenTab.OnChainAnalysis)

  return (
    <Wrapper>
      <RowBetween marginBottom="24px">
        <RowFit gap="8px">
          <ButtonIcon onClick={() => history.push('/discover')}>
            <ChevronLeft size={24} />
          </ButtonIcon>
          <Star size={20} />
          <Text fontSize={24} color={theme.text} fontWeight={500}>
            Bitcoin (BTC)
          </Text>
          <Ethereum size={20} />
        </RowFit>
        <RowFit gap="8px">
          <ButtonGray
            color={theme.subText}
            gap="4px"
            width="36px"
            height="36px"
            padding="6px"
            style={{ filter: 'drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.16))' }}
          >
            <Sliders size={16} fill="currentcolor" style={{ transform: 'rotate(-90deg)' }} />
          </ButtonGray>
          <ButtonGray
            color={theme.subText}
            gap="4px"
            width="36px"
            height="36px"
            padding="6px"
            style={{ filter: 'drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.16))' }}
          >
            <Share2 size={16} fill="currentcolor" />
          </ButtonGray>
          <ButtonLight height="36px" width="120px" gap="4px">
            <Icon id="swap" size={16} />
            Swap BTC
          </ButtonLight>
        </RowFit>
      </RowBetween>
      <Text fontSize={12} color={theme.subText} marginBottom="12px">
        Bitcoin is a decentralized cryptocurrency originally described in a 2008 whitepaper by a person, or group of
        people, using the alias Satoshi Nakamoto. It was launched in January 2009.
      </Text>
      <Row gap="8px" marginBottom="24px">
        <Tag>PoS</Tag>
        <Tag>Smart Contracts</Tag>
        <Tag>Ethereum Ecosystem</Tag>
        <Tag>Coinbase Ventures Portfolio</Tag>
        <Tag active>View All</Tag>
      </Row>
      <Row align="stretch" gap="24px" marginBottom="38px">
        <CardWrapper style={{ justifyContent: 'space-between' }}>
          <Text color={theme.text} fontSize="14px" lineHeight="20px" marginBottom="24px">
            <Trans>Price</Trans>
          </Text>
          <RowFit gap="8px">
            <Text fontSize={28} lineHeight="32px" color={theme.text}>
              $22,841.05
            </Text>
            <Text
              color={theme.red}
              fontSize="12px"
              backgroundColor={rgba(theme.red, 0.2)}
              display="inline"
              padding="4px 8px"
              style={{ borderRadius: '16px' }}
            >
              23.32%
            </Text>
          </RowFit>
          <Text color={theme.red} fontSize={12} lineHeight="16px">
            -$414.03
          </Text>
          <PriceRange title={t`Daily Range`} high={23464.79} low={22778.66} current={23078.66} />
          <PriceRange title={t`1Y Range`} high={63000} low={17592.88} current={23078.66} />
        </CardWrapper>
        <CardWrapper style={{ fontSize: '12px' }} gap="10px">
          <Text color={theme.text} marginBottom="4px">
            Key Stats
          </Text>
          <RowBetween>
            <Text color={theme.subText}>
              <Trans>All Time Low</Trans>
            </Text>
            <Text color={theme.text}>$65.53</Text>
          </RowBetween>
          <RowBetween>
            <Text color={theme.subText}>
              <Trans>All Time High</Trans>
            </Text>
            <Text color={theme.text}>$68,789.63</Text>
          </RowBetween>
          <RowBetween>
            <Text color={theme.subText}>
              <Trans>24H Volume</Trans>
            </Text>
            <Text color={theme.text}>$27,520,056,639</Text>
          </RowBetween>
          <RowBetween>
            <Text color={theme.subText}>
              <Trans>Circulating Supply</Trans>
            </Text>
            <Text color={theme.text}>19,119,125.00 BTC</Text>
          </RowBetween>
          <RowBetween>
            <Text color={theme.subText}>
              <Trans>Market Cap</Trans>
            </Text>
            <Text color={theme.text}>$436,224,824,038</Text>
          </RowBetween>
          <RowBetween>
            <Text color={theme.subText}>
              <Trans>Holders (On-chain)</Trans>
            </Text>
            <Text color={theme.text}>23,321</Text>
          </RowBetween>
          <RowBetween>
            <Text color={theme.subText}>
              <Trans>Website</Trans>
            </Text>
            <Text color={theme.text}>kyber.network</Text>
          </RowBetween>
          <RowBetween>
            <Text color={theme.subText}>
              <Trans>Community</Trans>
            </Text>
            <Text color={theme.primary}>Telegram ↗</Text>
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
          <KyberScoreMeter value={78} />
          <Text fontSize={24} fontWeight={500} color={theme.primary} marginBottom="12px">
            Strong Buy
          </Text>
          <Text fontSize={14} lineHeight="20px" fontWeight={500} color={theme.text} textAlign="center">
            $BTC seems to be a <span style={{ color: theme.primary }}>Strong Buy</span> with a KyberScore of{' '}
            <span style={{ color: theme.primary }}>86</span>/100
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
      <OnChainAnalysis />
    </Wrapper>
  )
}
