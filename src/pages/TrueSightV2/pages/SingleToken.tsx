import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { stringify } from 'querystring'
import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ChevronLeft } from 'react-feather'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Icon from 'components/Icons/Icon'
import { DotsLoader } from 'components/Loader/DotsLoader'
import Row, { RowBetween, RowFit } from 'components/Row'
import { APP_PATHS } from 'constants/index'
import { MIXPANEL_TYPE, useMixpanelKyberAI } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { PROFILE_MANAGE_ROUTES } from 'pages/NotificationCenter/const'
import { MEDIA_WIDTHS } from 'theme'

import DisplaySettings from '../components/DisplaySettings'
import FeedbackSurvey from '../components/FeedbackSurvey'
import KyberAIShareModal from '../components/KyberAIShareModal'
import SimpleTooltip from '../components/SimpleTooltip'
import { TokenOverview } from '../components/TokenOverview'
import WatchlistButton from '../components/WatchlistButton'
import ExploreShareContent from '../components/shareContent/ExploreTopShareContent'
import { MIXPANEL_KYBERAI_TAG, NETWORK_IMAGE_URL, NETWORK_TO_CHAINID } from '../constants'
import useChartStatesReducer, { ChartStatesContext } from '../hooks/useChartStatesReducer'
import useKyberAITokenOverview from '../hooks/useKyberAITokenOverview'
import { DiscoverTokenTab, ITokenOverview } from '../types'
import { navigateToSwapPage } from '../utils'
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
export const HeaderButton = styled.div`
  width: 36px;
  height: 36px;
  padding: 0px;
  border-radius: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: ${({ theme }) => (theme.darkMode ? theme.buttonGray : theme.background)};
  color: ${({ theme }) => theme.subText};
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.16);
  :hover {
    filter: brightness(0.9);
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 32px;
    height: 32px;
  `}
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
    filter: brightness(1.1);
  }
  :active {
    filter: brightness(1.3);
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
  font-size: 24px;
  font-weight: 500;
  line-height: 28px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.1s ease;
  ${({ active, theme }) =>
    active &&
    css`
      color: ${theme.primary};
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

export const defaultExplorePageToken = {
  chain: 'ethereum',
  address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
}

const StyledTokenDescription = styled.div<{ show?: boolean }>`
  text-overflow: ellipsis;
  overflow: hidden;
  font-size: 12px;
  line-height: 16px;
  flex: 1;
  &,
  & * {
    white-space: ${({ show }) => (show ? 'initial' : 'nowrap')};
  }
`

function linkify(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  return text.replace(urlRegex, function (url: string) {
    // Check if the URL is already wrapped in an anchor tag
    if (/<a \b[^>]*>(.*?)<\/a>/i.test(text)) {
      return url
    } else {
      return '<a href="' + url + '">' + url + '</a>'
    }
  })
}

const TokenDescription = ({ description }: { description: string }) => {
  const theme = useTheme()
  const [show, setShow] = useState(true)
  const [isTextExceeded, setIsTextExceeded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    setIsTextExceeded((description && ref.current && ref.current?.clientWidth <= ref.current?.scrollWidth) || false)
  }, [description])

  useEffect(() => {
    const hideBtn = document.getElementById('hide-token-description-span')
    if (hideBtn) {
      hideBtn.addEventListener('click', () => {
        setShow(false)
      })
    }
  }, [])

  return (
    <Row style={{ position: 'relative' }}>
      <StyledTokenDescription
        ref={ref}
        show={show}
        dangerouslySetInnerHTML={{
          __html:
            linkify(description) +
            `<span style="color:${
              theme.primary
            }; cursor:pointer; margin-left:4px;" id="hide-token-description-span">${t`Hide`}</span>`,
        }}
      />
      {isTextExceeded && !show && (
        <Text
          as="span"
          fontSize="12px"
          color={theme.primary}
          width="fit-content"
          style={{
            padding: '0 6px',
            cursor: 'pointer',
            flexBasis: 'fit-content',
            whiteSpace: 'nowrap',
          }}
          onClick={() => setShow(true)}
        >
          {t`Read more`}
        </Text>
      )}
    </Row>
  )
}

const TokenNameGroup = ({ token, isLoading }: { token?: ITokenOverview; isLoading?: boolean }) => {
  // const { account } = useActiveWeb3React()
  const theme = useTheme()
  const mixpanelHandler = useMixpanelKyberAI()
  const navigate = useNavigate()
  const location = useLocation()
  const above768 = useMedia(`(min-width:${MEDIA_WIDTHS.upToSmall}px)`)
  const { chain } = useParams()
  // const reachedMaxLimit = useIsReachMaxLimitWatchedToken()
  // const [addToWatchlist, { isLoading: loadingAddtoWatchlist }] = useAddToWatchlistMutation()
  // const [removeFromWatchlist, { isLoading: loadingRemovefromWatchlist }] = useRemoveFromWatchlistMutation()
  // const [isWatched, setIsWatched] = useState(false)

  // const handleStarClick = () => {
  //   if (!token || !chain || !account) return
  //   if (isWatched) {
  //     mixpanelHandler(MIXPANEL_TYPE.KYBERAI_ADD_TOKEN_TO_WATCHLIST, {
  //       token_name: token.symbol?.toUpperCase(),
  //       source: 'explore',
  //       option: 'remove',
  //     })

  //     removeFromWatchlist({
  //       tokenAddress: token?.address,
  //       chain,
  //     }).then(() => setIsWatched(false))
  //   } else {
  //     if (!reachedMaxLimit) {
  //       mixpanelHandler(MIXPANEL_TYPE.KYBERAI_ADD_TOKEN_TO_WATCHLIST, {
  //         token_name: token.symbol?.toUpperCase(),
  //         source: 'explore',
  //         option: 'add',
  //       })
  //       addToWatchlist({ tokenAddress: token?.address, chain }).then(() => setIsWatched(true))
  //     }
  //   }
  // }
  const handleGoBackClick = () => {
    if (!!location?.state?.from) {
      navigate(location.state.from)
    } else {
      navigate({ pathname: APP_PATHS.KYBERAI_RANKINGS })
    }
  }
  useEffect(() => {
    if (token) {
      // setIsWatched(token.isWatched)
    }
  }, [token])
  return (
    <>
      <SimpleTooltip text={t`Go back Ranking page`} hideOnMobile>
        <ButtonIcon onClick={handleGoBackClick}>
          <ChevronLeft size={24} />
        </ButtonIcon>
      </SimpleTooltip>
      <WatchlistButton
        wrapperStyle={{
          color: theme.subText,
          backgroundColor: theme.darkMode ? theme.buttonGray : theme.background,
          height: above768 ? '36px' : '32px',
          width: above768 ? '36px' : '32px',
          borderRadius: '100%',
        }}
      />
      <div style={{ position: 'relative' }}>
        <div style={{ borderRadius: '50%', overflow: 'hidden' }}>
          <img
            src={token?.logo}
            style={{
              width: above768 ? '36px' : '28px',
              height: above768 ? '36px' : '28px',
              background: 'white',
              display: 'block',
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            borderRadius: '50%',
            border: `1px solid ${theme.background}`,
            backgroundColor: theme.tableHeader,
          }}
        >
          <img
            src={NETWORK_IMAGE_URL[chain || 'ethereum']}
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
          <Text fontSize={above768 ? 24 : 16} color={theme.text} fontWeight={500}>
            {token?.name} ({token?.symbol.toUpperCase()})
          </Text>
        </>
      )}
    </>
  )
}
const SettingButtons = ({ token, onShareClick }: { token?: ITokenOverview; onShareClick: () => void }) => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { chain } = useParams()
  return (
    <>
      <SimpleTooltip text={t`Set a price alert`} hideOnMobile>
        <HeaderButton
          onClick={() =>
            navigate(
              `${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.CREATE_ALERT}?${stringify({
                inputCurrency: token?.address ?? '',
                chainId: chain ? NETWORK_TO_CHAINID[chain] : '',
              })}`,
            )
          }
          style={{
            color: theme.subText,
          }}
        >
          <Icon id="alarm" size={18} />
        </HeaderButton>
      </SimpleTooltip>
      <SimpleTooltip text={t`Share this token`} hideOnMobile>
        <HeaderButton
          style={{
            color: theme.subText,
          }}
          onClick={onShareClick}
        >
          <Icon id="share" size={16} />
        </HeaderButton>
      </SimpleTooltip>
    </>
  )
}

const MobileStickyHeader = ({ children }: { children: ReactNode }) => {
  const theme = useTheme()
  const ref = useRef<HTMLDivElement>(null)
  const [showPopover, setShowPopover] = useState(false)
  useEffect(() => {
    const checkScroll = () => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      if (rect.top > 0) {
        setShowPopover(false)
      } else {
        setShowPopover(true)
      }
    }
    window.addEventListener('scroll', checkScroll)
    return () => {
      return window.removeEventListener('scroll', checkScroll)
    }
  }, [])
  return (
    <>
      <Row gap="8px" padding="16px 0px" ref={ref}>
        {children}
      </Row>
      <Row
        gap="8px"
        padding="14px 12px"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: theme.buttonBlack,
          zIndex: 100,
          width: '100vw',
          transform: showPopover ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'all 0.1s ease-out',
          visibility: showPopover ? 'visible' : 'hidden',
        }}
      >
        {children}
      </Row>
    </>
  )
}

const TokenHeader = ({
  token,
  isLoading,
  onShareClick,
}: {
  token?: ITokenOverview
  isLoading?: boolean
  onShareClick: () => void
}) => {
  const mixpanelHandler = useMixpanelKyberAI()
  const above768 = useMedia(`(min-width:${MEDIA_WIDTHS.upToSmall}px)`)
  const { chain } = useParams()
  return above768 ? (
    <RowBetween marginBottom="24px">
      <RowFit gap="12px">
        <TokenNameGroup token={token} isLoading={isLoading} />
      </RowFit>
      <RowFit gap="12px">
        <SettingButtons token={token} onShareClick={onShareClick} />
        <ButtonPrimary
          height={'36px'}
          width="fit-content"
          gap="4px"
          onClick={() => {
            mixpanelHandler(MIXPANEL_TYPE.KYBERAI_EXPLORING_SWAP_TOKEN_CLICK, {
              token_name: token?.symbol?.toUpperCase(),
              network: chain,
            })
            navigateToSwapPage({ address: token?.address, chain })
          }}
        >
          <RowFit gap="4px" style={{ whiteSpace: 'nowrap' }}>
            <Icon id="swap" size={16} />
            Swap {token?.symbol?.toUpperCase()}
          </RowFit>
        </ButtonPrimary>
      </RowFit>
    </RowBetween>
  ) : (
    <>
      <MobileStickyHeader>
        <TokenNameGroup token={token} isLoading={isLoading} />
      </MobileStickyHeader>
      <RowBetween marginBottom="12px">
        <RowFit gap="12px">
          <SettingButtons token={token} onShareClick={onShareClick} />
        </RowFit>
        <ButtonPrimary
          height="32px"
          width="fit-content"
          gap="4px"
          style={{ whiteSpace: 'nowrap', fontSize: '12px' }}
          onClick={() => {
            mixpanelHandler(MIXPANEL_TYPE.KYBERAI_EXPLORING_SWAP_TOKEN_CLICK, {
              token_name: token?.symbol?.toUpperCase(),
              network: chain,
            })
            navigateToSwapPage({ address: token?.address, chain })
          }}
        >
          <RowFit gap="4px">
            <Icon id="swap" size={14} />
            Swap {token?.symbol}
          </RowFit>
        </ButtonPrimary>
      </RowBetween>
    </>
  )
}

export default function SingleToken() {
  const theme = useTheme()
  const navigate = useNavigate()
  const mixpanelHandler = useMixpanelKyberAI()
  const [state, dispatch] = useChartStatesReducer()
  const [showShare, setShowShare] = useState(false)
  const above768 = useMedia(`(min-width:${MEDIA_WIDTHS.upToSmall}px)`)
  const { chain, address } = useParams()
  const [currentTab, setCurrentTab] = useState<DiscoverTokenTab>(DiscoverTokenTab.OnChainAnalysis)

  const { data: token, isLoading } = useKyberAITokenOverview()

  const [viewAllTag, setViewAllTag] = useState(false)

  useEffect(() => {
    if (!chain || !address) {
      navigate(APP_PATHS.KYBERAI_EXPLORE + `/${defaultExplorePageToken.chain}/${defaultExplorePageToken.address}`)
      setTimeout(() => {
        const element = document.querySelector('#kyberai-search') as HTMLInputElement
        element?.focus({
          preventScroll: true,
        })
      }, 750)
    }
  }, [chain, address, navigate])
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <Wrapper>
      <ChartStatesContext.Provider value={{ state, dispatch }}>
        <TokenHeader token={token} isLoading={isLoading} onShareClick={() => setShowShare(true)} />
        <Text fontSize={12} color={theme.subText} marginBottom="12px">
          {isLoading ? <DotsLoader /> : <TokenDescription description={token?.description || ''} />}
        </Text>

        <TagWrapper>
          {token?.tags?.slice(0, viewAllTag ? token.tags.length : 5).map(tag => {
            return <Tag key={tag}>{tag}</Tag>
          })}
          {!viewAllTag && token?.tags && token.tags.length > 5 && (
            <Tag
              active
              onClick={() => {
                mixpanelHandler(MIXPANEL_TYPE.KYBERAI_EXPLORING_VIEW_ALL_CLICK, {
                  token_name: token?.symbol?.toUpperCase(),
                  network: chain,
                })
                setViewAllTag(true)
              }}
            >
              <Trans>View all</Trans>
            </Tag>
          )}
        </TagWrapper>
        <TokenOverview data={token} isLoading={isLoading} />

        <Row alignItems="center">
          <Row gap={above768 ? '24px' : '12px'} justify="center">
            {Object.values(DiscoverTokenTab).map((tab: DiscoverTokenTab, index: number) => (
              <>
                {index !== 0 && <Text fontSize={24}>|</Text>}
                <TabButton
                  key={tab}
                  active={tab === currentTab}
                  onClick={() => {
                    mixpanelHandler(MIXPANEL_TYPE.KYBERAI_EXPLORING_ANALYSIS_TYPE_CLICK, {
                      token_name: token?.symbol?.toUpperCase(),
                      network: chain,
                      option: tab === DiscoverTokenTab.OnChainAnalysis ? 'onchain_analysis' : 'technical_analysis',
                    })
                    setCurrentTab(tab)
                  }}
                >
                  <Icon
                    id={
                      {
                        [DiscoverTokenTab.OnChainAnalysis]: 'on-chain' as const,
                        [DiscoverTokenTab.TechnicalAnalysis]: 'technical-analysis' as const,
                      }[tab]
                    }
                    size={20}
                  />
                  {above768 ? tab : tab.split(' Analysis')[0]}
                </TabButton>
              </>
            ))}
          </Row>
          <RowFit alignSelf="flex-end">
            <DisplaySettings currentTab={currentTab} />
          </RowFit>
        </Row>
        {currentTab === DiscoverTokenTab.OnChainAnalysis && <OnChainAnalysis />}
        {currentTab === DiscoverTokenTab.TechnicalAnalysis && <TechnicalAnalysis />}
      </ChartStatesContext.Provider>
      <KyberAIShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        content={mobileMode => <ExploreShareContent token={token} mobileMode={mobileMode} />}
        onShareClick={social =>
          mixpanelHandler(MIXPANEL_TYPE.KYBERAI_SHARE_TOKEN_CLICK, {
            token_name: token?.symbol?.toUpperCase(),
            network: chain,
            source: MIXPANEL_KYBERAI_TAG.EXPLORE_SHARE_THIS_TOKEN,
            share_via: social,
          })
        }
      />
      <FeedbackSurvey />
    </Wrapper>
  )
}
