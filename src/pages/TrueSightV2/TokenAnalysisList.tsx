import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useState } from 'react'
import { Share2, Star } from 'react-feather'
import { useHistory } from 'react-router-dom'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonGray, ButtonLight, ButtonOutlined } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { Ethereum } from 'components/Icons'
import Icon from 'components/Icons/Icon'
import ProChartToggle from 'components/LiveChart/ProChartToggle'
import Pagination from 'components/Pagination'
import Row, { RowBetween, RowFit } from 'components/Row'
import Toggle from 'components/Toggle'
import useTruesightV2 from 'hooks/truesight-v2'
import useTheme from 'hooks/useTheme'

import TokenChart from './TokenChart'

const TableWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  border-radius: 20px;
  overflow: hidden;
  padding: 0;
  font-size: 12px;
  margin-bottom: 40px;
`

const gridTemplateColumns = '1fr 2fr 1fr 2fr 2fr 1.4fr 1fr 2.4fr'
const TableHeader = styled.div`
  display: grid;
  grid-template-columns: ${gridTemplateColumns};
  align-items: center;
  height: 48px;
  text-transform: uppercase;

  ${({ theme }) => css`
    background-color: ${theme.tableHeader};
    color: ${theme.subText};
  `};

  & > *:last-child {
    justify-content: end;
  }
`
const TableRow = styled(TableHeader)`
  height: 72px;
  font-size: 14px;
  ${({ theme }) => css`
    background-color: ${theme.background};
    color: ${theme.text};
    border-bottom: 1px solid ${theme.border};
  `};
`
const TableCell = styled.div`
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 4px;
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

const ButtonTypeActive = styled(ButtonLight)`
  height: 36px;
  width: fit-content;
  margin: 0 !important;
  display: flex;
  gap: 4px;
  font-size: 14px;
`

const ButtonTypeInactive = styled(ButtonOutlined)`
  height: 36px;
  width: fit-content;
  margin: 0 !important;
  display: flex;
  gap: 4px;
  font-size: 14px;
  ${({ theme }) => css`
    color: ${theme.border};
    border-color: ${theme.border};
  `}
  transition: all 0.1s ease;
`

enum FilterType {
  All = 'All',
  Bullish = 'Bullish',
  Bearish = 'Bearish',
  TrendingSoon = 'Trending Soon',
  CurrentlyTrending = 'Currently Trending',
  TopInflow = 'Top CEX Inflow',
  TopOutflow = 'Top CEX Outflow',
  TopTraded = 'Top Traded',
  TopSocialMentions = 'Top Social Mentions',
}

const tokenTypeList: { type: FilterType; icon?: string }[] = [
  { type: FilterType.All },
  { type: FilterType.Bullish, icon: 'bullish' },
  { type: FilterType.Bearish, icon: 'bearish' },
  { type: FilterType.TrendingSoon, icon: 'trending-soon' },
  { type: FilterType.CurrentlyTrending, icon: 'flame' },
  { type: FilterType.TopInflow, icon: 'download' },
  { type: FilterType.TopOutflow, icon: 'upload' },
  { type: FilterType.TopTraded, icon: 'coin-bag' },
  { type: FilterType.TopSocialMentions, icon: 'speaker' },
]

export default function TokenAnalysisList() {
  const theme = useTheme()
  const history = useHistory()
  const [page, setPage] = useState(1)
  const [activeTimeframe, setActiveTimeframe] = useState('1D')
  const [watchlisted, setWatchlisted] = useState(false)
  const [filterType, setFilterType] = useState(FilterType.All)

  const { tokenList } = useTruesightV2()
  const loading = !tokenList.data
  const pageSize = 10
  return (
    <>
      <Row gap="6px" marginBottom="24px">
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
      </Row>
      <RowBetween marginBottom="24px">
        <RowFit gap="8px">
          <ProChartToggle
            activeName={activeTimeframe}
            buttons={[
              { name: '1D', title: '1D' },
              { name: '7D', title: '7D' },
            ]}
            toggle={(name: string) => setActiveTimeframe(name)}
            disabled={filterType === FilterType.All}
          />
          <Text>
            <Trans>Watchlist</Trans>
          </Text>
          <Toggle
            isActive={watchlisted}
            toggle={() => setWatchlisted(prev => !prev)}
            style={{ filter: 'drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.16))' }}
          />
        </RowFit>
        <RowFit gap="16px">
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
        </RowFit>
      </RowBetween>
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
            <Trans>Marketcap</Trans>
          </TableCell>
          <TableCell>
            <Trans>Action</Trans>
          </TableCell>
        </TableHeader>
        {tokenList.data.slice(pageSize * (page - 1), pageSize * page).map(token => (
          <TableRow key={token.id}>
            <TableCell>
              <Star size={16} /> {token.id}
            </TableCell>
            <TableCell>
              <AutoColumn gap="10px">
                <Text>{token.symbol}</Text>
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
              <Text>{token['24hVolume']}</Text>
            </TableCell>
            <TableCell>
              <Text>${token.marketcap}</Text>
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
        <Pagination totalCount={tokenList?.totalItems} pageSize={pageSize} currentPage={page} onPageChange={setPage} />
      </TableWrapper>
    </>
  )
}
