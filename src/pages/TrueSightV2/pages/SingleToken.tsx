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
import ShareModal from 'components/ShareModal'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { NOTIFICATION_ROUTES } from 'pages/NotificationCenter/const'
import { ApplicationModal } from 'state/application/actions'
import { useToggleModal } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'

import DisplaySettings from '../components/DisplaySettings'
import ShareKyberAIModal from '../components/ShareKyberAIModal'
import SimpleTooltip from '../components/SimpleTooltip'
import { TokenOverview } from '../components/TokenOverview'
import { StarWithAnimation } from '../components/WatchlistStar'
import { NETWORK_IMAGE_URL, NETWORK_TO_CHAINID } from '../constants'
import { useAddToWatchlistMutation, useRemoveFromWatchlistMutation, useTokenDetailQuery } from '../hooks/useKyberAIData'
import { DiscoverTokenTab } from '../types'
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
  gap: '12px';
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
    width: 28px;
    height: 28px;
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

// const HeaderTag = styled(RowFit)`
//   position: relative;
//   gap: 4px;
//   padding: 4px 8px;
//   height: 24px;
//   font-size: 12px;
//   line-height: 16px;
//   font-weight: 500;
//   color: ${({ theme }) => theme.subText};
//   background-color: ${({ theme }) => (theme.darkMode ? theme.subText + '32' : theme.background)};
//   border-radius: 20px;
//   cursor: pointer;
//   user-select: none;
//   box-shadow: 0px 2px 2px rgba(0, 0, 0, 0.16);
//   :hover {
//     filter: brightness(1.2);
//   }
//   :active {
//     box-shadow: 0 0 0 1pt ${({ theme }) => theme.subText + '32'};
//   }
// `

// const CheckIcon = styled(RowFit)`
//   position: absolute;
//   top: -5px;
//   right: 0;
//   border-radius: 50%;
//   height: 12px;
//   width: 12px;
//   background-color: ${({ theme }) => (theme.darkMode ? '#19473a' : '#bcffec')};
//   justify-content: center;
//   color: ${({ theme }) => theme.primary};
// `

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

const TokenDescription = ({ description }: { description: string }) => {
  const theme = useTheme()
  const [show, setShow] = useState(true)
  const [isTextExceeded, setIsTextExceeded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    setIsTextExceeded((description && ref.current && ref.current?.clientWidth <= ref.current?.scrollWidth) || false)
  }, [description])

  return (
    <Row>
      <StyledTokenDescription ref={ref} show={show}>
        {description}{' '}
        {isTextExceeded && show && (
          <Text
            as="span"
            fontSize="12px"
            color={theme.primary}
            width="fit-content"
            style={{ cursor: 'pointer', flexBasis: 'fit-content', whiteSpace: 'nowrap' }}
            onClick={() => setShow(false)}
          >
            Hide
          </Text>
        )}
      </StyledTokenDescription>
      {isTextExceeded && !show && (
        <Text
          fontSize="12px"
          lineHeight="16px"
          color={theme.primary}
          width="fit-content"
          style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
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
  const location = useLocation()

  const above768 = useMedia(`(min-width:${MEDIA_WIDTHS.upToSmall}px)`)
  const { chain, address } = useParams()
  const [currentTab, setCurrentTab] = useState<DiscoverTokenTab>(DiscoverTokenTab.OnChainAnalysis)
  const [shareContent, setShareContent] = useState<ReactNode>(null)
  const [shareTitle, setShareTitle] = useState<string>('')
  const { account } = useActiveWeb3React()
  const { data: token, isLoading } = useTokenDetailQuery({
    chain: chain || defaultExplorePageToken.chain,
    address: address || defaultExplorePageToken.address,
    account,
  })

  const shareUrl = useRef<string>()
  const toggleShareModal = useToggleModal(ApplicationModal.KYBERAI_SHARE)

  const handleShareClick = (content: ReactNode, title: string) => {
    setShareContent(content)
    setShareTitle(title)
    toggleShareModal()
  }

  const [addToWatchlist, { isLoading: loadingAddtoWatchlist }] = useAddToWatchlistMutation()
  const [removeFromWatchlist, { isLoading: loadingRemovefromWatchlist }] = useRemoveFromWatchlistMutation()

  const [viewAllTag, setViewAllTag] = useState(false)
  const [isWatched, setIsWatched] = useState(false)

  const handleStarClick = () => {
    if (!token || !chain || !account) return
    if (isWatched) {
      removeFromWatchlist({
        wallet: account,
        tokenAddress: token?.address,
        chain,
      }).then(() => setIsWatched(false))
    } else {
      addToWatchlist({ wallet: account, tokenAddress: token?.address, chain }).then(() => setIsWatched(true))
    }
  }

  const handleGoBackClick = () => {
    console.log(1)
    console.log('🚀 ~ file: SingleToken.tsx:290 ~ handleGoBackClick ~ location.state.from:', location?.state?.from)
    if (!!location?.state?.from) {
      navigate(location.state.from)
    } else {
      navigate({ pathname: APP_PATHS.KYBERAI_RANKINGS })
    }
  }

  useEffect(() => {
    if (token) {
      setIsWatched(token.isWatched)
    }
  }, [token])

  useEffect(() => {
    if (!chain || !address) {
      navigate(APP_PATHS.KYBERAI_EXPLORE + `/${defaultExplorePageToken.chain}/${defaultExplorePageToken.address}`)
      window.scrollTo(0, 0)
    }
  }, [chain, address, navigate])
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const RenderHeader = () => {
    const TokenNameGroup = () => (
      <>
        <SimpleTooltip text={t`Go back Ranking page`}>
          <ButtonIcon onClick={handleGoBackClick}>
            <ChevronLeft size={24} />
          </ButtonIcon>
        </SimpleTooltip>
        <SimpleTooltip text={isWatched ? t`Remove from watchlist` : t`Add to watchlist`}>
          <HeaderButton
            style={{
              color: isWatched ? theme.primary : theme.subText,
              backgroundColor: isWatched ? theme.primary + '33' : undefined,
            }}
            onClick={handleStarClick}
          >
            <StarWithAnimation
              watched={isWatched}
              loading={loadingAddtoWatchlist || loadingRemovefromWatchlist}
              size={16}
            />
          </HeaderButton>
        </SimpleTooltip>
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

        {/* {above768 && (
          <>
            <HeaderTag
              onClick={() =>
                navigate({
                  pathname: APP_PATHS.KYBERAI_RANKINGS,
                  search: createSearchParams({ listId: KyberAIListType.BULLISH }).toString(),
                })
              }
            >
              <Icon id="bullish" size={12} />
              <Text>Bullish</Text>
              <CheckIcon>
                <Icon id="check" size={8} />
              </CheckIcon>
            </HeaderTag>
            <HeaderTag
              onClick={() =>
                navigate({
                  pathname: APP_PATHS.KYBERAI_RANKINGS,
                  search: createSearchParams({ listId: KyberAIListType.TOP_CEX_INFLOW }).toString(),
                })
              }
            >
              <Icon id="download" size={12} />
              <Text>Top CEX Inflow</Text>
              <CheckIcon>
                <Icon id="check" size={8} />
              </CheckIcon>
            </HeaderTag>
          </>
        )} */}
      </>
    )

    const SettingButtons = () => (
      <>
        <MouseoverTooltip text={t`Set a price alert`} placement="top" width="fit-content">
          <HeaderButton
            onClick={() =>
              navigate(
                `${APP_PATHS.NOTIFICATION_CENTER}${NOTIFICATION_ROUTES.CREATE_ALERT}?${stringify({
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
        </MouseoverTooltip>
        {/* <MouseoverTooltip text={t`Share this token`} placement="top" width="fit-content">
          <HeaderButton
            style={{
              color: theme.subText,
            }}
            // onClick={handleShareClick}
          >
            <Share2 size={16} fill="currentcolor" />
          </HeaderButton>
        </MouseoverTooltip> */}
      </>
    )

    return above768 ? (
      <RowBetween marginBottom="24px">
        <RowFit gap="12px">
          <TokenNameGroup />
        </RowFit>
        <RowFit gap="12px">
          <SettingButtons />
          <ButtonPrimary
            height={'36px'}
            width="fit-content"
            gap="4px"
            onClick={() => navigateToSwapPage({ address: token?.address, chain })}
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
        <Row
          gap="8px"
          padding="14px 12px"
          style={{
            position: 'sticky',
            top: '-2px',
            backgroundColor: theme.buttonBlack,
            zIndex: 10,
            transform: 'translateX(-16px)',
            width: '100vw',
          }}
        >
          <TokenNameGroup />
        </Row>
        <RowBetween marginBottom="12px">
          <RowFit gap="8px">
            <SettingButtons />
          </RowFit>
          <ButtonPrimary height="28px" width="fit-content" gap="4px" style={{ whiteSpace: 'nowrap', fontSize: '12px' }}>
            <RowFit gap="4px">
              <Icon id="swap" size={14} />
              Swap {token?.symbol}
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
        {isLoading ? <DotsLoader /> : <TokenDescription description={token?.description || ''} />}
      </Text>

      <TagWrapper>
        {token?.tags?.slice(0, viewAllTag ? token.tags.length : 5).map(tag => {
          return <Tag key="tag">{tag}</Tag>
        })}
        {!viewAllTag && token?.tags && token.tags.length > 5 && (
          <Tag active onClick={() => setViewAllTag(true)}>
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
              <TabButton key={tab} active={tab === currentTab} onClick={() => setCurrentTab(tab)}>
                <Icon
                  id={
                    {
                      [DiscoverTokenTab.OnChainAnalysis]: 'on-chain',
                      [DiscoverTokenTab.TechnicalAnalysis]: 'technical-analysis',
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
      {currentTab === DiscoverTokenTab.OnChainAnalysis && <OnChainAnalysis onShareClick={handleShareClick} />}
      {currentTab === DiscoverTokenTab.TechnicalAnalysis && <TechnicalAnalysis />}
      {/* {currentTab === DiscoverTokenTab.News && <News />} */}
      <ShareModal title="Share with your friends" url={shareUrl.current} />
      <ShareKyberAIModal token={token} content={shareContent} title={shareTitle} />
    </Wrapper>
  )
}
