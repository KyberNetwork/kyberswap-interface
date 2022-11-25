import { Trans } from '@lingui/macro'
import { darken, rgba } from 'polished'
import { Bell, ChevronDown, Search, Star } from 'react-feather'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonLight } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { Ethereum } from 'components/Icons'
import Cart from 'components/Icons/Cart'
import Pagination from 'components/Pagination'
import { AutoRow } from 'components/Row'
import useTheme from 'hooks/useTheme'

const TableWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  border-radius: 20px;
  overflow: hidden;
  padding: 0;
  font-size: 12px;
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
  padding: 6px;

  ${({ theme, color }) => css`
    color: ${color || theme.primary};
    background-color: ${color ? rgba(color, 0.2) : rgba(theme.primary, 0.2)};
    :hover {
      color: ${color ? darken(0.1, color) : darken(0.1, theme.primary)};
      background-color: ${color ? darken(0.1, rgba(color, 0.2)) : darken(0.1, rgba(theme.primary, 0.2))};
    }
  `}
`

export default function TokenAnalysisList() {
  const theme = useTheme()
  return (
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
      <TableRow>
        <TableCell>
          <Star size={16} /> 1
        </TableCell>
        <TableCell>
          <AutoColumn gap="10px">
            <Text>KNC</Text>
            <Text fontSize={12} color={theme.subText}>
              Kyber Network Crystal
            </Text>
          </AutoColumn>
        </TableCell>
        <TableCell>
          <Ethereum size={16} />
        </TableCell>
        <TableCell>
          <AutoColumn gap="10px">
            <Text>$0.000000000124</Text>
            <Text fontSize={12} color={theme.primary}>
              +20%
            </Text>
          </AutoColumn>
        </TableCell>
        <TableCell>
          <Text>----</Text>
        </TableCell>
        <TableCell>
          <Text>500M</Text>
        </TableCell>
        <TableCell>
          <Text>$81,72M</Text>
        </TableCell>
        <TableCell>
          <AutoRow gap="2px">
            <ActionButton color={theme.subText}>
              <Bell size={14} />
            </ActionButton>
            <ActionButton color={theme.subText}>
              <Search size={14} />
              <Trans>Explore</Trans>
            </ActionButton>
            <ActionButton color={theme.primary}>
              <Cart size={14} />
              <ChevronDown size={10} />
            </ActionButton>
          </AutoRow>
        </TableCell>
      </TableRow>
      <Pagination totalCount={0} pageSize={10} currentPage={1} onPageChange={() => console.log(1)} />
    </TableWrapper>
  )
}
