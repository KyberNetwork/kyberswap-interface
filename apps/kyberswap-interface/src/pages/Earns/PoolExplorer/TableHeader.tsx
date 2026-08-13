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
    <TableHeaderComponent
      style={{ gridTemplateColumns: getPoolTableGridTemplateColumns(showRewards, showPoolPrice) }}
      data-testid="earn-pool-table-header"
    >
      <TableCell className="flex-row">
        <HeaderText>{t`Pair`}</HeaderText>
      </TableCell>
      <TableCell className="flex-row">
        <SortableHeader
          role="button"
          onClick={() => onSortChange(SortBy.APR)}
          data-testid={`earn-pool-sort-${SortBy.APR}`}
          data-sorted={filters.sortBy === SortBy.APR ? filters.orderBy : ''}
        >
          {t`APR`}
          <SortIcon sorted={filters.sortBy === SortBy.APR ? (filters.orderBy as Direction) : undefined} />
        </SortableHeader>
      </TableCell>
      <TableCell className="flex-row">
        <SortableHeader
          role="button"
          onClick={() => onSortChange(SortBy.EARN_FEE)}
          data-testid={`earn-pool-sort-${SortBy.EARN_FEE}`}
          data-sorted={filters.sortBy === SortBy.EARN_FEE ? filters.orderBy : ''}
        >
          {t`Fee`}
          <SortIcon sorted={filters.sortBy === SortBy.EARN_FEE ? (filters.orderBy as Direction) : undefined} />
        </SortableHeader>
      </TableCell>
      <TableCell className="flex-row">
        <SortableHeader
          role="button"
          onClick={() => onSortChange(SortBy.TVL)}
          data-testid={`earn-pool-sort-${SortBy.TVL}`}
          data-sorted={filters.sortBy === SortBy.TVL ? filters.orderBy : ''}
        >
          {t`TVL`}
          <SortIcon sorted={filters.sortBy === SortBy.TVL ? (filters.orderBy as Direction) : undefined} />
        </SortableHeader>
      </TableCell>
      <TableCell className="flex-row">
        <SortableHeader
          role="button"
          onClick={() => onSortChange(SortBy.VOLUME)}
          data-testid={`earn-pool-sort-${SortBy.VOLUME}`}
          data-sorted={filters.sortBy === SortBy.VOLUME ? filters.orderBy : ''}
        >
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
