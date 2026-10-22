import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import CopyRunPerformance from './CopyRunPerformance'

const query = vi.hoisted(() => vi.fn())
vi.mock('services/copyTrading/api/endpoints/copyRuns', () => ({
  default: { useGetCopyRunPerformanceQuery: query },
}))
vi.mock('pages/CopyTrading/context', () => ({ useCopyTradingContext: () => ({ ownerAddress: 'owner' }) }))
vi.mock('react-use', () => ({ useMedia: () => false }))

beforeEach(() => {
  query.mockReset()
  query.mockReturnValue({ currentData: { data: [] }, isError: false, isFetching: false })
})

describe('Copy Detail History performance', () => {
  it.each(['closed', 'stopped'] as const)(
    'requests realised USD for a %s run and displays the independent run total',
    status => {
      const html = renderToStaticMarkup(<CopyRunPerformance copyRunId="run" status={status} realizedPnlUsd="-123.45" />)
      expect(query).toHaveBeenCalledWith(
        expect.objectContaining({ copyRunId: 'run', series: 'cumulative_realized_pnl', window: 'all' }),
        expect.objectContaining({ pollingInterval: 10_000, skip: false }),
      )
      expect(html).toContain('Cumulative Realised P&amp;L')
      expect(html).toContain('Total Realised P&amp;L')
      expect(html).toContain('text-red">-$123.45')
      expect(html).not.toContain('>%<')
      expect(html).not.toContain('Cumulative Total P&amp;L')
      expect(html).not.toContain('Capital Value')
    },
  )

  it('shows the missing-data placeholder for an unavailable total', () => {
    const html = renderToStaticMarkup(<CopyRunPerformance copyRunId="run" status="closed" />)
    expect(html).toContain('text-text">—')
  })
})
