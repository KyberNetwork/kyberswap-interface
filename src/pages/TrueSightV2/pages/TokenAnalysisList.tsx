import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { ArrowDown, ArrowRight, ArrowUp, Share2, Star } from 'react-feather'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useToggleModal } from 'state/application/hooks'

import NetworkSelect from '../components/NetworkSelect'
import SmallKyberScoreMeter from '../components/SmallKyberScoreMeter'
import TokenChart from '../components/TokenChartSVG'
import KyberScoreChart from '../components/chart/KyberScoreChart'
import { TOKEN_LIST } from '../hooks/sampleData'
import { useTokenListQuery } from '../hooks/useTruesightV2Data'
import { TokenListTab } from '../types'

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
    height: 72px;
    font-size: 14px;
    content-visibility: auto;
    contain-intrinsic-height: 72px;
    border-radius: 0;
    cursor: pointer;
    transition: background-color 0.1s linear;
    ${({ theme }) => css`
      background-color: ${theme.background};
      color: ${theme.text};
      border-bottom: 1px solid ${theme.border};

      :hover {
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
      left: 34px;
    }
  }
`

const ActionButton = styled.button<{ color: string }>`
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
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

const tokenTypeList: { type: TokenListTab; icon?: string; tooltip?: (theme: DefaultTheme) => ReactNode }[] = [
  { type: TokenListTab.All },
  { type: TokenListTab.MyWatchlist, icon: 'star' },
  {
    type: TokenListTab.Bullish,
    icon: 'bullish',
    tooltip: theme => (
      <span>
        Tokens with the highest chance of price <span style={{ color: theme.text }}>increase</span> in the next 24H
        (highest KyberScore)
      </span>
    ),
  },
  {
    type: TokenListTab.Bearish,
    icon: 'bearish',
    tooltip: theme => (
      <span>
        Tokens with the highest chance of price <span style={{ color: theme.text }}>decrease</span> in the next 24H
        (lowest KyberScore)
      </span>
    ),
  },
  {
    type: TokenListTab.TopInflow,
    icon: 'download',
    tooltip: theme => (
      <span>
        Tokens with the highest <span style={{ color: theme.text }}>deposits</span> to Centralized Exchanges over the
        last 3 Days. Possible incoming sell pressure
      </span>
    ),
  },
  {
    type: TokenListTab.TopOutflow,
    icon: 'upload',
    tooltip: theme => (
      <span>
        Tokens with the highest <span style={{ color: theme.text }}>withdrawals</span> from Centralized Exchanges over
        the last 3 Days. Possible buy pressure
      </span>
    ),
  },
  {
    type: TokenListTab.TopTraded,
    icon: 'coin-bag',
    tooltip: theme => (
      <span>
        Tokens with the <span style={{ color: theme.text }}>highest 24H trading volume</span>
      </span>
    ),
  },
  {
    type: TokenListTab.TrendingSoon,
    icon: 'trending-soon',
    tooltip: theme => (
      <span>
        Tokens that could be <span style={{ color: theme.text }}>trending</span> in the near future. Trending indicates
        interest in a token - it doesnt imply bullishness or bearishness
      </span>
    ),
  },
  {
    type: TokenListTab.CurrentlyTrending,
    icon: 'flame',
    tooltip: theme => (
      <span>
        Tokens that are <span style={{ color: theme.text }}>currently trending</span> in the market
      </span>
    ),
  },
]

const TokenListDraggableTabs = ({ tab, setTab }: { tab: TokenListTab; setTab: (type: TokenListTab) => void }) => {
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
        {tokenTypeList.map(({ type, icon, tooltip }, index) => {
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
              <MouseoverTooltip key={type} text={tooltip?.(theme)} placement="top" opacity={1} delay={1500}>
                <ButtonTypeActive {...props} ref={el => (tabListRef.current[index] = el)}>
                  {icon && <Icon id={icon} size={16} />}
                  {type}
                </ButtonTypeActive>
              </MouseoverTooltip>
            )
          } else {
            return (
              <MouseoverTooltip key={type} text={tooltip?.(theme)} placement="top" opacity={1} delay={1500}>
                <ButtonTypeInactive key={type} {...props} ref={el => (tabListRef.current[index] = el)}>
                  {icon && <Icon id={icon} size={16} />}
                  {type}
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

enum SORT_FIELD {
  NAME = 'name',
  PRICE = 'price',
  VOLUME = 'volume',
  KYBERSCORE = 'kyberscore',
}

enum SORT_DIRECTION {
  ASC = 'asc',
  DESC = 'desc',
}

const MenuDropdown = styled(RowFit)`
  position: absolute;
  top: 42px;
  right: 0;
  transform: translateY(-10px);
  transition: transform 0.1s ease, visibility 0.1s ease, opacity 0.1s ease;
  visibility: hidden;
  background-color: ${({ theme }) => theme.tableHeader};
  padding: 8px;
  opacity: 0;
  border-radius: 4px;
  z-index: 100;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.32);
  &.show {
    transform: translateY(0);
    visibility: visible;
    opacity: 1;
  }
`

const ChainIcon = styled.div`
  border-radius: 50%;
  background-color: ${({ theme }) => theme.tableHeader};
  padding: 6px;
  :hover {
    filter: brightness(1.2);
  }
`

const TokenRow = ({ token, currentTab }: { token: any; currentTab: TokenListTab }) => {
  const navigate = useNavigate()
  const theme = useTheme()
  const [showMenu, setShowMenu] = useState(false)
  const [menuLeft, setMenuLeft] = useState<number | undefined>(undefined)

  const rowRef = useRef<HTMLTableRowElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useOnClickOutside(rowRef, () => setShowMenu(false))
  const handleRowClick = (e: any) => {
    const left = e.clientX - (rowRef.current?.getBoundingClientRect()?.left || 0)
    const rowWidth = rowRef.current?.getBoundingClientRect()?.width || 0
    const menuWidth = menuRef.current?.getBoundingClientRect()?.width || 0
    if (left !== undefined) {
      setMenuLeft(Math.min(left, rowWidth - menuWidth))
      setShowMenu(true)
    }
  }
  return (
    <tr key={token.id} ref={rowRef} onClick={handleRowClick} style={{ position: 'relative' }}>
      <td>
        <RowFit>
          <Star size={16} style={{ marginRight: '6px', cursor: 'pointer' }} /> {token.id}
        </RowFit>
      </td>
      <td>
        <Row gap="8px">
          <div style={{ position: 'relative', width: '36px', height: '36px' }}>
            <img
              alt="tokenInList"
              src="https://cryptologos.cc/logos/thumbs/kyber-network-crystal-v2.png?v=023"
              width="36px"
              height="36px"
            />
          </div>

          <Column
            gap="8px"
            style={{ cursor: 'pointer', alignItems: 'flex-start' }}
            onClick={() => navigate(APP_PATHS.KYBERAI_EXPLORE)}
          >
            <Text>{token.symbol}</Text>{' '}
            <RowFit gap="6px" color={theme.text}>
              <Icon id="eth-mono" size={12} title="Ethereum" />
              <Icon id="bnb-mono" size={12} title="Binance" />
              <Icon id="ava-mono" size={12} title="Avalance" />
              <Icon id="matic-mono" size={12} title="Polygon" />
              <Icon id="arbitrum-mono" size={12} title="Arbitrum" />
              <Icon id="fantom-mono" size={12} title="Fantom" />
              <Icon id="optimism-mono" size={12} title="Optimism" />
            </RowFit>
          </Column>
        </Row>
      </td>
      <td>
        <Column style={{ alignItems: 'center', width: 'fit-content' }}>
          <SmallKyberScoreMeter value={currentTab === TokenListTab.Bearish ? 20 : 88} />
          <Text color={theme.primary} fontSize="14px" fontWeight={500}>
            {currentTab === TokenListTab.Bearish ? 'Very Bearish' : 'Very Bullish'}
          </Text>
        </Column>
      </td>
      <td>
        <KyberScoreChart />
      </td>
      <td>
        <Column gap="10px" style={{ textAlign: 'left' }}>
          <Text>${token.price}</Text>
          <Text fontSize={12} color={theme.primary}>
            +{token.change}
          </Text>
        </Column>
      </td>
      <td style={{ textAlign: 'start' }}>
        <TokenChart isBearish={currentTab === TokenListTab.Bearish} />
      </td>
      <td style={{ textAlign: 'start' }}>
        <Text>${token['24hVolume'] || '--'}</Text>
      </td>
      {[TokenListTab.TopInflow, TokenListTab.TopOutflow, TokenListTab.TrendingSoon].includes(currentTab) && (
        <td style={{ textAlign: 'start' }}>
          <Text>${token['24hVolume'] || '--'}</Text>
        </td>
      )}
      <td>
        <Row gap="4px" justify={'flex-end'}>
          <ActionButton color={theme.subText} title={t`View Pools`}>
            <Icon id="liquid" size={16} />
          </ActionButton>
          <ActionButton color={theme.subText} title={t`Swap`}>
            <Icon id="swap" size={16} />
          </ActionButton>
          <ActionButton
            color={theme.primary}
            onClick={e => {
              e.stopPropagation()
              setMenuLeft(undefined)
              setShowMenu(true)
            }}
            title={t`Explore`}
          >
            <Icon id="truesight-v2" size={16} />
          </ActionButton>
          <MenuDropdown
            className={showMenu ? 'show' : ''}
            gap="8px"
            color={theme.text}
            style={{ left: menuLeft !== undefined ? `${menuLeft}px` : undefined }}
            ref={menuRef}
          >
            <ChainIcon
              onClick={() => {
                navigate(APP_PATHS.KYBERAI_EXPLORE)
              }}
            >
              <Icon id="eth-mono" size={20} title="Ethereum" />
            </ChainIcon>
            <ChainIcon
              onClick={() => {
                navigate(APP_PATHS.KYBERAI_EXPLORE)
              }}
            >
              <Icon id="bnb-mono" size={20} title="Binance" />
            </ChainIcon>
            <ChainIcon
              onClick={() => {
                navigate(APP_PATHS.KYBERAI_EXPLORE)
              }}
            >
              <Icon id="ava-mono" size={20} title="Avalance" />
            </ChainIcon>
            <ChainIcon
              onClick={() => {
                navigate(APP_PATHS.KYBERAI_EXPLORE)
              }}
            >
              <Icon id="matic-mono" size={20} title="Polygon" />
            </ChainIcon>
            <ChainIcon
              onClick={() => {
                navigate(APP_PATHS.KYBERAI_EXPLORE)
              }}
            >
              <Icon id="arbitrum-mono" size={20} title="Arbitrum" />
            </ChainIcon>
            <ChainIcon
              onClick={() => {
                navigate(APP_PATHS.KYBERAI_EXPLORE)
              }}
            >
              <Icon id="fantom-mono" size={20} title="Fantom" />
            </ChainIcon>
            <ChainIcon
              onClick={() => {
                navigate(APP_PATHS.KYBERAI_EXPLORE)
              }}
            >
              <Icon id="optimism-mono" size={20} title="Optimism" />
            </ChainIcon>
          </MenuDropdown>
        </Row>
      </td>
    </tr>
  )
}
export default function TokenAnalysisList() {
  const theme = useTheme()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [currentTab, setCurrentTab] = useState(TokenListTab.All)
  const [networkFilter, setNetworkFilter] = useState<ChainId>()
  const toggle = useToggleModal(ApplicationModal.SHARE)
  const { data } = useTokenListQuery({})
  console.log('🚀 ~ file: TokenAnalysisList.tsx:623 ~ TokenAnalysisList ~ data:', data)
  const above768 = useMedia('(min-width:768px)')

  const [searchParams, setSearchParams] = useSearchParams()
  const sortedColumn = searchParams.get('orderBy') || SORT_FIELD.VOLUME
  const sortOrder = searchParams.get('orderDirection') || SORT_DIRECTION.DESC
  const sortDirection = sortOrder === SORT_DIRECTION.DESC

  const templateList = useMemo(
    () =>
      [...Array(5)]
        .reduce((t, a) => t.concat(TOKEN_LIST.tokenList.data), [])
        .map((t: any, index: number) => {
          return { ...t, id: index + 1 }
        }) || [],
    [],
  )

  const pageSize = 50

  const handleSort = (field: SORT_FIELD) => {
    const direction =
      sortedColumn !== field
        ? SORT_DIRECTION.DESC
        : sortOrder === SORT_DIRECTION.DESC
        ? SORT_DIRECTION.ASC
        : SORT_DIRECTION.DESC

    searchParams.set('orderDirection', direction)
    searchParams.set('orderBy', field)
    setSearchParams(searchParams)
  }

  return (
    <>
      <Row justify="flex-end">
        <ButtonGray width="fit-content" height="30px" onClick={() => navigate(APP_PATHS.KYBERAI_EXPLORE)}>
          <Text fontSize={14} display="flex" alignItems="center">
            Static UI <ArrowRight size={14} />
          </Text>
        </ButtonGray>
      </Row>
      <Row gap="16px" justify="center" flexWrap={above768 ? 'nowrap' : 'wrap'}>
        <TokenListDraggableTabs tab={currentTab} setTab={setCurrentTab} />
      </Row>
      <RowBetween>
        <Column gap="8px">
          <Text fontSize="12px" color={theme.subText} fontWeight={500}>
            <Trans>
              Rankings will refresh in <Icon id="timer" size={12} style={{ display: 'inline-block', height: '10px' }} />{' '}
              04:39
            </Trans>
          </Text>
          <Text fontSize="10px" color={theme.subText} fontStyle="italic">
            <Trans>Disclaimer: The information here should not be treated as any form of financial advice</Trans>
          </Text>
        </Column>
        <RowFit gap="12px">
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
          <NetworkSelect filter={networkFilter} setFilter={setNetworkFilter} />
        </RowFit>
      </RowBetween>
      <Column gap="0px">
        <TableWrapper>
          <div>
            <Table>
              <colgroup>
                <col style={{ width: '35px' }} />
                <col style={{ width: '290px', minWidth: '200px' }} />
                <col style={{ width: '230px', minWidth: 'auto' }} />
                <col style={{ width: '230px', minWidth: 'auto' }} />
                <col style={{ width: '250px', minWidth: 'auto' }} />
                <col style={{ width: '250px', minWidth: 'auto' }} />
                {[TokenListTab.TopInflow, TokenListTab.TopOutflow, TokenListTab.TrendingSoon].includes(currentTab) && (
                  <col style={{ width: '150px', minWidth: 'auto' }} />
                )}
                <col style={{ width: '150px', minWidth: 'auto' }} />

                <col style={{ width: '200px', minWidth: 'auto' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>#</th>
                  <th style={{ textAlign: 'left' }} onClick={() => handleSort(SORT_FIELD.NAME)}>
                    <Row>
                      <Trans>Token name</Trans>
                      {sortedColumn === SORT_FIELD.NAME ? (
                        !sortDirection ? (
                          <ArrowUp size="12" style={{ marginLeft: '2px' }} />
                        ) : (
                          <ArrowDown size="12" style={{ marginLeft: '2px' }} />
                        )
                      ) : (
                        ''
                      )}
                    </Row>
                  </th>
                  <th style={{ textAlign: 'left' }} onClick={() => handleSort(SORT_FIELD.KYBERSCORE)}>
                    <Column gap="4px">
                      <Row justify="flex-start">
                        <Trans>Kyberscore</Trans>{' '}
                        {sortedColumn === SORT_FIELD.KYBERSCORE ? (
                          !sortDirection ? (
                            <ArrowUp size="12" style={{ marginLeft: '2px' }} />
                          ) : (
                            <ArrowDown size="12" style={{ marginLeft: '2px' }} />
                          )
                        ) : (
                          ''
                        )}
                        <InfoHelper
                          placement="top"
                          width="300px"
                          size={12}
                          text={
                            <span>
                              KyberScore uses AI to measure the upcoming trend of a token (bullish or bearish) by taking
                              into account multiple on-chain and off-chain indicators. The score ranges from 0 to 100.
                              Higher the score, more bullish the token in the short-term. Read more{' '}
                              <a href="http://docs.kyberswap.com/">here ↗</a>
                            </span>
                          }
                        />
                      </Row>
                      <Text fontSize="10px" style={{ textTransform: 'none' }}>
                        <Trans>At 08:00 AM</Trans>
                      </Text>
                    </Column>
                  </th>
                  <th style={{ textAlign: 'left' }}>
                    <Text>
                      <Trans>Last 3D KyberScores</Trans>
                    </Text>
                  </th>
                  <th onClick={() => handleSort(SORT_FIELD.PRICE)}>
                    <Row justify="flex-start">
                      <Trans>Current Price</Trans>
                      {sortedColumn === SORT_FIELD.PRICE ? (
                        !sortDirection ? (
                          <ArrowUp size="12" style={{ marginLeft: '2px' }} />
                        ) : (
                          <ArrowDown size="12" style={{ marginLeft: '2px' }} />
                        )
                      ) : (
                        ''
                      )}
                    </Row>
                  </th>
                  <th>
                    <Row justify="flex-start">
                      <Trans>Last 7d price</Trans>
                    </Row>
                  </th>
                  <th onClick={() => handleSort(SORT_FIELD.VOLUME)}>
                    <Row justify="flex-start">
                      <Trans>
                        {{
                          [TokenListTab.TopInflow]: '24h Inflow',
                          [TokenListTab.TopOutflow]: '24h Outflow',
                        }[currentTab as string] || '24h Volume'}
                      </Trans>
                      {sortedColumn === SORT_FIELD.VOLUME ? (
                        !sortDirection ? (
                          <ArrowUp size="12" style={{ marginLeft: '2px' }} />
                        ) : (
                          <ArrowDown size="12" style={{ marginLeft: '2px' }} />
                        )
                      ) : (
                        ''
                      )}
                    </Row>
                  </th>
                  {[TokenListTab.TopInflow, TokenListTab.TopOutflow, TokenListTab.TrendingSoon].includes(
                    currentTab,
                  ) && (
                    <th>
                      <Row justify="flex-start">
                        <Trans>
                          {{
                            [TokenListTab.TopInflow]: '3D Inflow',
                            [TokenListTab.TopOutflow]: '3D Outflow',
                            [TokenListTab.TrendingSoon]: 'First Discovered On',
                          }[currentTab as string] || ''}
                        </Trans>
                        {sortedColumn === SORT_FIELD.VOLUME ? (
                          !sortDirection ? (
                            <ArrowUp size="12" style={{ marginLeft: '2px' }} />
                          ) : (
                            <ArrowDown size="12" style={{ marginLeft: '2px' }} />
                          )
                        ) : (
                          ''
                        )}
                      </Row>
                    </th>
                  )}
                  <th style={{ textAlign: 'end' }}>
                    <Trans>Action</Trans>
                  </th>
                </tr>
              </thead>

              <tbody>
                {templateList.slice((page - 1) * pageSize, page * pageSize).map((token: any, index: number) => (
                  <TokenRow token={token} key={index} currentTab={currentTab} />
                ))}
              </tbody>
            </Table>
          </div>
        </TableWrapper>
        <PaginationWrapper>
          <Pagination
            totalCount={templateList.length}
            pageSize={pageSize}
            currentPage={page}
            onPageChange={(page: number) => {
              window.scroll({ top: 0 })
              setPage(page)
            }}
            style={{ flex: 1 }}
          />
        </PaginationWrapper>
      </Column>
      <ShareModal title={t`Share this token list with your friends!`} />
    </>
  )
}
