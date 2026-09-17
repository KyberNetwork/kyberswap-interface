import {
  agentPositionEventsParams,
  copyRunSortMap,
  leaderboardSortMap,
  performanceParams,
} from 'services/copyTrading/api/queryParams'
import { describe, expect, it } from 'vitest'

it('uses ROI sorts and keeps the agent win-rate sort distinct', () => {
  expect(leaderboardSortMap.roi_pct).toBe('LEADERBOARD_SORT_FIELD_ROI_PCT')
  expect(copyRunSortMap.roi_pct).toBe('OWNER_COPY_RUN_SORT_FIELD_ROI_PCT')
  expect(copyRunSortMap.agent_win_rate).toBe('OWNER_COPY_RUN_SORT_FIELD_AGENT_WIN_RATE')
  expect(
    [...Object.values(leaderboardSortMap), ...Object.values(copyRunSortMap)].some(value => value.includes('APR')),
  ).toBe(false)
})

describe('performanceParams', () => {
  it('serializes the cumulative total PnL all-time contract', () => {
    expect(performanceParams({ series: 'cumulative_total_pnl', window: 'all', interval: 'month' })).toEqual({
      series: 'PERFORMANCE_SERIES_CUMULATIVE_TOTAL_PNL',
      window: 'WINDOW_ALL',
      interval: 'PERFORMANCE_INTERVAL_MONTH',
    })
  })
})

describe('agentPositionEventsParams', () => {
  it('passes an opaque generation id through with cursor pagination', () => {
    expect(agentPositionEventsParams({ generationId: 'beta-3/candidate', cursor: 'next', limit: 25 })).toEqual({
      generationId: 'beta-3/candidate',
      cursor: 'next',
      limit: 25,
    })
  })

  it('omits a missing generation id for backward-compatible reads', () => {
    expect(agentPositionEventsParams({ cursor: 'next' })).toEqual({ cursor: 'next' })
  })
})
