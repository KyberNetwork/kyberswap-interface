import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useEffectOnce, useMedia } from 'react-use'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import Column from 'components/Column'
import Icon from 'components/Icons/Icon'
import AnimatedLoader from 'components/Loader/AnimatedLoader'
import Pagination from 'components/Pagination'
import Row, { RowFit } from 'components/Row'
import TabDraggable, { TabITem } from 'components/Section/TabDraggable'
import { APP_PATHS, SORT_DIRECTION } from 'constants/index'
import { MIXPANEL_TYPE, useMixpanelKyberAI } from 'hooks/useMixpanel'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import { StyledSectionWrapper } from 'pages/TrueSightV2/components'
import TokenFilter from 'pages/TrueSightV2/components/TokenFilter'
import { MEDIA_WIDTHS } from 'theme'

import FeedbackSurvey from '../components/FeedbackSurvey'
import KyberAIShareModal from '../components/KyberAIShareModal'
import MultipleChainDropdown from '../components/MultipleChainDropdown'
import SimpleTooltip from '../components/SimpleTooltip'
import WatchlistButton from '../components/WatchlistButton'
import TokenAnalysisListShareContent from '../components/shareContent/TokenAnalysisListShareContent'
import { DEFAULT_PARAMS_BY_TAB, KYBERAI_LISTYPE_TO_MIXPANEL, SORT_FIELD, Z_INDEX_KYBER_AI } from '../constants'
import { useTokenListQuery } from '../hooks/useKyberAIData'
import useRenderRankingList from '../hooks/useRenderRankingList'
import { IKyberScoreChart, ITokenList, KyberAIListType } from '../types'
import { navigateToSwapPage, useFormatParamsFromUrl } from '../utils'

const SIZE_MOBILE = '1080px'

const TradeInfoWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
   flex-direction: column;
  `}
`

const ListTokenWrapper = styled(StyledSectionWrapper)`
  min-height: 700px;
  height: fit-content;
  padding: 0;
  background: ${({ theme }) => theme.background};
  @media only screen and (max-width: ${SIZE_MOBILE}) {
    margin-left: -16px;
    margin-right: -16px;
    border-left: 0;
    border-right: 0;
  }
`

const TableWrapper = styled.div`
  border-radius: 20px 20px 0 0;
  padding: 0;
  font-size: 12px;
  border-bottom: none;
  transition: all 0.15s ease;
  overflow: hidden;
  @media only screen and (max-width: ${SIZE_MOBILE}) {
    border-radius: 0px;
    border: none;
    overflow-x: scroll;
    min-height: 250px;
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
  @media only screen and (max-width: ${SIZE_MOBILE}) {
    margin-left: -16px;
    margin-right: -16px;
    border-radius: 0px;
    border: none;
  }
`

const TableHeaderCell = styled.th<{ sortable?: boolean }>`
  border: none;
  outline: none;
  white-space: nowrap;
  font-weight: 400 !important;
  color: ${({ theme }) => theme.subText} !important;
  font-size: 12px;
  background-color: ${({ theme }) => theme.tableHeader};
  ${({ sortable }) =>
    sortable &&
    css`
      cursor: pointer;
      :hover {
        color: ${({ theme }) => theme.text} !important;
      }
    `}
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
    z-index: ${Z_INDEX_KYBER_AI.HEADER_TABLE_TOKENS};
    border-radius: 19px 19px 0 0;

    ${({ theme }) => css`
      background-color: ${theme.tableHeader};
      color: ${theme.subText};
    `};

    tr {
      height: 48px;
      cursor: default !important;
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
      z-index: ${Z_INDEX_KYBER_AI.TOKEN_NAME_TABLE_COLUMN};
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

const LoadingWrapper = styled(Row)`
  position: absolute;
  inset: 0 0 0 0;
  background: ${({ theme }) => theme.background};
  opacity: 0.8;
  z-index: ${Z_INDEX_KYBER_AI.LOADING_TOKENS_TABLE};
  border-radius: 20px;
  padding-top: min(25vh, 25%);
  justify-content: center;
  align-items: flex-start;
  box-sizing: border-box;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100vw;
    border-radius: 0;
  `}
`

const tokenTypeList: TabITem<KyberAIListType>[] = [
  { type: KyberAIListType.MYWATCHLIST, icon: 'star', title: t`My Watchlist` },
  { type: KyberAIListType.ALL, title: t`All` },
  {
    type: KyberAIListType.BULLISH,
    title: t`Bullish`,
    icon: 'bullish',
    tooltip: theme => (
      <span>
        Tokens with the highest chance of price <span style={{ color: theme.text }}>increase</span> in the next 24H
        (highest KyberScore).
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
        (lowest KyberScore).
      </span>
    ),
  },
  {
    type: KyberAIListType.KYBERSWAP_DELTA,
    title: t`KyberScore Delta`,
    icon: 'bearish',
    tooltip: theme => (
      <span>
        <Trans>
          Tokens with a <span style={{ color: theme.text }}>significant change in KyberScore</span> between two
          consecutive time periods. This may indicate a change in trend of the token.
        </Trans>
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
        last 3 Days. Possible incoming sell pressure.
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
        the last 3 Days. Possible buy pressure.
      </span>
    ),
  },
  {
    type: KyberAIListType.FUNDING_RATE,
    title: t`Funding Rates`,
    icon: 'coin-bag',
    tooltip: () => (
      <span>
        <Trans>
          Tokens with funding rates on centralized exchanges. Positive funding rate suggests traders are bullish &amp;
          vice-versa for negative rates. Extreme rates may result in leveraged positions getting squeezed.
        </Trans>
      </span>
    ),
  },
  {
    type: KyberAIListType.TOP_TRADED,
    title: t`Top Traded`,
    icon: 'coin-bag',
    tooltip: theme => (
      <span>
        Tokens with the <span style={{ color: theme.text }}>highest 24H trading volume</span>.
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
        interest in a token - it doesnt imply bullishness or bearishness.
      </span>
    ),
  },
  {
    type: KyberAIListType.TRENDING,
    title: t`Currently Trending`,
    icon: 'flame',
    tooltip: theme => (
      <span>
        Tokens that are <span style={{ color: theme.text }}>currently trending</span> in the market.
      </span>
    ),
  },
]

const TokenListDraggableTabs = ({ tab, setTab }: { tab: KyberAIListType; setTab: (type: KyberAIListType) => void }) => {
  const mixpanelHandler = useMixpanelKyberAI()
  const onTabClick = (fromTab: KyberAIListType, toTab: KyberAIListType) => {
    mixpanelHandler(MIXPANEL_TYPE.KYBERAI_RANKING_CATEGORY_CLICK, {
      from_cate: KYBERAI_LISTYPE_TO_MIXPANEL[fromTab],
      to_cate: KYBERAI_LISTYPE_TO_MIXPANEL[toTab],
      source: KYBERAI_LISTYPE_TO_MIXPANEL[fromTab],
    })
  }
  return (
    <TabDraggable<KyberAIListType>
      {...{ activeTab: tab, onChange: setTab, trackingChangeTab: onTabClick, tabs: tokenTypeList }}
    />
  )
}

const TokenRow = React.memo(function TokenRow({
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
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const mixpanelHandler = useMixpanelKyberAI()
  const theme = useTheme()
  const [showSwapMenu, setShowSwapMenu] = useState(false)

  const { renderTableCell } = useRenderRankingList()

  const rowRef = useRef<HTMLTableRowElement>(null)

  useOnClickOutside(rowRef, () => setShowSwapMenu(false))
  const above768 = useMedia(`(min-width:${MEDIA_WIDTHS.upToSmall}px)`)
  const tokens = token.addresses || []
  const hasMutipleChain = tokens.length > 1

  const handleRowClick = () => {
    navigate(`${APP_PATHS.KYBERAI_EXPLORE}/${token.assetId}?chain=${tokens[0].chain}&address=${tokens[0].address}`, {
      state: { from: location },
    })
  }

  return (
    <tr key={token.assetId} ref={rowRef} onClick={handleRowClick} style={{ position: 'relative' }}>
      <td>
        <RowFit gap="6px">
          <WatchlistButton size={above768 ? 20 : 16} assetId={token.assetId} symbol={token.symbol} />
          {above768 ? index : <></>}
        </RowFit>
      </td>
      {renderTableCell({ token, isScrolling, theme, index, currentTab })}
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
                navigate(
                  `${APP_PATHS.KYBERAI_EXPLORE}/${token.assetId}?chain=${tokens[0].chain}&address=${tokens[0].address}`,
                  {
                    state: { from: location },
                  },
                )
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
                  setShowSwapMenu(true)
                } else {
                  navigateToSwapPage(token.addresses[0])
                }
              }}
            >
              <Icon id="swap" size={16} />
            </ActionButton>
          </SimpleTooltip>
          {hasMutipleChain && (
            <>
              <MultipleChainDropdown
                show={showSwapMenu}
                onDismiss={() => setShowSwapMenu(false)}
                tokens={token?.addresses}
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
})
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

const pageSize = 50

export default function TokenAnalysisList() {
  const theme = useTheme()
  const mixpanelHandler = useMixpanelKyberAI()
  const [showShare, setShowShare] = useState(false)
  const [isScrolling, setIsScrolling] = useState(false)
  const [listType, setListType] = useState(KyberAIListType.BULLISH)
  const [, startTransition] = useTransition()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  const above768 = useMedia(`(min-width:${MEDIA_WIDTHS.upToSmall}px)`)

  const { renderCol, renderTableHeader } = useRenderRankingList()

  // sort single for now
  const [sortInfo, setSortInfo] = useState<{ field: SORT_FIELD | undefined; direction: SORT_DIRECTION }>({
    field: undefined,
    direction: SORT_DIRECTION.DESC,
  })

  const onChangeSort = (sortField: SORT_FIELD) => {
    const toggleValue = sortInfo.direction === SORT_DIRECTION.DESC ? SORT_DIRECTION.ASC : SORT_DIRECTION.DESC
    const newDirection = sortField === sortInfo.field ? toggleValue : SORT_DIRECTION.DESC
    setSortInfo({ direction: newDirection, field: sortField })
    searchParams.set('sort', `${sortField}:${newDirection}`)
    setSearchParams(searchParams)
  }

  const [searchParams, setSearchParams] = useSearchParams()
  const { page, listType: listTypeParam, sort, filter } = useFormatParamsFromUrl()

  const queryParams = useMemo(() => {
    return { page, pageSize, sort, ...filter, type: listTypeParam }
  }, [page, listTypeParam, filter, sort])

  const { data, isLoading, isFetching, isError } = useTokenListQuery(queryParams)
  const listData = data?.data || []

  const kyberscoreCalculateAt = useMemo(() => {
    const listData = data?.data || []
    const timestamps = listData.map(token => {
      const latestKyberScore: IKyberScoreChart | undefined = token?.kyberScore3D?.[token.kyberScore3D.length - 1]
      return latestKyberScore?.createdAt || 0
    })
    return Math.max(...timestamps, 0)
  }, [data])

  const setDefaultSortArrow = (tab: KyberAIListType, autoSet = false) => {
    // set default sort state
    const defaultSort = (autoSet ? sort : '') || DEFAULT_PARAMS_BY_TAB[tab]?.sort || ''
    const [field, direction] = defaultSort.split(':')
    setSortInfo({
      direction: (direction as SORT_DIRECTION) || SORT_DIRECTION.DESC,
      field: (field as SORT_FIELD) || undefined,
    })
  }

  useEffectOnce(() => setDefaultSortArrow(listTypeParam, true))

  const handleTabChange = (tab: KyberAIListType) => {
    startTransition(() => {
      const searchParams = new URLSearchParams() // to reset filter/sort
      searchParams.set('listType', tab)
      searchParams.set('page', '1')
      setSearchParams(searchParams)
      setDefaultSortArrow(tab)
    })
  }
  const handleFilterChange = useCallback(
    (filter: Record<string, string>) => {
      Object.entries(filter).forEach(([key, value]) => {
        value === '' || value === undefined ? searchParams.delete(key) : searchParams.set(key, value)
      })
      searchParams.set('page', '1')
      setSearchParams(searchParams)
    },
    [searchParams, setSearchParams],
  )

  const onResetFilterSort = () => handleTabChange(listTypeParam)

  const handlePageChange = (page: number) => {
    searchParams.set('page', page.toString())
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

  const isCexFlowTabs = [
    KyberAIListType.TOP_CEX_INFLOW,
    KyberAIListType.TOP_CEX_OUTFLOW,
    KyberAIListType.TRENDING_SOON,
  ].includes(listType)

  const renderEmptyTokens = () => {
    const msg = (
      <Text>
        {listType === KyberAIListType.MYWATCHLIST && listData.length === 0 && page === 1 ? (
          <Trans>You haven&apos;t added any tokens to your watchlist yet</Trans>
        ) : isError ? (
          <Trans>There was an error. Please try again later.</Trans>
        ) : (
          <Trans>No results found.</Trans>
        )}
      </Text>
    )
    return (
      <>
        {above768 ? (
          <tr>
            <td colSpan={isCexFlowTabs ? 9 : 8} height={500} style={{ pointerEvents: 'none' }}>
              {msg}
            </td>
          </tr>
        ) : (
          <tr style={{ height: '250px' }}>
            <Row
              style={{
                position: 'absolute',
                height: '200px',
                justifyContent: 'center',
                backgroundColor: theme.background,
              }}
            >
              {msg}
            </Row>
          </tr>
        )}
      </>
    )
  }

  return (
    <>
      <TradeInfoWrapper>
        <Text fontSize="12px" color={theme.subText} fontWeight={500}>
          <Trans>KyberScore will be updated every 4 hour.</Trans>
        </Text>
        <Text fontSize="12px" color={theme.subText} fontStyle="italic">
          <Trans>Disclaimer: The information here should not be treated as any form of financial advice.</Trans>
        </Text>
      </TradeInfoWrapper>
      <ListTokenWrapper>
        <TokenListDraggableTabs tab={listTypeParam} setTab={handleTabChange} />

        <TokenFilter
          listType={listTypeParam}
          filter={filter}
          handleFilterChange={handleFilterChange}
          setShowShare={setShowShare}
          onResetFilterSort={onResetFilterSort}
        />

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
                {renderCol()}
                <col style={{ width: '120px', minWidth: 'auto' }} />
              </colgroup>
              <thead>
                <tr>
                  <TableHeaderCell>#</TableHeaderCell>
                  {renderTableHeader({ theme, kyberscoreCalculateAt, onChangeSort, sortInfo })}
                  <TableHeaderCell style={{ textAlign: 'end' }}>
                    <Trans>Action</Trans>
                  </TableHeaderCell>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <SkeletonTheme
                    baseColor={theme.border}
                    height="28px"
                    borderRadius={'8px'}
                    direction="ltr"
                    duration={1.5}
                    highlightColor={theme.tabActive}
                  >
                    <LoadingRowSkeleton hasExtraCol={isCexFlowTabs} />
                  </SkeletonTheme>
                ) : isError || listData.length === 0 ? (
                  renderEmptyTokens()
                ) : (
                  listData.map((token: ITokenList, index: number) => (
                    <TokenRow
                      token={token}
                      key={token.assetId + '_' + (pageSize * (page - 1) + index + 1)}
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
              network: filter.chains || 'all',
              source: KYBERAI_LISTYPE_TO_MIXPANEL[listType],
              share_via: social,
            })
          }
        />
        <FeedbackSurvey />
      </ListTokenWrapper>
    </>
  )
}
