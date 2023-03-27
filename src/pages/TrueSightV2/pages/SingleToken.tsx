import { rgba } from 'polished'
import { useRef, useState } from 'react'
import { ChevronLeft, Share2, Star } from 'react-feather'
import { useNavigate, useParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonGray, ButtonPrimary } from 'components/Button'
import Icon from 'components/Icons/Icon'
import { DotsLoader } from 'components/Loader/DotsLoader'
import Logo from 'components/Logo'
import Row, { RowBetween, RowFit } from 'components/Row'
import ShareModal from 'components/ShareModal'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useToggleModal } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'

import DisplaySettings from '../components/DisplaySettings'
import { TokenOverview } from '../components/TokenOverview'
import TutorialModal from '../components/TutorialModal'
import { TOKEN_DETAIL } from '../hooks/sampleData'
import { useTokenDetailQuery } from '../hooks/useTruesightV2Data'
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
const HeaderButton = styled(ButtonGray)`
  width: 36px;
  height: 36px;
  padding: 8px;
  border-radius: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: ${({ theme }) => theme.buttonGray};
  color: ${({ theme }) => theme.subText};
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.16);
  :hover {
    filter: brightness(0.9);
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

const TagWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  overflow-x: scroll;
`

const TabButton = styled.div<{ active?: boolean }>`
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  line-height: 20px;
  border: 2px solid ${({ theme }) => theme.subText};
  padding: 8px 12px;
  border-radius: 36px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.1s ease;
  ${({ active, theme }) =>
    active &&
    css`
      color: ${theme.primary};
      background-color: ${theme.primary30};
      border-color: ${theme.primary30};
    `}
  :hover {
    filter: brightness(0.8);
  }

  ${({ theme, active }) => theme.mediaWidth.upToSmall`
    font-size:14px;
    line-height:20px;
    border-radius: 20px;
    padding: 8px 12px;
    display: flex;
    justify-content: center;
    align-items: center;
    white-space: nowrap;
    ${
      active
        ? css`
            background-color: ${theme.primary + '30'};
          `
        : css`
            border: 1px solid ${theme.border};
          `
    }
  `}
`

export const testParams = {
  address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
  from: 1674610765,
  to: 1675215565,
}

const StyledTokenDescription = styled.div<{ show?: boolean }>`
  text-overflow: ellipsis;
  overflow: hidden;
  font-size: 12px;
  line-height: 16px;
  &,
  & * {
    white-space: ${({ show }) => (show ? 'initial' : 'nowrap')};
  }
`

const TokenDescription = ({ description }: { description: string }) => {
  const theme = useTheme()
  const [show, setShow] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isTextExceeded = ref.current && ref.current?.clientWidth < ref.current?.scrollWidth
  return (
    <Row>
      <StyledTokenDescription
        ref={ref}
        show={show}
        dangerouslySetInnerHTML={{ __html: description || '' }}
      ></StyledTokenDescription>
      {!show && isTextExceeded && (
        <Text
          fontSize="12px"
          color={theme.primary}
          width="fit-content"
          style={{ cursor: 'pointer', flexBasis: 'fit-content', whiteSpace: 'nowrap' }}
          onClick={() => setShow(true)}
        >
          Read more
        </Text>
      )}
    </Row>
  )
}

export default function SingleToken() {
  const theme = useTheme()
  const navigate = useNavigate()
  const above768 = useMedia(`(min-width:${MEDIA_WIDTHS.upToSmall}px)`)
  const { address } = useParams()
  const [currentTab, setCurrentTab] = useState<DiscoverTokenTab>(DiscoverTokenTab.OnChainAnalysis)
  const { data: apiData, isLoading } = useTokenDetailQuery(testParams.address)
  const data = address ? apiData : TOKEN_DETAIL

  const shareUrl = useRef<string>()
  const toggleShareModal = useToggleModal(ApplicationModal.SHARE)

  const handleShareClick = (url?: string) => {
    shareUrl.current = url
    toggleShareModal()
  }
  const RenderHeader = () => {
    const TokenNameGroup = () => (
      <>
        <ButtonIcon onClick={() => navigate(APP_PATHS.KYBERAI_RANKINGS)}>
          <ChevronLeft size={24} />
        </ButtonIcon>
        <div style={{ position: 'relative' }}>
          <div style={{ borderRadius: '50%', overflow: 'hidden' }}>
            <Logo
              srcs={['https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.svg?v=024']}
              style={{ width: '36px', height: '36px', background: 'white', display: 'block' }}
            />
          </div>
          <div
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              borderRadius: '50%',
              border: `1px solid ${theme.background}`,
            }}
          >
            <img
              src="https://icons.iconarchive.com/icons/cjdowner/cryptocurrency-flat/512/Ethereum-ETH-icon.png"
              alt="eth"
              width="16px"
              height="16px"
              style={{ display: 'block' }}
            />
          </div>
        </div>
        {isLoading ? (
          <DotsLoader />
        ) : (
          <>
            <Text fontSize={24} color={theme.text} fontWeight={500}>
              {data?.name}
            </Text>
          </>
        )}
      </>
    )

    const SettingButtons = () => (
      <>
        <HeaderButton
          style={{
            color: data?.isWatched ? theme.primary : theme.subText,
            backgroundColor: data?.isWatched ? theme.primary + '33' : theme.buttonGray,
          }}
        >
          <Star size={16} fill={data?.isWatched ? 'currentcolor' : 'none'} />
        </HeaderButton>
        <HeaderButton
          style={{
            color: theme.subText,
          }}
        >
          <Icon id="alarm" size={18} />
        </HeaderButton>
        <HeaderButton
          style={{
            color: theme.subText,
          }}
          onClick={() => handleShareClick()}
        >
          <Share2 size={16} fill="currentcolor" />
        </HeaderButton>
      </>
    )

    return above768 ? (
      <RowBetween marginBottom="24px">
        <RowFit gap="8px">
          <TokenNameGroup />
          <SettingButtons />
          <ButtonPrimary height="36px" width="120px" gap="4px">
            <RowFit gap="4px">
              <Icon id="swap" size={16} />
              Swap {data?.symbol}
            </RowFit>
          </ButtonPrimary>
        </RowFit>
      </RowBetween>
    ) : (
      <>
        <Row
          gap="8px"
          padding="10px 0"
          style={{ position: 'sticky', top: '0px', backgroundColor: theme.buttonBlack, zIndex: 10 }}
        >
          <TokenNameGroup />
        </Row>
        <RowBetween>
          <RowFit gap="8px">
            <SettingButtons />
          </RowFit>
          <ButtonPrimary height="36px" width="120px" gap="4px">
            <RowFit gap="4px">
              <Icon id="swap" size={16} />
              Swap {data?.symbol}
            </RowFit>
          </ButtonPrimary>
        </RowBetween>
      </>
    )
  }

  return (
    <Wrapper>
      <RenderHeader />
      <Text fontSize={12} color={theme.subText} marginBottom="12px">
        {isLoading ? (
          <DotsLoader />
        ) : (
          <TokenDescription
            description="Bitcoin is a decentralized cryptocurrency originally described in a 2008 whitepaper by a person, or group of
          people, using the alias Satoshi Nakamoto. It was launched soon after, in January 2009. 
          Bitcoin is a peer-to-peer online currency, meaning that all transactions happen directly between equal,
          independent network participants, without the need for any intermediary to permit or facilitate them.
          Bitcoin was created, according to Nakamoto's own words, to allow “online payments to be sent directly
          from one party to another without going through a financial institution.”"
          />
        )}
      </Text>

      <TagWrapper>
        {data?.tags?.map(tag => {
          return <Tag key="tag">{tag}</Tag>
        })}
        <Tag active>View All</Tag>
      </TagWrapper>
      <TokenOverview />

      <Row>
        <Row gap={above768 ? '20px' : '8px'} justify="center">
          {Object.values(DiscoverTokenTab).map((tab: DiscoverTokenTab) => (
            <TabButton key={tab} active={tab === currentTab} onClick={() => setCurrentTab(tab)}>
              <Icon
                id={
                  {
                    [DiscoverTokenTab.OnChainAnalysis]: 'on-chain',
                    [DiscoverTokenTab.TechnicalAnalysis]: 'technical-analysis',
                    [DiscoverTokenTab.News]: 'news',
                  }[tab]
                }
                size={16}
              />
              {above768 ? tab : tab.split(' Analysis')[0]}
            </TabButton>
          ))}
        </Row>
        <RowFit alignSelf="flex-end">
          <DisplaySettings currentTab={currentTab} />
        </RowFit>
      </Row>
      {currentTab === DiscoverTokenTab.OnChainAnalysis && <OnChainAnalysis onShareClick={handleShareClick} />}
      {currentTab === DiscoverTokenTab.TechnicalAnalysis && <TechnicalAnalysis />}
      {currentTab === DiscoverTokenTab.News && <News />}
      <ShareModal title="Share with your friends" url={shareUrl.current} />
      <TutorialModal />
    </Wrapper>
  )
}
