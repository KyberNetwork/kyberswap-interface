import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { CrossChainQuoteSummaryRows } from 'components/SwapForm/CrossChain/Quote/CrossChainQuoteSummary'
import { getQuoteWarning } from 'components/SwapForm/CrossChain/hooks/getQuoteWarning'
import type { Currency, QuoteParams } from 'pages/CrossChainSwap/adapters/types'
import { normalizeStreamQuote } from 'pages/CrossChainSwap/quote/parseStreamQuote'
import type { Quote } from 'pages/CrossChainSwap/registry'

vi.mock('components/Tooltip', () => ({ MouseoverTooltip: ({ children }: { children: ReactNode }) => children }))
vi.mock('hooks/useTheme', () => ({ default: () => ({ red: 'red', warning: 'orange' }) }))
vi.mock('theme', () => ({ ExternalLink: 'a' }))
i18n.loadAndActivate({ locale: 'en', messages: {} })

const params: QuoteParams = {
  fromChain: 1,
  toChain: 8453,
  fromToken: { decimals: 6, symbol: 'USDC' } as Currency,
  toToken: { decimals: 6, symbol: 'USDC' } as Currency,
  amount: '100000000',
  feeBps: 10,
  slippage: 50,
  tokenInUsd: 1,
  tokenOutUsd: 1,
  sender: 'sender',
  recipient: 'recipient',
}

const renderSummary = (inputUsd = 100, loading = false) => {
  const quote = {
    adapter: { getName: () => 'Relay' },
    isReadOnly: false,
    quote: normalizeStreamQuote(
      {
        provider: 'relay',
        outputAmount: '100000000',
        minOutputAmount: '97345678',
        inputUsd,
        outputUsd: 100,
        additionalFeeUsd: 1.23,
        timeEstimate: 30,
        contractAddress: 'spender',
        rawQuote: {},
      },
      params,
    ),
  } as Quote
  const warning = getQuoteWarning({ selectedQuote: quote, category: 'stablePair', isEvmPair: true, slippage: 50 })
  const html = renderToStaticMarkup(
    <I18nProvider i18n={i18n}>
      <CrossChainQuoteSummaryRows
        quote={quote}
        tokenOut={params.toToken}
        warning={warning}
        slippage={50}
        loading={loading}
      />
    </I18nProvider>,
  )
  return { html, warning }
}

describe('unified summary with an aggregator quote', () => {
  it('keeps quoted metrics visible while refreshing', () => {
    const { html } = renderSummary(100, true)
    expect(html).toContain('97.345678')
    expect(html).toContain('~30s')
    expect(html).toContain('$1.23')
    expect(html).toContain('&lt;0.01%')
    expect(html).not.toContain('react-loading-skeleton')
  })

  it('shows the provider minimum and additional fee from the stream contract', () => {
    const { html } = renderSummary()
    expect(html).toContain('97.345678')
    expect(html).not.toContain('99.5')
    expect(html).toContain('Additional Fee')
    expect(html).toContain('$1.23')
    expect(html).not.toContain('Protocol Fee')
  })

  it('treats a real zero price impact as known in both the warning and rendered value', () => {
    const { html, warning } = renderSummary()
    expect(warning.priceImpactInfo).toMatchObject({ isVeryHigh: false, message: '' })
    expect(html).toContain('&lt;0.01%')
  })

  it('keeps the EVM warning when the aggregator cannot calculate price impact', () => {
    const { html, warning } = renderSummary(0)
    expect(warning.priceImpactInfo).toMatchObject({
      isVeryHigh: true,
      message: 'Unable to calculate price impact',
    })
    expect(html).toContain('--')
    expect(html).not.toContain('&lt;0.01%')
  })
})
