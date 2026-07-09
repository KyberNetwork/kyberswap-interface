import type { PositionQueryParams } from 'services/earn/types'

import { PositionFilter, PositionStatus } from 'pages/Earns/types'
import { Direction } from 'pages/MarketOverview/SortIcon'

export enum SortBy {
  VALUE = 'valueUsd',
  APR = 'apr24h',
  UNCLAIMED_FEE = 'unclaimedFeeUsd',
}

/** Page size for the positions list — shared by the list page and the nav-intent prefetch. */
export const POSITIONS_PAGE_SIZE = 10

/**
 * The filter values the My Positions page falls back to when there is no `?...` filter in the URL.
 * Single source of truth shared by `useFilter` and the nav-intent prefetch.
 */
export const DEFAULT_POSITION_FILTERS: PositionFilter = {
  chainIds: '',
  protocols: '',
  statuses: `${PositionStatus.IN_RANGE},${PositionStatus.OUT_RANGE}`,
  keyword: '',
  sortBy: SortBy.VALUE,
  orderBy: Direction.DESC,
  page: 1,
  pageSize: POSITIONS_PAGE_SIZE,
}

/**
 * Map filter state → the exact `userPositions` query args. Shared by the page AND the prefetch so their
 * RTK Query cache keys match EXACTLY — note the derived `sorts` string (`sortBy:orderBy`, the param the
 * API actually reads) and that the filter's `positionId` becomes `positionIds`.
 */
export const toPositionQueryParams = (filters: PositionFilter, account: string | undefined): PositionQueryParams => ({
  wallet: account || '',
  chainIds: filters.chainIds,
  protocols: filters.protocols,
  statuses: filters.statuses,
  keyword: filters.keyword,
  positionIds: filters.positionId,
  sorts: [filters.sortBy, filters.orderBy].filter(Boolean).join(':'),
  page: filters.page,
  pageSize: filters.pageSize,
})

/** The `userPositions` args the page fires on a FRESH visit (no `?...` filters in the URL). */
export const getInitialPositionQueryParams = (account: string | undefined) =>
  toPositionQueryParams(DEFAULT_POSITION_FILTERS, account)
