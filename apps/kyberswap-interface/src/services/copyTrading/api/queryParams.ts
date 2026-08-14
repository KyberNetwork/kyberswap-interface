import type {
  LeaderboardSortBy,
  PerformanceInterval,
  PerformanceSeries,
  PerformanceWindow,
  PositionSortBy,
  PositionStatusFilter,
  SortOrder,
} from 'services/copyTrading/types/primitives'
import type { CopyRunsQuery } from 'services/copyTrading/types/queries'

type QueryParam = string | number | boolean
type QueryParams = Record<string, QueryParam | undefined>

export const cleanParams = (params: QueryParams = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ''))

export const pathPart = (value: string | number) => encodeURIComponent(String(value))

export const sortOrderMap: Record<SortOrder, string> = {
  asc: 'SORT_ORDER_ASC',
  desc: 'SORT_ORDER_DESC',
}

export const leaderboardSortMap: Record<LeaderboardSortBy, string> = {
  apr_30d_pct: 'LEADERBOARD_SORT_FIELD_APR_30D',
  win_rate_pct: 'LEADERBOARD_SORT_FIELD_WIN_RATE',
  volume_usd: 'LEADERBOARD_SORT_FIELD_LIFETIME_VOLUME',
  copiers: 'LEADERBOARD_SORT_FIELD_COPIERS',
  aum_usd: 'LEADERBOARD_SORT_FIELD_AUM',
  open_positions: 'LEADERBOARD_SORT_FIELD_OPEN_POSITIONS',
}

const positionSortMap: Record<PositionSortBy, string> = {
  opened_at: 'POSITION_SORT_FIELD_OPENED_AT',
  closed_at: 'POSITION_SORT_FIELD_CLOSED_AT',
  value_usd: 'POSITION_SORT_FIELD_VALUE_USD',
}

const positionViewMap: Record<PositionStatusFilter, string | undefined> = {
  all: undefined,
  open: 'POSITION_VIEW_OPEN',
  closed: 'POSITION_VIEW_CLOSED',
  leftover: 'POSITION_VIEW_LEFTOVER',
}

const performanceSeriesMap: Record<PerformanceSeries, string> = {
  portfolio_value: 'PERFORMANCE_SERIES_PORTFOLIO_EQUITY',
  cumulative_realized_pnl: 'PERFORMANCE_SERIES_CUMULATIVE_REALIZED_PNL',
  period_realized_pnl: 'PERFORMANCE_SERIES_PERIOD_REALIZED_PNL',
  per_trade_realized_pnl: 'PERFORMANCE_SERIES_PER_TRADE_REALIZED_PNL',
}

export const performanceWindowMap: Record<PerformanceWindow, string> = {
  '7d': 'WINDOW_7D',
  '30d': 'WINDOW_30D',
  '90d': 'WINDOW_90D',
  all: 'WINDOW_ALL',
}

const performanceIntervalMap: Record<PerformanceInterval, string> = {
  day: 'PERFORMANCE_INTERVAL_DAY',
  week: 'PERFORMANCE_INTERVAL_WEEK',
  month: 'PERFORMANCE_INTERVAL_MONTH',
}

export const activityGroupMap = {
  buys: 'ACTIVITY_GROUP_BUYS',
  sells: 'ACTIVITY_GROUP_SELLS',
  deposits_withdrawals: 'ACTIVITY_GROUP_DEPOSITS_WITHDRAWALS',
  skipped: 'ACTIVITY_GROUP_SKIPPED',
}

export const copyRunSortMap: Record<NonNullable<CopyRunsQuery['sortBy']>, string> = {
  started_at: 'OWNER_COPY_RUN_SORT_FIELD_STARTED_AT',
  stopped_at: 'OWNER_COPY_RUN_SORT_FIELD_STOPPED_AT',
  agent_apr_30d: 'OWNER_COPY_RUN_SORT_FIELD_AGENT_APR_30D',
  agent_win_rate: 'OWNER_COPY_RUN_SORT_FIELD_AGENT_WIN_RATE',
  agent_volume: 'OWNER_COPY_RUN_SORT_FIELD_AGENT_LIFETIME_VOLUME',
  capital_in: 'OWNER_COPY_RUN_SORT_FIELD_CAPITAL_IN',
}

export const ownerViewMap = {
  open: 'OWNER_COPY_VIEW_OPEN',
  history: 'OWNER_COPY_VIEW_HISTORY',
}

export const copyAccountStatusMap = {
  active: 'COPY_ACCOUNT_STATUS_ACTIVE',
  closed: 'COPY_ACCOUNT_STATUS_CLOSED',
  closing: 'COPY_ACCOUNT_STATUS_CLOSING',
  stopped: 'COPY_ACCOUNT_STATUS_STOPPED',
}

export const performanceParams = ({
  series,
  window,
  interval,
  cursor,
  limit,
}: {
  series?: PerformanceSeries
  window?: PerformanceWindow
  interval?: PerformanceInterval
  cursor?: string
  limit?: number
}) =>
  cleanParams({
    series: series ? performanceSeriesMap[series] : undefined,
    window: window ? performanceWindowMap[window] : undefined,
    interval: interval ? performanceIntervalMap[interval] : undefined,
    cursor,
    limit,
  })

export const positionParams = ({
  status,
  sortBy,
  sortOrder,
  cursor,
  limit,
}: {
  status?: PositionStatusFilter
  sortBy?: PositionSortBy
  sortOrder?: SortOrder
  cursor?: string
  limit?: number
}) =>
  cleanParams({
    view: status ? positionViewMap[status] : undefined,
    sortBy: sortBy ? positionSortMap[sortBy] : undefined,
    sortOrder: sortOrder ? sortOrderMap[sortOrder] : undefined,
    cursor,
    limit,
  })
