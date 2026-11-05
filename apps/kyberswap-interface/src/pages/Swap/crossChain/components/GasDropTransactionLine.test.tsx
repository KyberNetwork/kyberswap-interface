import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it, vi } from 'vitest'

import { GasDropTransactionLine } from 'pages/Swap/crossChain/components/GasDropTransactionLine'

vi.mock('constants/tokens', () => ({ NativeCurrencies: { 42161: { decimals: 18, symbol: 'ETH' } } }))
vi.mock('hooks/useTokens', () => ({ useCurrencyV2: () => undefined }))
vi.mock('theme', () => ({ ExternalLink: () => null }))

it('renders gas delivered by execution detail even without a local gas quote', () => {
  const html = renderToStaticMarkup(
    <GasDropTransactionLine
      tx={{ targetChain: 42161, status: 'Success', gasDropStatus: { status: 'Delivered', amount: '1000000000000000' } }}
    />,
  )
  expect(html).toContain('+0.001 ETH gas')
})

it('hides the line when there is no gas drop or it was not executed', () => {
  expect(renderToStaticMarkup(<GasDropTransactionLine tx={{ targetChain: 42161, status: 'Success' }} />)).toBe('')
  expect(
    renderToStaticMarkup(
      <GasDropTransactionLine tx={{ targetChain: 42161, gasDropStatus: { status: 'NotExecuted' } }} />,
    ),
  ).toBe('')
})
