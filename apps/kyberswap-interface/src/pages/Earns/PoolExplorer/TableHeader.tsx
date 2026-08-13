import { t } from '@lingui/macro'
import { useMedia } from 'react-use'
import type { PoolQueryParams } from 'services/earn/types'

import {
  TableCell,
  TableHeader as TableHeaderComponent,
  getPoolTableGridTemplateColumns,
} from 'components/Listing/Table'
import { SortBy } from 'pages/Earns/PoolExplorer'
import { HeaderText, SortableHeader } from 'pages/Earns/PoolExplorer/styles'
import SortIcon, { Direction } from 'pages/MarketOverview/SortIcon'
import { MEDIA_WIDTHS } from 'theme'

const TableHeader = ({
  onSortChange,
  filters,
  showRewards = true,
  showPoolPrice = true,
}: {
  onSortChange: (sortBy: string) => void
  filters: PoolQueryParams
  showRewards?: boolean
  showPoolPrice?: boolean
}) => {
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  return !upToMedium ? (
    <TableHeaderComponent style={{ gridTemplateColumns: getPoolTableGridTemplateColumns(showRewards, showPoolPrice) }}>
      <TableCell className="flex-row">
        <HeaderText>{t`Pair`}</HeaderText>
      </TableCell>
      <TableCell className="flex-row">
        <SortableHeader role="button" onClick={() => onSortChange(SortBy.APR)}>
          {t`APR`}
          <SortIcon sorted={filters.sortBy === SortBy.APR ? (filters.orderBy as Direction) : undefined} />
        </SortableHeader>
      </TableCell>
      <TableCell className="flex-row">
        <SortableHeader role="button" onClick={() => onSortChange(SortBy.EARN_FEE)}>
          {t`Fee`}
          <SortIcon sorted={filters.sortBy === SortBy.EARN_FEE ? (filters.orderBy as Direction) : undefined} />
        </SortableHeader>
      </TableCell>
      <TableCell className="flex-row">
        <SortableHeader role="button" onClick={() => onSortChange(SortBy.TVL)}>
          {t`TVL`}
          <SortIcon sorted={filters.sortBy === SortBy.TVL ? (filters.orderBy as Direction) : undefined} />
        </SortableHeader>
      </TableCell>
      <TableCell className="flex-row">
        <SortableHeader role="button" onClick={() => onSortChange(SortBy.VOLUME)}>
          {t`Volume`}
          <SortIcon sorted={filters.sortBy === SortBy.VOLUME ? (filters.orderBy as Direction) : undefined} />
        </SortableHeader>
      </TableCell>
      {showRewards && (
        <TableCell className="flex-row">
          <HeaderText>{t`Rewards`}</HeaderText>
        </TableCell>
      )}
      {showPoolPrice && (
        <TableCell className="flex-row">
          <HeaderText>{t`Pool Price`}</HeaderText>
        </TableCell>
      )}
      <TableCell />
    </TableHeaderComponent>
  ) : null
}

export default TableHeader
