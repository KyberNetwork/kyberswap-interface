import { describe, expect, it } from 'vitest'

import { performanceParams } from './queryParams'

describe('performanceParams', () => {
  it('serializes the cumulative total PnL all-time contract', () => {
    expect(performanceParams({ series: 'cumulative_total_pnl', window: 'all', interval: 'month' })).toEqual({
      series: 'PERFORMANCE_SERIES_CUMULATIVE_TOTAL_PNL',
      window: 'WINDOW_ALL',
      interval: 'PERFORMANCE_INTERVAL_MONTH',
    })
  })
})
