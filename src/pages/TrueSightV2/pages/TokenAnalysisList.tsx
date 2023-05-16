import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { rgba } from 'polished'
import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Share2 } from 'react-feather'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { useGesture } from 'react-use-gesture'
import { Text } from 'rebass'
import styled, { DefaultTheme, css } from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { ButtonGray, ButtonLight, ButtonOutlined } from 'components/Button'
import Column from 'components/Column'
import Icon from 'components/Icons/Icon'
import InfoHelper from 'components/InfoHelper'
import Pagination from 'components/Pagination'
import Row, { RowBetween, RowFit } from 'components/Row'
import ShareModal from 'components/ShareModal'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useToggleModal } from 'state/application/hooks'

import ChevronIcon from '../components/ChevronIcon'
import MultipleChainDropdown from '../components/MultipleChainDropdown'
import NetworkSelect from '../components/NetworkSelect'
import SimpleTooltip from '../components/SimpleTooltip'
import SmallKyberScoreMeter from '../components/SmallKyberScoreMeter'
import TokenChart from '../components/TokenChartSVG'
import { StarWithAnimation } from '../components/WatchlistStar'
import KyberScoreChart from '../components/chart/KyberScoreChart'
import { SUPPORTED_NETWORK_KYBERAI } from '../constants'
import { useAddToWatchlistMutation, useRemoveFromWatchlistMutation, useTokenListQuery } from '../hooks/useKyberAIData'
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
    margin-left: -24px;
    margin-right: -24px;
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
    margin-left: -24px;
    margin-right: -24px;
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
      left: 0px;
    }
    td:nth-child(2),
    th:nth-child(2) {
      left: 50px;
    }
  }
`

const ActionButton = styled.button<{ color: string }>`
  width: 32px;
  height: 32px;
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
`

const TabWrapper = styled.div`
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
  width: fit-content;
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
  width: fit-content;
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

const tokenTypeList: {
  type: KyberAIListType
  icon?: string
  tooltip?: (theme: DefaultTheme) => ReactNode
  title: string
}[] = [
  { type: KyberAIListType.ALL, title: t`All` },
  { type: KyberAIListType.MYWATCHLIST, icon: 'star', title: t`My Watchlist` },
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
    title: t`Top CEX Inflow`,
    icon: 'download',
    tooltip: theme => (
      <span>
        Tokens with the highest <span style={{ color: theme.text }}>deposits</span> to Centralized Exchanges over the
        last 3 Days. Possible incoming sell pressure
      </span>
    ),
  },
  {
    type: KyberAIListType.TOP_CEX_OUTFLOW,
    title: t`Top CEX Outflow`,
    icon: 'upload',
    tooltip: theme => (
      <span>
        Tokens with the highest <span style={{ color: theme.text }}>withdrawals</span> from Centralized Exchanges over
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
  const [showScrollRightButton, setShowScrollRightButton] = useState(false)
  const [scrollLeftValue, setScrollLeftValue] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const tabListRef = useRef<HTMLDivElement[]>([])

  const bind = useGesture({
    onDrag: state => {
      if (isMobile || !wrapperRef.current) return
      //state.event?.preventDefault()
      if (wrapperRef.current?.scrollLeft !== undefined && state.dragging) {
        wrapperRef.current.classList.add('no-scroll')
        wrapperRef.current.scrollLeft -= state.values?.[0] - state.previous?.[0] || 0
      }
      if (!state.dragging) {
        setScrollLeftValue(wrapperRef.current.scrollLeft)
        wrapperRef.current.classList.remove('no-scroll')
      }
    },
  })
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
      <TabWrapper ref={wrapperRef} onScrollCapture={e => e.preventDefault()} {...bind()}>
        {tokenTypeList.map(({ type, title, icon, tooltip }, index) => {
          const props = {
            onClick: () => {
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
              <MouseoverTooltip key={type} text={tooltip?.(theme)} placement="top" opacity={1} delay={500}>
                <ButtonTypeActive {...props} ref={el => (tabListRef.current[index] = el)}>
                  {icon && <Icon id={icon} size={16} />}
                  {title}
                </ButtonTypeActive>
              </MouseoverTooltip>
            )
          } else {
            return (
              <MouseoverTooltip key={type} text={tooltip?.(theme)} placement="top" opacity={1} delay={500}>
                <ButtonTypeInactive key={type} {...props} ref={el => (tabListRef.current[index] = el)}>
                  {icon && <Icon id={icon} size={16} />}
                  {title}
                </ButtonTypeInactive>
              </MouseoverTooltip>
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

// enum SORT_FIELD {
//   NAME = 'name',
//   PRICE = 'price',
//   VOLUME = 'volume',
//   KYBERSCORE = 'kyberscore',
// }

// enum SORT_DIRECTION {
//   ASC = 'asc',
//   DESC = 'desc',
// }

const TokenRow = ({ token, currentTab, index }: { token: ITokenList; currentTab: KyberAIListType; index: number }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { account } = useActiveWeb3React()
  const theme = useTheme()
  const [showMenu, setShowMenu] = useState(false)
  const [showSwapMenu, setShowSwapMenu] = useState(false)
  const [menuLeft, setMenuLeft] = useState<number | undefined>(undefined)
  const [addToWatchlist] = useAddToWatchlistMutation()
  const [removeFromWatchlist] = useRemoveFromWatchlistMutation()
  const [isWatched, setIsWatched] = useState(false)
  const [loadingStar, setLoadingStar] = useState(false)
  const rowRef = useRef<HTMLTableRowElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useOnClickOutside(rowRef, () => setShowMenu(false))
  useOnClickOutside(rowRef, () => setShowSwapMenu(false))

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

  const handleWatchlistClick = (e: any) => {
    e.stopPropagation()
    if (!account) return
    setLoadingStar(true)
    if (isWatched) {
      Promise.all(
        token.tokens.map(t => removeFromWatchlist({ wallet: account, tokenAddress: t.address, chain: t.chain })),
      ).then(() => {
        setIsWatched(false)
        setLoadingStar(false)
      })
    } else {
      Promise.all(
        token.tokens.map(t => addToWatchlist({ wallet: account, tokenAddress: t.address, chain: t.chain })),
      ).then(() => {
        setIsWatched(true)
        setLoadingStar(false)
      })
    }
  }

  useEffect(() => {
    setIsWatched(token.isWatched)
  }, [token.isWatched])

  const latestKyberScore: IKyberScoreChart | undefined = token?.ks_3d?.[token.ks_3d.length - 1]
  return (
    <tr key={token.sourceTokenId} ref={rowRef} onClick={handleRowClick} style={{ position: 'relative' }}>
      <td>
        <RowFit style={{ width: '30px' }} gap="6px">
          {
            <SimpleTooltip text={isWatched ? t`Remove from watchlist` : t`Add to watchlist`}>
              <StarWithAnimation watched={isWatched} loading={loadingStar} onClick={handleWatchlistClick} />
            </SimpleTooltip>
          }{' '}
          {index}
        </RowFit>
      </td>
      <td>
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
              {token.tokens.map(item => {
                if (item.chain === 'ethereum') return <Icon id="eth-mono" size={12} title="Ethereum" />
                if (item.chain === 'bsc') return <Icon id="bnb-mono" size={12} title="Binance" />
                if (item.chain === 'avalanche') return <Icon id="ava-mono" size={12} title="Avalanche" />
                if (item.chain === 'polygon') return <Icon id="matic-mono" size={12} title="Polygon" />
                if (item.chain === 'arbitrum') return <Icon id="arbitrum-mono" size={12} title="Arbitrum" />
                if (item.chain === 'fantom') return <Icon id="fantom-mono" size={12} title="Fantom" />
                if (item.chain === 'optimism') return <Icon id="optimism-mono" size={12} title="Optimism" />
                return <></>
              })}
            </RowFit>
          </Column>
        </Row>
      </td>
      <td>
        <Column style={{ alignItems: 'center', width: '110px' }}>
          <SmallKyberScoreMeter data={latestKyberScore} tokenName={token.symbol} />
          <Text
            color={calculateValueToColor(latestKyberScore?.kyber_score || 0, theme)}
            fontSize="14px"
            fontWeight={500}
          >
            {latestKyberScore?.tag || 'Not Available'}
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
          ? formatLocaleStringNum(token.cex_inflow_24h) || '--'
          : currentTab === KyberAIListType.TOP_CEX_OUTFLOW
          ? formatLocaleStringNum(token.cex_outflow_24h) || '--'
          : formatLocaleStringNum(token.volume_24h) || '--'}
      </td>
      {[KyberAIListType.TOP_CEX_INFLOW, KyberAIListType.TOP_CEX_OUTFLOW, KyberAIListType.TRENDING_SOON].includes(
        currentTab,
      ) && (
        <td style={{ textAlign: 'start' }}>
          {currentTab === KyberAIListType.TOP_CEX_INFLOW
            ? '$' + formatLocaleStringNum(token.cex_inflow_3days) || '--'
            : currentTab === KyberAIListType.TOP_CEX_OUTFLOW
            ? '$' + formatLocaleStringNum(token.cex_outflow_3days) || '--'
            : currentTab === KyberAIListType.TRENDING_SOON
            ? token.discovered_on
              ? dayjs(token.discovered_on * 1000).format('DD/MM/YYYY')
              : '--'
            : '--'}
        </td>
      )}
      <td>
        <Row gap="6px" justify={'flex-end'}>
          <SimpleTooltip text={t`Swap`}>
            <ActionButton
              color={theme.subText}
              onClick={e => {
                e.stopPropagation()
                if (hasMutipleChain) {
                  setMenuLeft(undefined)
                  setShowSwapMenu(true)
                } else {
                  navigateToSwapPage(token.tokens[0])
                }
              }}
            >
              <Icon id="swap" size={18} />
            </ActionButton>
          </SimpleTooltip>
          <SimpleTooltip text={t`Explore`}>
            <ActionButton
              color={theme.primary}
              onClick={e => {
                e.stopPropagation()
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
              <Icon id="truesight-v2" size={18} />
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
  const [page, setPage] = useState(1)
  const { account } = useActiveWeb3React()
  const toggle = useToggleModal(ApplicationModal.SHARE)
  const above768 = useMedia('(min-width:768px)')

  const [searchParams, setSearchParams] = useSearchParams()
  const listType = (searchParams.get('listType') as KyberAIListType) || KyberAIListType.BULLISH
  const chain = searchParams.get('chain') || 'all'
  // const sortedColumn = searchParams.get('orderBy') || SORT_FIELD.VOLUME
  // const sortOrder = searchParams.get('orderDirection') || SORT_DIRECTION.DESC
  // const sortDirection = sortOrder === SORT_DIRECTION.DESC
  const pageSize = 25

  const { data, isLoading, isFetching, isError } = useTokenListQuery(
    listType === KyberAIListType.MYWATCHLIST
      ? {
          type: KyberAIListType.ALL,
          chain: (chain && SUPPORTED_NETWORK_KYBERAI[Number(chain) as ChainId]) || 'all',
          page,
          pageSize,
          wallet: account,
          watchlist: true,
        }
      : {
          type: listType,
          chain: (chain && SUPPORTED_NETWORK_KYBERAI[Number(chain) as ChainId]) || 'all',
          page,
          pageSize,
          wallet: account,
        },
  )
  const listData = data?.data || []

  // const handleSort = (field: SORT_FIELD) => {
  //   const direction =
  //     sortedColumn !== field
  //       ? SORT_DIRECTION.DESC
  //       : sortOrder === SORT_DIRECTION.DESC
  //       ? SORT_DIRECTION.ASC
  //       : SORT_DIRECTION.DESC
  //   searchParams.set('orderDirection', direction)
  //   searchParams.set('orderBy', field)
  //   setSearchParams(searchParams)
  // }

  const handleTabChange = (tab: KyberAIListType) => {
    searchParams.set('listType', tab)
    setSearchParams(searchParams)
  }
  const handleChainChange = (chainId?: ChainId) => {
    if (!chainId) {
      searchParams.delete('chain')
    } else {
      searchParams.set('chain', chainId.toString())
    }
    setSearchParams(searchParams)
  }

  useLayoutEffect(() => {
    setPage(1)
  }, [chain, listType])

  return (
    <>
      <Row gap="12px" justify="center" flexWrap={above768 ? 'nowrap' : 'wrap'}>
        <TokenListDraggableTabs tab={listType} setTab={handleTabChange} />
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
            onClick={toggle}
          >
            <Share2 size={16} fill="currentcolor" />
          </ButtonGray>
          <NetworkSelect filter={Number(chain) as ChainId} setFilter={handleChainChange} />
        </RowFit>
      </RowBetween>
      <Column gap="0px">
        <TableWrapper>
          <div>
            <Table>
              <colgroup>
                <col style={{ width: '80px' }} />
                <col style={{ width: '220px', minWidth: '180px' }} />
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
                  <th style={{ textAlign: 'left' }}>
                    <Row>
                      <Trans>Token name</Trans>
                      {/* {sortedColumn === SORT_FIELD.NAME ? (
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
                  <th style={{ textAlign: 'left' }}>
                    <Column gap="4px">
                      <Row justify="flex-start">
                        <Trans>Kyberscore</Trans>{' '}
                        {/* {sortedColumn === SORT_FIELD.KYBERSCORE ? (
                          !sortDirection ? (
                            <ArrowUp size="12" style={{ marginLeft: '2px' }} />
                          ) : (
                            <ArrowDown size="12" style={{ marginLeft: '2px' }} />
                          )
                        ) : (
                          ''
                        )} */}
                        <InfoHelper
                          placement="top"
                          width="300px"
                          size={12}
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
                        />
                      </Row>
                      {/* <Text fontSize="10px" style={{ textTransform: 'none' }}>
                        <Trans>At 08:00 AM</Trans>
                      </Text> */}
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
                      {/* {sortedColumn === SORT_FIELD.PRICE ? (
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
                  <th>
                    <Row justify="flex-start">
                      <Trans>Last 7d price</Trans>
                    </Row>
                  </th>
                  <th>
                    <Row justify="flex-start">
                      <Trans>
                        {{
                          [KyberAIListType.TOP_CEX_INFLOW]: '24h Inflow',
                          [KyberAIListType.TOP_CEX_OUTFLOW]: '24h Outflow',
                        }[listType as string] || '24h Volume'}
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
                  {[
                    KyberAIListType.TOP_CEX_INFLOW,
                    KyberAIListType.TOP_CEX_OUTFLOW,
                    KyberAIListType.TRENDING_SOON,
                  ].includes(listType) && (
                    <th>
                      <Row justify="flex-start">
                        <Trans>
                          {{
                            [KyberAIListType.TOP_CEX_INFLOW]: '3D Inflow',
                            [KyberAIListType.TOP_CEX_OUTFLOW]: '3D Outflow',
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
                {isLoading || isFetching ? (
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
                ) : isError ? (
                  <>
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
                        height={200}
                      >
                        <Text>
                          <Trans>There was an error. Please try again later.</Trans>
                        </Text>
                      </td>
                    </tr>
                  </>
                ) : (
                  listData.map((token: ITokenList, index: number) => (
                    <TokenRow
                      token={token}
                      key={token.sourceTokenId}
                      currentTab={listType}
                      index={pageSize * (page - 1) + index + 1}
                    />
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </TableWrapper>
        <PaginationWrapper>
          {!isError && (
            <Pagination
              totalCount={data?.totalItems || 10}
              pageSize={pageSize}
              currentPage={page}
              onPageChange={(page: number) => {
                window.scroll({ top: 0 })
                setPage(page)
              }}
              style={{ flex: 1 }}
            />
          )}
        </PaginationWrapper>
      </Column>
      <ShareModal title={t`Share this token list with your friends!`} />
    </>
  )
}
