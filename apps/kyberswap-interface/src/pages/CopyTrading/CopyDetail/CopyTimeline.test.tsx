import { renderToStaticMarkup } from 'react-dom/server'
import { adaptCopyRunResponse, adaptCopyRunsResponse } from 'services/copyTrading/adapters/copyRuns'
import { describe, expect, it } from 'vitest'

import CopyTimeline from './CopyTimeline'

describe('Copy Timeline capital breakdown', () => {
  it('hides the breakdown when absent and shows the returned total', () => {
    const run = adaptCopyRunResponse({
      data: { capitalOutUsd: { value: '6200', status: 'METRIC_STATUS_CURRENT' } },
    }).data
    const html = renderToStaticMarkup(<CopyTimeline run={run} quoteTokenSymbol="USDC" />)
    expect(html).toContain('$6,200.00')
    expect(html).not.toContain('Tokens withdrawn')
    expect(html).not.toContain('USDC')
  })

  it('keeps independently available components without inventing a partial total', () => {
    const data = {
      capitalOutUsd: { status: 'METRIC_STATUS_UNAVAILABLE' as const, value: '9999' },
      capitalOutBreakdown: {
        quoteUsd: { value: '4700', status: 'METRIC_STATUS_STALE' as const, asOf: '2026-10-14T00:00:00Z' },
        tokensWithdrawnUsd: { status: 'METRIC_STATUS_UNAVAILABLE' as const, value: '1500' },
      },
    }
    const run = adaptCopyRunResponse({ data }).data
    expect(run.capitalOutBreakdown).toEqual({ quoteUsd: '4700', tokensWithdrawnUsd: undefined })
    expect(adaptCopyRunsResponse({ data: [data] }).data[0].capitalOutBreakdown).toEqual(run.capitalOutBreakdown)
    const html = renderToStaticMarkup(<CopyTimeline run={run} quoteTokenSymbol="USDC" />)
    expect(html).toContain('USDC')
    expect(html).toContain('Tokens withdrawn')
    expect(html).toContain('$4,700.00')
    expect(html).not.toContain('$1,500.00')
    expect(html).not.toContain('$9,999.00')
    expect(html.match(/—/g)?.length).toBe(5) // Two dates, Capital In, total Out, and token value.
  })

  it('keeps zero values and removes a breakdown when a later response omits it', () => {
    const run = adaptCopyRunResponse({
      data: { capitalOutBreakdown: { quoteUsd: { value: '0', status: 'METRIC_STATUS_CURRENT' } } },
    }).data
    expect(renderToStaticMarkup(<CopyTimeline run={run} />)).toContain('$0.00')
    expect(adaptCopyRunResponse({ data: {} }).data.capitalOutBreakdown).toBeUndefined()
  })
})
