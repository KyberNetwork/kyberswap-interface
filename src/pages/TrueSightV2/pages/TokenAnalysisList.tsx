import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useEffect, useMemo, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { ArrowDown, ArrowUp, Share2, Star } from 'react-feather'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { useGesture } from 'react-use-gesture'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { ButtonGray, ButtonLight, ButtonOutlined } from 'components/Button'
import Column from 'components/Column'
import { Ethereum } from 'components/Icons'
import Icon from 'components/Icons/Icon'
import InfoHelper from 'components/InfoHelper'
import Pagination from 'components/Pagination'
import Row, { RowFit } from 'components/Row'
import ShareModal from 'components/ShareModal'
import useTruesightV2 from 'hooks/truesight-v2'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useToggleModal } from 'state/application/hooks'

import NetworkSelect from '../components/NetworkSelect'
import TokenChart from '../components/TokenChartSVG'
import { TokenListTab } from '../types'

const TableWrapper = styled.div`
  border-radius: 20px 20px 0 0;
  padding: 0;
  font-size: 12px;
  border: 1px solid ${({ theme }) => theme.border};
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
  border: 1px solid ${({ theme }) => theme.border};
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
        filter: brightness(1.2);
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
    z-index: 2;
    cursor: pointer;

    ${({ theme }) => css`
      background-color: ${theme.background};
      color: ${theme.text};
      border-bottom: 1px solid ${theme.border};
    `};
    :hover:not(thead tr) {
      filter: brightness(1.2);
    }

    td {
      background-color: ${({ theme }) => theme.background};
    }

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
  width: fit-content;
  height: fit-content;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
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
    filter: brightness(1.1);
  }

  :active {
    filter: brightness(1.2);
  }
`

const TabWrapper = styled.div`
  overflow: auto;
  cursor: grab;
  display: inline-flex;
  gap: 8px;
  padding: 1px;
  position: relative;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  > * {
    flex: 0 0 fit-content;
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
  ${({ theme }) => css`
    color: ${theme.subText};
    border-color: ${theme.subText};
  `}
  :hover {
    background-color: ${({ theme }) => rgba(theme.border, 0.5)};
  }
`

const tokenTypeList: { type: TokenListTab; icon?: string }[] = [
  { type: TokenListTab.All },
  { type: TokenListTab.MyWatchlist, icon: 'star' },
  { type: TokenListTab.Bullish, icon: 'bullish' },
  { type: TokenListTab.Bearish, icon: 'bearish' },
  { type: TokenListTab.TrendingSoon, icon: 'trending-soon' },
  { type: TokenListTab.CurrentlyTrending, icon: 'flame' },
  { type: TokenListTab.TopInflow, icon: 'download' },
  { type: TokenListTab.TopOutflow, icon: 'upload' },
  { type: TokenListTab.TopTraded, icon: 'coin-bag' },
]

const TokenListDraggableTabs = ({ tab, setTab }: { tab: TokenListTab; setTab: (type: TokenListTab) => void }) => {
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
        {tokenTypeList.map(({ type, icon }, index) => {
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
              <ButtonTypeActive key={type} {...props} ref={el => (tabListRef.current[index] = el)}>
                {icon && <Icon id={icon} size={16} />}
                {type}
              </ButtonTypeActive>
            )
          } else {
            return (
              <ButtonTypeInactive key={type} {...props} ref={el => (tabListRef.current[index] = el)}>
                {icon && <Icon id={icon} size={16} />}
                {type}
              </ButtonTypeInactive>
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

export default function TokenAnalysisList() {
  const theme = useTheme()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [currentTab, setCurrentTab] = useState(TokenListTab.All)
  const [networkFilter, setNetworkFilter] = useState<ChainId>()
  const toggle = useToggleModal(ApplicationModal.SHARE)
  const { tokenList } = useTruesightV2()
  const above768 = useMedia('(min-width:768px)')

  const [searchParams, setSearchParams] = useSearchParams()
  const sortedColumn = searchParams.get('orderBy') || SORT_FIELD.VOLUME
  const sortOrder = searchParams.get('orderDirection') || SORT_DIRECTION.DESC
  const sortDirection = sortOrder === SORT_DIRECTION.DESC

  const templateList = useMemo(
    () =>
      [...Array(5)]
        .reduce((t, a) => t.concat(tokenList.data), [])
        .map((t: any, index: number) => {
          return { ...t, id: index + 1 }
        }) || [],
    [tokenList],
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
      <Row gap="16px" justify="flex-end" flexWrap={above768 ? 'nowrap' : 'wrap'}>
        <TokenListDraggableTabs tab={currentTab} setTab={setCurrentTab} />
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
      </Row>
      <Column gap="0px">
        <TableWrapper>
          <div>
            <Table>
              <colgroup>
                <col style={{ width: '35px' }} />
                <col style={{ width: '380px', minWidth: '200px' }} />
                <col style={{ width: '50px' }} />
                <col style={{ width: '150px', minWidth: 'auto' }} />
                <col style={{ width: '220px', minWidth: 'auto' }} />
                <col style={{ width: '250px', minWidth: 'auto' }} />
                <col style={{ width: '150px', minWidth: 'auto' }} />
                <col style={{ width: '300px', minWidth: 'auto' }} />
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
                  <th>
                    <Trans>Chain</Trans>
                  </th>
                  <th onClick={() => handleSort(SORT_FIELD.KYBERSCORE)}>
                    <Row justify="center">
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
                        text={t`KyberScore is an algorithm created by us that takes into account multiple on-chain and off-chain indicators to measure the current trend of a token. The score ranges from 0 to 100.`}
                      />
                    </Row>
                  </th>
                  <th onClick={() => handleSort(SORT_FIELD.PRICE)}>
                    <Row justify="center">
                      <Trans>Price</Trans>
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
                    <Trans>Last 7d price</Trans>
                  </th>
                  <th onClick={() => handleSort(SORT_FIELD.VOLUME)}>
                    <Row justify="center">
                      <Trans>24h Volume</Trans>
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

                  <th style={{ textAlign: 'end' }}>
                    <Trans>Action</Trans>
                  </th>
                </tr>
              </thead>

              <tbody>
                {templateList.slice((page - 1) * pageSize, page * pageSize).map((token: any) => (
                  <tr key={token.id} onClick={() => navigate('/discover/single-token')}>
                    <td>
                      <RowFit>
                        <Star size={16} style={{ marginRight: '6px', cursor: 'pointer' }} /> {token.id}
                      </RowFit>
                    </td>
                    <td>
                      <Row>
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          xmlnsXlink="http://www.w3.org/1999/xlink"
                          style={{ marginRight: '8px', flex: '0 0 24px' }}
                        >
                          <rect width="24" height="24" fill="url(#pattern0)" />
                          <defs>
                            <pattern id="pattern0" patternContentUnits="objectBoundingBox" width="1" height="1">
                              <use xlinkHref="#image0_1107_13122" transform="scale(0.00460829)" />
                            </pattern>
                            <image
                              id="image0_1107_13122"
                              width="217"
                              height="217"
                              xlinkHref="data:image/png;base64,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"
                            />
                          </defs>
                        </svg>

                        <Column
                          gap="8px"
                          style={{ cursor: 'pointer', alignItems: 'flex-start' }}
                          onClick={() => navigate('/discover/single-token')}
                        >
                          <Text>{token.symbol}</Text>{' '}
                          <Text fontSize={12} color={theme.subText}>
                            {token.tokenName}
                          </Text>
                        </Column>
                      </Row>
                    </td>
                    <td>
                      <Ethereum size={16} />
                    </td>
                    <td>
                      <Text color={theme.primary}>{token.kyberscore || '--'}</Text>
                    </td>
                    <td>
                      <Column gap="10px" style={{ textAlign: 'left' }}>
                        <Text>${token.price}</Text>
                        <Text fontSize={12} color={theme.primary}>
                          +{token.change}
                        </Text>
                      </Column>
                    </td>
                    <td>
                      <TokenChart />
                    </td>
                    <td>
                      <Text>{token['24hVolume'] || '--'}</Text>
                    </td>

                    <td>
                      <Row gap="6px" justify={'flex-end'}>
                        <ActionButton color={theme.subText} onClick={() => navigate('/discover/single-token')}>
                          <Icon id="truesight-v2" size={16} />
                          <Trans>Explore</Trans>
                        </ActionButton>
                        <ActionButton color={theme.primary}>
                          <Icon id="swap" size={16} />
                          <Trans>Swap</Trans>
                        </ActionButton>
                      </Row>
                    </td>
                  </tr>
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
