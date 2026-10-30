import { setupI18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import StopMarketConfirmModal, { StopMarketReviewSnapshot } from './StopMarketConfirmModal'

vi.mock('components/Modal', () => ({
  default: ({ children, isOpen }: { children: ReactNode; isOpen: boolean }) => (isOpen ? children : null),
}))
vi.mock('components/InfoHelper', () => ({ default: () => null }))
vi.mock('components/Tooltip', () => ({ MouseoverTooltip: ({ children }: { children: ReactNode }) => children }))
vi.mock('components/StopMarket/hooks/useStopMarketOraclePrice', () => ({
  useStopMarketOraclePrice: () => {
    throw new Error('Review must not subscribe to the live oracle')
  },
}))

const snapshot: StopMarketReviewSnapshot = {
  inputAmount: '10',
  estimatedOutput: '900',
  estimatedUsdIn: '$1,000',
  triggerPrice: '90',
  triggerPercent: -10,
  marketPrice: 100,
  slippage: 100,
  expiredAt: 1_900_000_000_000,
  needsWrap: false,
  fee: {
    protocol: { percentage: 6, category: 'commonPair' },
    gas: { percentage: 0, usd: 0, wei: 0 },
  },
  warnings: [{ type: 'warn', message: 'Captured warning' }],
}

const renderReview = (review: StopMarketReviewSnapshot, requiresTermsAcceptance = false) =>
  renderToStaticMarkup(
    <I18nProvider i18n={setupI18n({ locale: 'en', messages: { en: {} } })}>
      <StopMarketConfirmModal {...review} isOpen requiresTermsAcceptance={requiresTermsAcceptance} />
    </I18nProvider>,
  )

const confirmButton = (html: string) => html.match(/<button[^>]*data-testid="stop-market-confirm-submit"[^>]*>/)?.[0]

describe('Stop Market creation review', () => {
  it('renders the complete estimate and alerts immediately without a live oracle, loading or Retry', () => {
    const html = renderReview(snapshot)
    expect(html).toContain('6%')
    expect(html).toContain('837') // 900 * (1 - 1% slippage - 6% fee).
    expect(html).toContain('Captured warning')
    expect(html).toContain('stop-market-min-fee-warning')
    expect(html).not.toContain('stop-market-confirm-fee-loading')
    expect(html).not.toContain('stop-market-confirm-min-receive-loading')
    expect(html).not.toContain('stop-market-confirm-fee-retry')
    expect(confirmButton(html)).toBeDefined()
    expect(confirmButton(html)).not.toMatch(/\sdisabled=""/)
  })

  it('uses the captured oracle for the close-trigger alert', () => {
    expect(renderReview(snapshot)).not.toContain('stop-market-confirm-close-trigger-warning')
    expect(renderReview({ ...snapshot, marketPrice: 90 })).toContain('stop-market-confirm-close-trigger-warning')
  })

  it('still requires terms acceptance and respects blocking warnings', () => {
    expect(confirmButton(renderReview(snapshot, true))).toMatch(/\sdisabled=""/)
    expect(
      confirmButton(renderReview({ ...snapshot, warnings: [{ type: 'warn', message: 'Blocked', blocking: true }] })),
    ).toMatch(/\sdisabled=""/)
  })
})
