import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { adaptPositionsResponse } from 'services/copyTrading/adapters/positions'
import { describe, expect, it, vi } from 'vitest'

import { TradeHistoryTable } from './TradeHistoryTable'

vi.mock('pages/CopyTrading/components/InfiniteScroll', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

const current = (value: string) => ({ value, status: 'METRIC_STATUS_CURRENT' as const })
const withdrawal = {
  positionId: 'withdrawal-position',
  chainId: '8453',
  lifecycle: 'POSITION_LIFECYCLE_CLOSED',
  exitKind: 'POSITION_EXIT_KIND_WITHDRAWAL_CLOSE',
  tokensWithdrawn: true,
  token: { chainId: '8453', address: '0x1111111111111111111111111111111111111111', symbol: 'TKN', decimals: 6 },
  quoteToken: { chainId: '8453', symbol: 'USDC' },
  withdrawnBaseRaw: '2000000',
  withdrawnBaseDecimal: current('2'),
  exitValuation: { priceUsd: '2.78', valueUsd: '5.56', status: 'DATA_STATUS_CURRENT' as const },
  positionPnlUsd: current('1.23'),
  realizedPnlUsd: current('0.45'),
  totalBaseSoldDecimal: current('10'),
  totalQuoteReceivedDecimal: current('12'),
  cashbackReceivedUsd: current('0.20'),
  flatFeeCapturedUsd: current('0.10'),
}

const renderRows = (data: Parameters<typeof adaptPositionsResponse>[0]['data']) =>
  renderToStaticMarkup(
    <TradeHistoryTable
      infiniteScroll={{ hasMore: false, onLoadMore: () => undefined }}
      rows={adaptPositionsResponse({ data }).data}
    />,
  )

describe('withdrawal position history', () => {
  it('shows settlement quantity, value, position P&L and zero closure rebate on desktop and mobile', () => {
    const html = renderRows([withdrawal])
    expect(html.match(/>Withdrawn</g)).toHaveLength(2)
    expect(html).toContain('text-warning')
    expect(html.match(/>EXIT</g)).toHaveLength(2)
    expect(html).not.toContain('Tokens settled')
    expect(html.match(/\(\$5\.56\)/g)).toHaveLength(2)
    expect(html.match(/>2 TKN</g)).toHaveLength(2)
    expect(html).toContain('$5.56')
    expect(html).toContain('$2.78')
    expect(html).toContain('+$1.23')
    expect(html).toContain('$0.1')
    expect(html.match(/text-blue">\$0</g)).toHaveLength(2)
    expect(html).not.toContain('12 USDC')
    expect(html).not.toContain('+$0.45')
  })

  it('adds only the badge to an earlier sold position', () => {
    const sold = { ...withdrawal, exitKind: 'POSITION_EXIT_KIND_ALIGNED' }
    const html = renderRows([sold])
    expect(html.match(/>Withdrawn</g)).toHaveLength(2)
    expect(html.match(/>12 USDC</g)).toHaveLength(2)
    expect(html).toContain('+$0.45')
    expect(html).toContain('$0.2')
    expect(html).not.toContain('Tokens settled')
    expect(html).not.toContain('2 TKN')
    expect(html).not.toContain('+$1.23')
  })

  it('keeps quantity available while settlement USD and P&L are unavailable', () => {
    const html = renderRows([
      {
        ...withdrawal,
        exitValuation: { ...withdrawal.exitValuation, status: 'DATA_STATUS_UNAVAILABLE' },
        positionPnlUsd: { value: '1.23', status: 'METRIC_STATUS_UNAVAILABLE' },
      },
    ])
    expect(html).toContain('2 TKN')
    expect(html).not.toContain('$5.56')
    expect(html).not.toContain('$2.78')
    expect(html).not.toContain('+$1.23')
  })

  it.each([false, undefined])(
    'removes the badge for %s and does not derive an invalid quantity from raw balances',
    flag => {
      const data = {
        ...withdrawal,
        tokensWithdrawn: flag,
        withdrawnBaseDecimal: { value: '2', status: 'METRIC_STATUS_UNAVAILABLE' as const },
      }
      const row = adaptPositionsResponse({ data: [data] }).data[0]
      expect(row.tokensWithdrawn).toBe(flag)
      expect(row.withdrawnBaseRaw).toBe('2000000')
      expect(row.withdrawnBaseDecimal).toBeUndefined()
      const html = renderRows([data])
      expect(html).not.toContain('>Withdrawn<')
      expect(html).not.toContain('2 TKN')
      expect(html).not.toContain('12 USDC')
    },
  )

  it('preserves zero and stale quantities without converting raw amounts to numbers', () => {
    const data = {
      ...withdrawal,
      withdrawnBaseRaw: '9007199254740993123456789',
      withdrawnBaseDecimal: { value: '0', status: 'METRIC_STATUS_STALE' as const },
    }
    expect(adaptPositionsResponse({ data: [data] }).data[0].withdrawnBaseRaw).toBe(data.withdrawnBaseRaw)
    expect(renderRows([data])).toContain('0 TKN')
  })
})
