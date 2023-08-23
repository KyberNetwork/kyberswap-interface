import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { motion } from 'framer-motion'
import { rgba } from 'polished'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { Info } from 'react-feather'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled, { DefaultTheme, css } from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { ButtonGray, ButtonLight, ButtonOutlined } from 'components/Button'
import Column from 'components/Column'
import Icon from 'components/Icons/Icon'
import AnimatedLoader from 'components/Loader/AnimatedLoader'
import Pagination from 'components/Pagination'
import Row, { RowBetween, RowFit } from 'components/Row'
import { APP_PATHS, ICON_ID } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { MIXPANEL_TYPE, useMixpanelKyberAI } from 'hooks/useMixpanel'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'

import ChevronIcon from '../components/ChevronIcon'
import FeedbackSurvey from '../components/FeedbackSurvey'
import KyberAIShareModal from '../components/KyberAIShareModal'
import MultipleChainDropdown from '../components/MultipleChainDropdown'
import NetworkSelect from '../components/NetworkSelect'
import SimpleTooltip from '../components/SimpleTooltip'
import SmallKyberScoreMeter from '../components/SmallKyberScoreMeter'
import TokenChart from '../components/TokenChartSVG'
import TokenListVariants from '../components/TokenListVariants'
import WatchlistButton from '../components/WatchlistButton'
import KyberScoreChart from '../components/chart/KyberScoreChart'
import TokenAnalysisListShareContent from '../components/shareContent/TokenAnalysisListShareContent'
import { KYBERAI_LISTYPE_TO_MIXPANEL, SUPPORTED_NETWORK_KYBERAI } from '../constants'
import { useTokenListQuery } from '../hooks/useKyberAIData'
import { IKyberScoreChart, ITokenList, KyberAIListType } from '../types'
import { calculateValueToColor, formatLocaleStringNum, formatTokenPrice, navigateToSwapPage } from '../utils'

const TableWrapper = styled.div`
  border-radius: 20px 20px 0 0;
  padding: 0;
  font-size: 12px;
  border-bottom: none;
  transition: all 0.15s ease;
  overflow: hidden;
  @media only screen and (max-width: 1080px) {
    margin-left: -16px;
    margin-right: -16px;
    border-radius: 0px;
    border: none;
    overflow-x: scroll;
  }
`
const PaginationWrapper = styled.div`
  border-radius: 0 0 20px 20px;
  display: flex;
  align-items: center;
  border-top: none;
  overflow: hidden;
  min-height: 50px;
  background-color: ${({ theme }) => theme.background};
  @media only screen and (max-width: 1080px) {
    margin-left: -16px;
    margin-right: -16px;
    border-radius: 0px;
    border: none;
  }
`
const Table = styled.table`
  border-spacing: 0px;
  width: 100%;
  border-collapse: collapse;

  thead {
    height: 48px;
    text-transform: uppercase;
    position: sticky;
    top: 0;
    z-index: 2;
    border-radius: 19px 19px 0 0;

    ${({ theme }) => css`
      background-color: ${theme.tableHeader};
      color: ${theme.subText};
    `};

    @media only screen and (max-width: 768px) {
      border-radius: 0;
    }

    th {
      border: none;
      outline: none;
      white-space: nowrap;
      font-weight: 400 !important;
      color: ${({ theme }) => theme.subText} !important;
      font-size: 12px;
      background-color: ${({ theme }) => theme.tableHeader};
      cursor: pointer;

      :hover {
        color: ${({ theme }) => theme.text} !important;
      }
    }
    tr {
      height: 48px;
    }
  }

  tr {
    height: 80px;
    font-size: 14px;
    content-visibility: auto;
    contain-intrinsic-height: 80px;
    border-radius: 0;
    cursor: pointer;
    transition: background-color 0.1s linear;
    ${({ theme }) => css`
      td {
        background-color: ${theme.background};
      }
      color: ${theme.text};
      border-bottom: 1px solid ${theme.border};

      :hover td {
        background-color: ${theme.buttonGray};
      }
    `};

    td,
    th {
      padding: 10px 16px;
      text-align: center;
    }

    td:nth-child(1),
    th:nth-child(1),
    td:nth-child(2),
    th:nth-child(2) {
      position: sticky;
      z-index: 2;
    }
    td:nth-child(1),
    th:nth-child(1) {
      left: -1px;
    }
    td:nth-child(2),
    th:nth-child(2) {
      left: 34px;
    }
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    tr {
      td, th {
        padding: 8px 10px;
      }
    }
  `}

  .table-cell-shadow-right::before {
    box-shadow: inset 10px 0 8px -8px #00000099;
    position: absolute;
    top: 0;
    right: 0;
    bottom: -1px;
    width: 30px;
    transform: translate(100%);
    transition: box-shadow 0.5s;
    content: '';
    pointer-events: none;
  }
`

const ActionButton = styled.button<{ color: string }>`
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
  border: none;
  border-radius: 50vh;
  cursor: pointer;
  transition: all 0.1s ease;
  ${({ theme, color }) => css`
    color: ${color || theme.primary};
    background-color: ${color ? rgba(color, 0.2) : rgba(theme.primary, 0.2)};
    :focus {
      box-shadow: 0 0 0 1pt ${color ? rgba(color, 0.2) : rgba(theme.primary, 0.2)};
    }
  `}
  :hover {
    filter: brightness(1.2);
  }
  gap: 4px;
`

const TabWrapper = styled(motion.div)`
  overflow: auto;
  cursor: grab;
  display: inline-flex;
  width: fit-content;
  gap: 8px;
  padding: 1px;
  position: relative;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  min-width: 100%;
  > * {
    flex: 1 0 fit-content;
    scroll-snap-align: start;
  }
  &.no-scroll {
    scroll-snap-type: unset;
    scroll-behavior: unset;
    > * {
      scroll-snap-align: unset;
    }
  }
  ${({ theme }) => theme.mediaWidth.upToSmall`
    min-width: initial;
    flex:1;
  `}
`

const ButtonTypeActive = styled(ButtonLight)`
  height: 36px;
  margin: 0 !important;
  display: flex;
  gap: 4px;
  font-size: 14px;
  white-space: nowrap;
  border: 1px solid ${({ theme }) => theme.primary};
  background-color: ${({ theme }) => rgba(theme.primary, 0.33)};
  transition: all 0.1s ease;
  flex: 1;
  :hover {
    background-color: ${({ theme }) => rgba(theme.primary, 0.5)};
    filter: none;
  }
`

const ButtonTypeInactive = styled(ButtonOutlined)`
  height: 36px;
  margin: 0 !important;
  display: flex;
  gap: 4px;
  font-size: 14px;
  white-space: nowrap;
  transition: all 0.1s ease;
  flex: 1;

  ${({ theme }) => css`
    color: ${theme.subText};
    border-color: ${theme.subText};
  `}
  :hover {
    background-color: ${({ theme }) => rgba(theme.border, 0.5)};
  }
`

const LoadingWrapper = styled(Row)`
  position: absolute;
  inset: 0 0 0 0;
  background: ${({ theme }) => theme.background};
  opacity: 0.8;
  z-index: 100;
  border-radius: 20px;
  padding-top: min(25vh, 20%);
  justify-content: center;
  align-items: flex-start;
  box-sizing: border-box;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    inset: 0 -16px 0 -16px;
    width: 100vw;
    border-radius: 0;
  `}
`

const tokenTypeList: {
  type: KyberAIListType
  icon?: ICON_ID
  tooltip?: (theme: DefaultTheme) => ReactNode
  title: string
}[] = [
  { type: KyberAIListType.MYWATCHLIST, icon: 'star', title: t`My Watchlist` },
  { type: KyberAIListType.ALL, title: t`All` },
  {
    type: KyberAIListType.BULLISH,
    title: t`Bullish`,
    icon: 'bullish',
    tooltip: theme => (
      <span>
        Tokens with the highest chance of price <span style={{ color: theme.text }}>increase</span> in the next 24H
        (highest KyberScore)
      </span>
    ),
  },
  {
    type: KyberAIListType.BEARISH,
    title: t`Bearish`,
    icon: 'bearish',
    tooltip: theme => (
      <span>
        Tokens with the highest chance of price <span style={{ color: theme.text }}>decrease</span> in the next 24H
        (lowest KyberScore)
      </span>
    ),
  },
  {
    type: KyberAIListType.TOP_CEX_INFLOW,
    title: t`Top CEX Positive Netflow`,
    icon: 'download',
    tooltip: theme => (
      <span>
        Tokens with the highest <span style={{ color: theme.text }}>net deposits</span> to Centralized Exchanges in the
        last 3 Days. Possible incoming sell pressure
      </span>
    ),
  },
  {
    type: KyberAIListType.TOP_CEX_OUTFLOW,
    title: t`Top CEX Negative Netflow`,
    icon: 'upload',
    tooltip: theme => (
      <span>
        Tokens with the highest <span style={{ color: theme.text }}>net withdrawals</span> from Centralized Exchanges in
        the last 3 Days. Possible buy pressure
      </span>
    ),
  },
  {
    type: KyberAIListType.TOP_TRADED,
    title: t`Top Traded`,
    icon: 'coin-bag',
    tooltip: theme => (
      <span>
        Tokens with the <span style={{ color: theme.text }}>highest 24H trading volume</span>
      </span>
    ),
  },
  {
    type: KyberAIListType.TRENDING_SOON,
    title: t`Trending Soon`,
    icon: 'trending-soon',
    tooltip: theme => (
      <span>
        Tokens that could be <span style={{ color: theme.text }}>trending</span> in the near future. Trending indicates
        interest in a token - it doesnt imply bullishness or bearishness
      </span>
    ),
  },
  {
    type: KyberAIListType.TRENDING,
    title: t`Currently Trending`,
    icon: 'flame',
    tooltip: theme => (
      <span>
        Tokens that are <span style={{ color: theme.text }}>currently trending</span> in the market
      </span>
    ),
  },
]

const TokenListDraggableTabs = ({ tab, setTab }: { tab: KyberAIListType; setTab: (type: KyberAIListType) => void }) => {
  const theme = useTheme()
  const mixpanelHandler = useMixpanelKyberAI()
  const [showScrollRightButton, setShowScrollRightButton] = useState(false)
  const [scrollLeftValue, setScrollLeftValue] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const tabListRef = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    wrapperRef.current?.scrollTo({ left: scrollLeftValue, behavior: 'smooth' })
  }, [scrollLeftValue])

  useEffect(() => {
    const wRef = wrapperRef.current
    if (!wRef) return
    const handleWheel = (e: any) => {
      e.preventDefault()
      setScrollLeftValue(prev => Math.min(Math.max(prev + e.deltaY, 0), wRef.scrollWidth - wRef.clientWidth))
    }
    if (wRef) {
      wRef.addEventListener('wheel', handleWheel)
    }
    return () => wRef?.removeEventListener('wheel', handleWheel)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (wrapperRef.current?.clientWidth && wrapperRef.current?.clientWidth < wrapperRef.current?.scrollWidth) {
        setShowScrollRightButton(true)
      } else {
        setShowScrollRightButton(false)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <>
      <TabWrapper ref={wrapperRef} onScrollCapture={e => e.preventDefault()}>
        {tokenTypeList.map(({ type, title, icon, tooltip }, index) => {
          const props = {
            onClick: () => {
              mixpanelHandler(MIXPANEL_TYPE.KYBERAI_RANKING_CATEGORY_CLICK, {
                from_cate: KYBERAI_LISTYPE_TO_MIXPANEL[tab],
                to_cate: KYBERAI_LISTYPE_TO_MIXPANEL[type],
                source: KYBERAI_LISTYPE_TO_MIXPANEL[tab],
              })
              setTab(type)
              if (!wrapperRef.current) return
              const tabRef = tabListRef.current[index]
              const wRef = wrapperRef.current
              if (tabRef.offsetLeft < wRef.scrollLeft) {
                setScrollLeftValue(tabRef.offsetLeft)
              }
              if (wRef.scrollLeft + wRef.clientWidth < tabRef.offsetLeft + tabRef.offsetWidth) {
                setScrollLeftValue(tabRef.offsetLeft + tabRef.offsetWidth - wRef.offsetWidth)
              }
            },
          }
          if (tab === type) {
            return (
              <SimpleTooltip key={type} text={tooltip?.(theme)} delay={500} hideOnMobile>
                <ButtonTypeActive {...props} ref={el => (tabListRef.current[index] = el)}>
                  {icon && <Icon id={icon} size={16} />}
                  {title}
                </ButtonTypeActive>
              </SimpleTooltip>
            )
          } else {
            return (
              <SimpleTooltip key={type} text={tooltip?.(theme)} delay={500} hideOnMobile>
                <ButtonTypeInactive key={type} {...props} ref={el => (tabListRef.current[index] = el)}>
                  {icon && <Icon id={icon} size={16} />}
                  {title}
                </ButtonTypeInactive>
              </SimpleTooltip>
            )
          }
        })}
      </TabWrapper>
      {showScrollRightButton && (
        <DropdownSVG
          style={{ transform: 'rotate(-90deg)', cursor: 'pointer', flexShrink: '0' }}
          onClick={() => {
            setScrollLeftValue(prev => prev + 120)
          }}
        />
      )}
    </>
  )
}

const TokenRow = ({
  token,
  currentTab,
  index,
  isScrolling,
  listType,
}: {
  token: ITokenList
  currentTab: KyberAIListType
  index: number
  isScrolling?: boolean
  listType: KyberAIListType
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const mixpanelHandler = useMixpanelKyberAI()
  // const { account } = useActiveWeb3React()
  const theme = useTheme()
  const [showMenu, setShowMenu] = useState(false)
  const [showSwapMenu, setShowSwapMenu] = useState(false)
  const [menuLeft, setMenuLeft] = useState<number | undefined>(undefined)
  // const [addToWatchlist] = useAddToWatchlistMutation()
  // const [removeFromWatchlist] = useRemoveFromWatchlistMutation()
  // const reachedMaxLimit = useIsReachMaxLimitWatchedToken(token?.tokens.length)
  // const [isWatched, setIsWatched] = useState(false)
  // const [loadingStar, setLoadingStar] = useState(false)
  const rowRef = useRef<HTMLTableRowElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useOnClickOutside(menuRef, () => setShowMenu(false))
  useOnClickOutside(menuRef, () => setShowSwapMenu(false))
  const above768 = useMedia(`(min-width:${MEDIA_WIDTHS.upToSmall}px)`)

  const hasMutipleChain = token.tokens.length > 1

  const handleRowClick = (e: any) => {
    if (hasMutipleChain) {
      const left = e.clientX - (rowRef.current?.getBoundingClientRect()?.left || 0)
      const rowWidth = rowRef.current?.getBoundingClientRect()?.width || 0
      const menuWidth = menuRef.current?.getBoundingClientRect()?.width || 0
      if (left !== undefined) {
        setMenuLeft(Math.min(left, rowWidth - menuWidth))
        setShowMenu(true)
      }
    } else {
      navigate(`${APP_PATHS.KYBERAI_EXPLORE}/${token.tokens[0].chain}/${token.tokens[0].address}`, {
        state: { from: location },
      })
    }
  }

  // const handleWatchlistClick = (e: any) => {
  //   e.stopPropagation()
  //   if (!account) return
  //   setLoadingStar(true)
  //   if (isWatched) {
  //     mixpanelHandler(MIXPANEL_TYPE.KYBERAI_ADD_TOKEN_TO_WATCHLIST, {
  //       token_name: token.symbol?.toUpperCase(),
  //       source: KYBERAI_LISTYPE_TO_MIXPANEL[listType],
  //       ranking_order: index,
  //       option: 'remove',
  //     })
  //     Promise.all(token.tokens.map(t => removeFromWatchlist({ tokenAddress: t.address, chain: t.chain }))).then(() => {
  //       setIsWatched(false)
  //       setLoadingStar(false)
  //     })
  //   } else {
  //     if (!reachedMaxLimit) {
  //       mixpanelHandler(MIXPANEL_TYPE.KYBERAI_ADD_TOKEN_TO_WATCHLIST, {
  //         token_name: token.symbol?.toUpperCase(),
  //         source: KYBERAI_LISTYPE_TO_MIXPANEL[listType],
  //         ranking_order: index,
  //         option: 'add',
  //       })
  //       Promise.all(token.tokens.map(t => addToWatchlist({ tokenAddress: t.address, chain: t.chain }))).then(() => {
  //         setIsWatched(true)
  //         setLoadingStar(false)
  //       })
  //     }
  //   }
  // }

  // useEffect(() => {
  //   setIsWatched(token.isWatched)
  // }, [token.isWatched])

  const latestKyberScore: IKyberScoreChart | undefined = token?.ks_3d?.[token.ks_3d.length - 1]
  return (
    <tr key={token.SourceTokenID} ref={rowRef} onClick={handleRowClick} style={{ position: 'relative' }}>
      <td>
        <RowFit gap="6px">
          <WatchlistButton size={above768 ? 20 : 16} />
          {/* <StarWithAnimation
              key={token.SourceTokenID}
              watched={isWatched}
              loading={loadingStar}
              onClick={handleWatchlistClick}
              size={above768 ? 20 : 16}
              disabled={!isWatched && reachedMaxLimit}
            /> */}
          {above768 ? index : <></>}
        </RowFit>
      </td>
      <td className={isScrolling ? 'table-cell-shadow-right' : ''}>
        <Row gap="8px">
          <div style={{ position: 'relative', width: '36px', height: '36px' }}>
            <img
              alt="tokenInList"
              src={token.tokens[0].logo}
              width="36px"
              height="36px"
              loading="lazy"
              style={{ borderRadius: '18px' }}
            />
          </div>

          <Column gap="8px" style={{ cursor: 'pointer', alignItems: 'flex-start' }}>
            <Text style={{ textTransform: 'uppercase' }}>{token.symbol}</Text>{' '}
            <RowFit gap="6px" color={theme.text}>
              <TokenListVariants tokens={token.tokens} />
            </RowFit>
          </Column>
        </Row>
      </td>
      <td>
        <Column style={{ alignItems: 'center', width: '110px' }}>
          <SmallKyberScoreMeter data={latestKyberScore} />
          <Text
            color={calculateValueToColor(latestKyberScore?.kyber_score || 0, theme)}
            fontSize="14px"
            fontWeight={500}
          >
            {latestKyberScore?.tag || 'Not Applicable'}
          </Text>
        </Column>
      </td>
      <td>
        <KyberScoreChart data={token.ks_3d} index={index} />
      </td>
      <td>
        <Column gap="10px" style={{ textAlign: 'left' }}>
          <Text>${formatTokenPrice(token.price)}</Text>
          <Text fontSize={12} color={token.percent_change_24h > 0 ? theme.primary : theme.red}>
            <Row gap="2px">
              <ChevronIcon
                rotate={token.percent_change_24h > 0 ? '180deg' : '0deg'}
                color={token.percent_change_24h > 0 ? theme.primary : theme.red}
              />
              {Math.abs(token.percent_change_24h).toFixed(2)}%
            </Row>
          </Text>
        </Column>
      </td>
      <td style={{ textAlign: 'start' }}>
        <TokenChart data={token['7daysprice']} index={index} />
      </td>
      <td style={{ textAlign: 'start' }}>
        $
        {currentTab === KyberAIListType.TOP_CEX_INFLOW
          ? formatLocaleStringNum(token.cex_inflow_24h - token.cex_outflow_24h) || '--'
          : currentTab === KyberAIListType.TOP_CEX_OUTFLOW
          ? formatLocaleStringNum(token.cex_outflow_24h - token.cex_inflow_24h) || '--'
          : formatLocaleStringNum(token.volume_24h) || '--'}
      </td>
      {[KyberAIListType.TOP_CEX_INFLOW, KyberAIListType.TOP_CEX_OUTFLOW, KyberAIListType.TRENDING_SOON].includes(
        currentTab,
      ) && (
        <td style={{ textAlign: 'start' }}>
          {currentTab === KyberAIListType.TOP_CEX_INFLOW
            ? '$' + formatLocaleStringNum(token.cex_netflow_3days || 0) || '--'
            : currentTab === KyberAIListType.TOP_CEX_OUTFLOW
            ? '$' + formatLocaleStringNum(token.cex_netflow_3days || 0) || '--'
            : currentTab === KyberAIListType.TRENDING_SOON
            ? token.discovered_on
              ? dayjs(token.discovered_on * 1000).format('DD/MM/YYYY')
              : '--'
            : '--'}
        </td>
      )}
      <td>
        <Row gap="6px" justify={'flex-end'}>
          <SimpleTooltip text={t`Explore`}>
            <ActionButton
              color={theme.subText}
              onClick={e => {
                e.stopPropagation()
                mixpanelHandler(MIXPANEL_TYPE.KYBERAI_RANKING_ACTION_CLICK, {
                  token_name: token.symbol?.toUpperCase(),
                  source: KYBERAI_LISTYPE_TO_MIXPANEL[listType],
                  option: 'explore',
                })
                if (hasMutipleChain) {
                  setMenuLeft(undefined)
                  setShowMenu(true)
                } else {
                  navigate(`${APP_PATHS.KYBERAI_EXPLORE}/${token.tokens[0].chain}/${token.tokens[0].address}`, {
                    state: { from: location },
                  })
                }
              }}
            >
              <Icon id="truesight-v2" size={16} />
            </ActionButton>
          </SimpleTooltip>
          <SimpleTooltip text={t`Swap`}>
            <ActionButton
              color={theme.primary}
              onClick={e => {
                e.stopPropagation()
                mixpanelHandler(MIXPANEL_TYPE.KYBERAI_RANKING_ACTION_CLICK, {
                  token_name: token.symbol?.toUpperCase(),
                  source: KYBERAI_LISTYPE_TO_MIXPANEL[listType],
                  option: 'swap',
                })
                if (hasMutipleChain) {
                  setMenuLeft(undefined)
                  setShowSwapMenu(true)
                } else {
                  navigateToSwapPage(token.tokens[0])
                }
              }}
            >
              <Icon id="swap" size={16} />
            </ActionButton>
          </SimpleTooltip>
          {hasMutipleChain && (
            <>
              <MultipleChainDropdown
                ref={menuRef}
                show={showMenu}
                menuLeft={menuLeft}
                tokens={token?.tokens}
                onChainClick={(chain, address) =>
                  navigate(`${APP_PATHS.KYBERAI_EXPLORE}/${chain}/${address}`, {
                    state: { from: location },
                  })
                }
              />
              <MultipleChainDropdown
                show={showSwapMenu}
                menuLeft={menuLeft}
                tokens={token?.tokens}
                onChainClick={(chain, address) => {
                  if (chain && address) {
                    navigateToSwapPage({ chain, address })
                  }
                }}
              />
            </>
          )}
        </Row>
      </td>
    </tr>
  )
}
const LoadingRowSkeleton = ({ hasExtraCol }: { hasExtraCol?: boolean }) => {
  return (
    <>
      {[
        ...Array(10)
          .fill(0)
          .map((_, index) => (
            <tr key={index}>
              <td>
                <Skeleton></Skeleton>
              </td>
              <td>
                <Skeleton></Skeleton>
              </td>
              <td>
                <Skeleton></Skeleton>
              </td>
              <td colSpan={hasExtraCol ? 5 : 4}>
                <Skeleton></Skeleton>
              </td>
              <td>
                <Skeleton></Skeleton>
              </td>
            </tr>
          )),
      ]}
    </>
  )
}
export default function TokenAnalysisList() {
  const theme = useTheme()
  const mixpanelHandler = useMixpanelKyberAI()
  const [showShare, setShowShare] = useState(false)
  const [isScrolling, setIsScrolling] = useState(false)
  const [listType, setListType] = useState(KyberAIListType.BULLISH)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  const above768 = useMedia(`(min-width:${MEDIA_WIDTHS.upToSmall}px)`)

  const [searchParams, setSearchParams] = useSearchParams()
  const listTypeParam = (searchParams.get('listType') as KyberAIListType) || KyberAIListType.BULLISH
  const page = +(searchParams.get('page') || 1)
  const chain = searchParams.get('chain') || 'all'
  const pageSize = 25

  const { data, isLoading, isFetching, isError } = useTokenListQuery(
    listTypeParam === KyberAIListType.MYWATCHLIST
      ? {
          type: KyberAIListType.ALL,
          chain: (chain && SUPPORTED_NETWORK_KYBERAI[Number(chain) as ChainId]) || 'all',
          page,
          pageSize,
          watchlist: true,
        }
      : {
          type: listTypeParam,
          chain: (chain && SUPPORTED_NETWORK_KYBERAI[Number(chain) as ChainId]) || 'all',
          page,
          pageSize,
        },
  )
  const listData = data?.data || []

  const handleTabChange = (tab: KyberAIListType) => {
    searchParams.set('listType', tab)
    searchParams.set('page', '1')
    setSearchParams(searchParams)
  }
  const handlePageChange = (page: number) => {
    searchParams.set('page', page.toString())
    setSearchParams(searchParams)
  }
  const handleChainChange = (chainId?: ChainId) => {
    if (!chainId) {
      searchParams.delete('chain')
      mixpanelHandler(MIXPANEL_TYPE.KYBERAI_RANKING_SWITCH_CHAIN_CLICK, {
        source: KYBERAI_LISTYPE_TO_MIXPANEL[listType],
        network: 'All',
      })
    } else {
      searchParams.set('chain', chainId.toString())
      mixpanelHandler(MIXPANEL_TYPE.KYBERAI_RANKING_SWITCH_CHAIN_CLICK, {
        source: KYBERAI_LISTYPE_TO_MIXPANEL[listType],
        network: NETWORKS_INFO[chainId].name,
      })
    }
    searchParams.set('page', '1')
    setSearchParams(searchParams)
  }

  useEffect(() => {
    if (wrapperRef.current && tableRef.current) {
      const onScroll = () => {
        if (tableRef.current?.getBoundingClientRect().x === 0) {
          setIsScrolling(false)
        } else {
          setIsScrolling(true)
        }
      }
      const el = wrapperRef.current
      el?.addEventListener('scroll', onScroll)

      return () => {
        el?.removeEventListener('scroll', onScroll)
      }
    }
    return
  }, [])
  useEffect(() => {
    if (!isFetching) {
      setListType(listTypeParam)
    }
  }, [isFetching, listTypeParam])
  return (
    <>
      <Row gap="8px" justify="center" flexWrap={above768 ? 'nowrap' : 'wrap'}>
        <TokenListDraggableTabs tab={listTypeParam} setTab={handleTabChange} />
      </Row>
      <RowBetween flexDirection={above768 ? 'row' : 'column'} gap="16px">
        <Column gap="8px">
          <Text fontSize="12px" color={theme.subText} fontWeight={500}>
            <Trans>Rankings will be updated every 4 hours</Trans>
          </Text>
          <Text fontSize="12px" color={theme.subText} fontStyle="italic">
            <Trans>Disclaimer: The information here should not be treated as any form of financial advice</Trans>
          </Text>
        </Column>
        <RowFit gap="12px" alignSelf={'flex-end'}>
          <ButtonGray
            color={theme.subText}
            gap="4px"
            width="36px"
            height="36px"
            padding="6px"
            style={{
              filter: 'drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.16))',
              flexShrink: 0,
              backgroundColor: theme.background,
            }}
            onClick={() => setShowShare(true)}
          >
            <Icon size={16} id="share" />
          </ButtonGray>
          <NetworkSelect filter={Number(chain) as ChainId} setFilter={handleChainChange} />
        </RowFit>
      </RowBetween>
      <Column gap="0px" style={{ position: 'relative' }}>
        {isFetching && (
          <LoadingWrapper>
            <AnimatedLoader />
          </LoadingWrapper>
        )}
        <TableWrapper ref={wrapperRef}>
          <Table ref={tableRef}>
            <colgroup>
              <col style={{ width: '80px', minWidth: '40px' }} />
              <col style={{ width: '220px', minWidth: 'fit-content' }} />
              <col style={{ width: '200px', minWidth: 'auto' }} />
              <col style={{ width: '230px', minWidth: 'auto' }} />
              <col style={{ width: '250px', minWidth: 'auto' }} />
              <col style={{ width: '250px', minWidth: 'auto' }} />
              {[
                KyberAIListType.TOP_CEX_INFLOW,
                KyberAIListType.TOP_CEX_OUTFLOW,
                KyberAIListType.TRENDING_SOON,
              ].includes(listType) && <col style={{ width: '150px', minWidth: 'auto' }} />}
              <col style={{ width: '150px', minWidth: 'auto' }} />
              <col style={{ width: '200px', minWidth: 'auto' }} />
            </colgroup>
            <thead>
              <tr>
                <th>#</th>
                <th style={{ textAlign: 'left' }} className={isScrolling ? 'table-cell-shadow-right' : ''}>
                  <Row>
                    <Trans>Token name</Trans>
                  </Row>
                </th>
                <th style={{ textAlign: 'left' }}>
                  <Column gap="4px">
                    <Row justify="flex-start" gap="4px">
                      <Trans>Kyberscore</Trans>{' '}
                      <SimpleTooltip
                        text={
                          <span>
                            KyberScore uses AI to measure the upcoming trend of a token (bullish or bearish) by taking
                            into account multiple on-chain and off-chain indicators. The score ranges from 0 to 100.
                            Higher the score, more bullish the token in the short-term. Read more{' '}
                            <a href="https://docs.kyberswap.com/kyberswap-solutions/kyberai/concepts/kyberscore">
                              here ↗
                            </a>
                          </span>
                        }
                        delay={200}
                      >
                        <Info size={10} color={'currentcolor'} display="block" />
                      </SimpleTooltip>
                    </Row>
                  </Column>
                </th>
                <th style={{ textAlign: 'left' }}>
                  <Text>
                    <Trans>Last 3D KyberScores</Trans>
                  </Text>
                </th>
                <th>
                  <Row justify="flex-start">
                    <Trans>Current Price</Trans>
                  </Row>
                </th>
                <th>
                  <Row justify="flex-start">
                    <Trans>Last 7d price</Trans>
                  </Row>
                </th>
                <th>
                  <Row justify="flex-start">
                    <Trans>
                      {{
                        [KyberAIListType.TOP_CEX_INFLOW]: '24h Netflow',
                        [KyberAIListType.TOP_CEX_OUTFLOW]: '24h Netflow',
                      }[listType as string] || '24h Volume'}
                    </Trans>
                  </Row>
                </th>
                {[
                  KyberAIListType.TOP_CEX_INFLOW,
                  KyberAIListType.TOP_CEX_OUTFLOW,
                  KyberAIListType.TRENDING_SOON,
                ].includes(listType) && (
                  <th>
                    <Row justify="flex-start">
                      <Trans>
                        {{
                          [KyberAIListType.TOP_CEX_INFLOW]: '3D Netflow',
                          [KyberAIListType.TOP_CEX_OUTFLOW]: '3D Netflow',
                          [KyberAIListType.TRENDING_SOON]: 'First Discovered On',
                        }[listType as string] || ''}
                      </Trans>
                      {/* {sortedColumn === SORT_FIELD.VOLUME ? (
                          !sortDirection ? (
                            <ArrowUp size="12" style={{ marginLeft: '2px' }} />
                          ) : (
                            <ArrowDown size="12" style={{ marginLeft: '2px' }} />
                          )
                        ) : (
                          ''
                        )} */}
                    </Row>
                  </th>
                )}
                <th style={{ textAlign: 'end' }}>
                  <Trans>Action</Trans>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonTheme
                  baseColor={theme.border}
                  height="28px"
                  borderRadius="8px"
                  direction="ltr"
                  duration={1.5}
                  highlightColor={theme.tabActive}
                >
                  <LoadingRowSkeleton
                    hasExtraCol={[
                      KyberAIListType.TOP_CEX_INFLOW,
                      KyberAIListType.TOP_CEX_OUTFLOW,
                      KyberAIListType.TRENDING_SOON,
                    ].includes(listType)}
                  />
                </SkeletonTheme>
              ) : isError || listData.length === 0 ? (
                <>
                  {above768 ? (
                    <tr>
                      <td
                        colSpan={
                          [
                            KyberAIListType.TOP_CEX_INFLOW,
                            KyberAIListType.TOP_CEX_OUTFLOW,
                            KyberAIListType.TRENDING_SOON,
                          ].includes(listType)
                            ? 9
                            : 8
                        }
                        height={550}
                        style={{ pointerEvents: 'none' }}
                      >
                        <Text>
                          {listType === KyberAIListType.MYWATCHLIST && listData.length === 0 ? (
                            <Trans>You haven&apos;t added any tokens to your watchlist yet</Trans>
                          ) : (
                            <Trans>There was an error. Please try again later.</Trans>
                          )}
                        </Text>
                      </td>
                    </tr>
                  ) : (
                    <tr style={{ height: '201px' }}>
                      <Row
                        style={{
                          position: 'absolute',
                          height: '200px',
                          justifyContent: 'center',
                          backgroundColor: theme.background,
                          width: '100vw',
                        }}
                      >
                        <Text>
                          {listType === KyberAIListType.MYWATCHLIST && listData.length === 0 ? (
                            <Trans>You haven&apos;t added any tokens to your watchlist yet</Trans>
                          ) : (
                            <Trans>There was an error. Please try again later.</Trans>
                          )}
                        </Text>
                      </Row>
                    </tr>
                  )}
                </>
              ) : (
                listData.map((token: ITokenList, index: number) => (
                  <TokenRow
                    token={token}
                    key={token.SourceTokenID + '_' + (pageSize * (page - 1) + index + 1)}
                    currentTab={listType}
                    index={pageSize * (page - 1) + index + 1}
                    isScrolling={isScrolling}
                    listType={listType}
                  />
                ))
              )}
            </tbody>
          </Table>
        </TableWrapper>
        <PaginationWrapper>
          {!isError && (
            <Pagination
              totalCount={data?.totalItems || 10}
              pageSize={pageSize}
              currentPage={page}
              onPageChange={(page: number) => {
                window.scroll({ top: 0 })
                handlePageChange(page)
              }}
              style={{ flex: 1 }}
            />
          )}
        </PaginationWrapper>
      </Column>
      <KyberAIShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        content={mobileMode => <TokenAnalysisListShareContent data={data?.data || []} mobileMode={mobileMode} />}
        onShareClick={social =>
          mixpanelHandler(MIXPANEL_TYPE.KYBERAI_SHARE_TOKEN_CLICK, {
            token_name: 'share_list_token',
            network: chain,
            source: KYBERAI_LISTYPE_TO_MIXPANEL[listType],
            share_via: social,
          })
        }
      />
      <FeedbackSurvey />
    </>
  )
}
