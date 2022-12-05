import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useMemo, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { ChevronRight, Share2, Star } from 'react-feather'
import { useHistory } from 'react-router-dom'
import { useWindowScroll } from 'react-use'
import { useDrag } from 'react-use-gesture'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonGray, ButtonLight, ButtonOutlined } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { Ethereum } from 'components/Icons'
import Icon from 'components/Icons/Icon'
import InfoHelper from 'components/InfoHelper'
import Pagination from 'components/Pagination'
import Row from 'components/Row'
import useTruesightV2 from 'hooks/truesight-v2'
import useTheme from 'hooks/useTheme'

import NetworkSelect from './NetworkSelect'
import TokenChart from './TokenChart'

const TableWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  border-radius: 20px;
  padding: 0;
  font-size: 12px;
  margin-bottom: 40px;
`

const gridTemplateColumns = '0.6fr 2fr 0.8fr 2fr 2fr 1.2fr 1.4fr 2.1fr'
const TableHeader = styled.div`
  display: grid;
  grid-template-columns: ${gridTemplateColumns};
  align-items: center;
  height: 48px;
  text-transform: uppercase;
  position: sticky;
  top: 0;
  z-index: 22;
  border-radius: 20px 20px 0 0;
  ${({ theme }) => css`
    background-color: ${theme.tableHeader};
    color: ${theme.subText};
  `};

  & > *:last-child {
    justify-content: end;
  }
`
const TableRow = styled(TableHeader)`
  position: initial;
  height: 72px;
  font-size: 14px;
  content-visibility: auto;
  contain-intrinsic-height: 72px;
  border-radius: 0;
  z-index: 21;
  ${({ theme }) => css`
    background-color: ${theme.background};
    color: ${theme.text};
    border-bottom: 1px solid ${theme.border};
  `};
`
const TableCell = styled.div`
  display: flex;
  align-items: center;
  text-align: left;
  padding: 16px;
`

const ActionButton = styled(ButtonLight)<{ color: string }>`
  width: fit-content;
  height: fit-content;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;

  ${({ theme, color }) => css`
    color: ${color || theme.primary};
    background-color: ${color ? rgba(color, 0.2) : rgba(theme.primary, 0.2)};
  `}
`

const TabWrapper = styled.div`
  width: 100%;
  overflow: auto;
  cursor: grab;
`
const TabInner = styled.div`
  display: inline-flex;
  gap: 8px;
`

const ButtonTypeActive = styled(ButtonLight)`
  height: 36px;
  width: fit-content;
  margin: 0 !important;
  display: flex;
  gap: 4px;
  font-size: 14px;
  white-space: nowrap;
`

const ButtonTypeInactive = styled(ButtonOutlined)`
  height: 36px;
  width: fit-content;
  margin: 0 !important;
  display: flex;
  gap: 4px;
  font-size: 14px;
  white-space: nowrap;
  ${({ theme }) => css`
    color: ${theme.border};
    border-color: ${theme.border};
  `}
  transition: all 0.1s ease;
`

enum FilterType {
  All = 'All',
  MyWatchlist = 'My Watchlist',
  Bullish = 'Bullish',
  Bearish = 'Bearish',
  TrendingSoon = 'Trending Soon',
  CurrentlyTrending = 'Currently Trending',
  TopInflow = 'Top CEX Inflow',
  TopOutflow = 'Top CEX Outflow',
  TopTraded = 'Top Traded',
}

const tokenTypeList: { type: FilterType; icon?: string }[] = [
  { type: FilterType.All },
  { type: FilterType.MyWatchlist, icon: 'star' },
  { type: FilterType.Bullish, icon: 'bullish' },
  { type: FilterType.Bearish, icon: 'bearish' },
  { type: FilterType.TrendingSoon, icon: 'trending-soon' },
  { type: FilterType.CurrentlyTrending, icon: 'flame' },
  { type: FilterType.TopInflow, icon: 'download' },
  { type: FilterType.TopOutflow, icon: 'upload' },
  { type: FilterType.TopTraded, icon: 'coin-bag' },
]

const TokenListDraggableTab = ({
  filterType,
  setFilterType,
}: {
  filterType: FilterType
  setFilterType: (type: FilterType) => void
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const bind = useDrag(state => {
    if (isMobile) return
    if (ref.current && ref.current?.scrollLeft !== undefined && state.dragging) {
      ref.current.scrollLeft -= state.values?.[0] - state.previous?.[0] || 0
    }
  })

  return (
    <TabWrapper ref={ref}>
      <TabInner {...bind()}>
        {tokenTypeList.map(({ type, icon }) => {
          const props = { onClick: () => setFilterType(type) }
          if (filterType === type) {
            return (
              <ButtonTypeActive key={type} {...props}>
                {icon && <Icon id={icon} size={16} />}
                {type}
              </ButtonTypeActive>
            )
          } else {
            return (
              <ButtonTypeInactive key={type} {...props}>
                {icon && <Icon id={icon} size={16} />}
                {type}
              </ButtonTypeInactive>
            )
          }
        })}
      </TabInner>
    </TabWrapper>
  )
}

export default function TokenAnalysisList() {
  const theme = useTheme()
  const history = useHistory()
  const [page, setPage] = useState(1)
  const [filterType, setFilterType] = useState(FilterType.All)
  const [networkFilter, setNetworkFilter] = useState<ChainId>()

  const { tokenList } = useTruesightV2()
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
  useWindowScroll()
  return (
    <>
      <Row gap="16px" marginBottom="20px">
        <TokenListDraggableTab filterType={filterType} setFilterType={setFilterType} />
        <ChevronRight size={12} />

        <ButtonGray
          color={theme.subText}
          gap="4px"
          width="36px"
          height="36px"
          padding="6px"
          style={{ filter: 'drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.16))', flexShrink: 0 }}
        >
          <Share2 size={16} fill="currentcolor" />
        </ButtonGray>
        <NetworkSelect filter={networkFilter} setFilter={setNetworkFilter} />
      </Row>
      <TableWrapper>
        <TableHeader>
          <TableCell>#</TableCell>
          <TableCell>
            <Trans>Token name</Trans>
          </TableCell>
          <TableCell>
            <Trans>Chain</Trans>
          </TableCell>
          <TableCell>
            <Trans>Price</Trans>
          </TableCell>
          <TableCell>
            <Trans>Last 7d price</Trans>
          </TableCell>
          <TableCell>
            <Trans>24h Volume</Trans>
          </TableCell>
          <TableCell>
            <Trans>Kyberscrore</Trans>{' '}
            <InfoHelper
              placement="top"
              width="300px"
              size={12}
              text={t`KyberScore is an algorithm created by us that takes into account multiple on-chain and off-chain indicators to measure the current trend of a token. The score ranges from 0 to 100.`}
            />
          </TableCell>
          <TableCell>
            <Trans>Action</Trans>
          </TableCell>
        </TableHeader>

        {templateList.slice((page - 1) * pageSize, page * pageSize).map((token: any) => (
          <TableRow key={token.id}>
            <TableCell>
              <Star size={16} /> {token.id}
            </TableCell>
            <TableCell>
              <AutoColumn gap="10px">
                <Text>{token.symbol}</Text>{' '}
                <Text fontSize={12} color={theme.subText}>
                  {token.tokenName}
                </Text>
              </AutoColumn>
            </TableCell>
            <TableCell>
              <Ethereum size={16} />
            </TableCell>
            <TableCell>
              <AutoColumn gap="10px">
                <Text>${token.price}</Text>
                <Text fontSize={12} color={theme.primary}>
                  +{token.change}
                </Text>
              </AutoColumn>
            </TableCell>
            <TableCell>
              <TokenChart />
            </TableCell>
            <TableCell>
              <Text>{token['24hVolume'] || '--'}</Text>
            </TableCell>
            <TableCell>
              <Text color={theme.primary}>{token.kyberscore || '--'}</Text>
            </TableCell>
            <TableCell>
              <Row gap="6px" justify={'flex-end'}>
                <ActionButton color={theme.subText} onClick={() => history.push('/discover/single-token')}>
                  <Icon id="truesight-v2" size={16} />
                  <Trans>Explore</Trans>
                </ActionButton>
                <ActionButton color={theme.primary}>
                  <Icon id="swap" size={16} />
                  <Trans>Swap</Trans>
                </ActionButton>
              </Row>
            </TableCell>
          </TableRow>
        ))}

        <Pagination
          totalCount={templateList.length}
          pageSize={pageSize}
          currentPage={page}
          onPageChange={(page: number) => {
            window.scroll({ top: 0 })
            setPage(page)
          }}
        />
      </TableWrapper>
    </>
  )
}
