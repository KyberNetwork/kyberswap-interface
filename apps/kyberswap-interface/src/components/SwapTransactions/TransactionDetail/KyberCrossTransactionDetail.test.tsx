// @vitest-environment happy-dom
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { TrackingExecution } from 'services/crossChain/adapters/KyberCrossAdapter/api'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import KyberCrossTransactionDetail from 'components/SwapTransactions/TransactionDetail/KyberCrossTransactionDetail'
import type { HistoryTransaction } from 'components/SwapTransactions/history'
import ThemeProvider from 'theme'

const mocks = vi.hoisted(() => ({ query: vi.fn(), resolveToken: vi.fn(), prices: vi.fn() }))
vi.mock('@tanstack/react-query', async importOriginal => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQuery: mocks.query,
}))
vi.mock('services/crossChain/factory', () => ({
  CrossChainSwapFactory: { getKyberCrossBridgeSources: () => [] },
}))
vi.mock('services/crossChain/utils', () => ({
  getChainName: (chain: number) => String(chain),
  normalizeAdapterName: (name: string) => name.toLowerCase(),
}))
vi.mock('components/TokenLogo/TokenLogoWithChain', () => ({ TokenLogoWithChain: () => null }))
vi.mock('components/SwapTransactions/useHistoryTokens', () => ({
  useHistoryTokens: () => ({ resolve: mocks.resolveToken, loading: false }),
}))
vi.mock('state/tokenPrices/hooks', () => ({ useTokenPrices: mocks.prices }))

const tx = {
  timestamp: 1000,
  id: 'local-route',
  sourceTxHash: '0xsource',
  sourceChain: 1,
  targetChain: 8453,
  sender: '0xsender',
  recipient: '0xrecipient',
  adapter: 'KyberCross',
  status: 'Processing',
  sourceToken: { symbol: 'IN', decimals: 0, address: '0xinput' },
  targetToken: { symbol: 'OUT', decimals: 0, address: '0xoutput' },
  inputAmount: '100',
  outputAmount: '90',
  amountInUsd: 100,
  amountOutUsd: 90,
  usesBackendData: false,
} as HistoryTransaction

const execution: TrackingExecution = {
  route_plan_id: 'api-route',
  source_tx_hash: '0xsource',
  source_chain: 'ethereum',
  dest_chain: 'base',
  from_address: '0xsender',
  to_address: '0xrecipient',
  token_in: '0xinput',
  token_out: '0xoutput',
  bridge_provider: 'relay',
  flow_type: 'bridge_only',
  route_state: 'BRIDGE_PENDING',
  data: {},
}

let root: ReturnType<typeof createRoot>
let container: HTMLDivElement

const render = (selected = tx) =>
  act(async () =>
    root.render(
      <I18nProvider i18n={i18n}>
        <ThemeProvider>
          <KyberCrossTransactionDetail tx={selected} />
        </ThemeProvider>
      </I18nProvider>,
    ),
  )
const showExecution = async (data: TrackingExecution) => {
  mocks.query.mockReturnValue({ data, isError: false, isPending: false })
  await render()
}

const transactionLinks = () => [...container.querySelectorAll('a[href]')].map(link => link.getAttribute('href'))

beforeEach(() => {
  i18n.load('en', {})
  i18n.activate('en')
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  mocks.resolveToken.mockImplementation((token: unknown) => token)
  mocks.prices.mockReturnValue({})
  mocks.query.mockReturnValue({ isError: true, isPending: false, errorUpdatedAt: 1 })
  container = document.createElement('div')
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  vi.unstubAllGlobals()
})

it('shows processing for non-final execution states', async () => {
  for (const route_state of ['BRIDGE_PENDING', 'BRIDGE_FAILED', 'SWAP_REFUND_PENDING'] as const) {
    await showExecution({ ...execution, route_state })
    expect(container.querySelector('[role="status"]')?.textContent).toBe('Processing')
  }
})

it('renders available history data while the first execution is loading', async () => {
  mocks.query.mockReturnValue({ isPending: true, errorUpdatedAt: 0 })
  await render()
  expect(container.textContent).toContain('100 IN')
  expect(container.textContent).toContain('90 OUT')
  expect(container.querySelector('[role="status"]')?.textContent).toBe('Processing')
  expect(transactionLinks()).toContain('https://etherscan.io/tx/0xsource')
})

it.each([
  ['SUCCESS', 'Success', 'Completed'],
  ['FAILED', 'Failed', 'Failed'],
  ['REFUNDED', 'Refunded', 'Refunded'],
] as const)(
  'shows %s from execution or the selected fallback, including during refresh',
  async (route_state, status, label) => {
    mocks.query.mockReturnValue({
      data: { ...execution, route_state },
      isPending: false,
      isFetching: true,
      isError: false,
    })
    await render()
    expect(container.querySelector('[role="status"]')?.textContent).toBe(label)

    mocks.query.mockReturnValue({ isPending: false, isError: true, errorUpdatedAt: 1 })
    await render({ ...tx, status })
    expect(container.querySelector('[role="status"]')?.textContent).toBe(label)
  },
)

it('uses the selected transaction on failure and switches to execution details after recovery', async () => {
  await render()
  expect(container.textContent).toContain('90 OUT')

  await showExecution({ ...execution, dest_tx_hash: '0xapi-fill' })
  expect(transactionLinks()).toContain('https://basescan.org/tx/0xapi-fill')
})

it('keeps cached execution details when a refresh fails and updates them after recovery', async () => {
  const cached = { ...execution, dest_tx_hash: '0xcached' }
  const selected = { ...tx, status: 'Failed' as const, targetTxHash: '0xselected' }
  mocks.query.mockReturnValue({ data: cached, isError: false, isPending: false })
  await render(selected)

  mocks.query.mockReturnValue({
    data: cached,
    isError: true,
    isPending: false,
    errorUpdatedAt: 1,
  })
  await render(selected)
  expect(container.querySelector('[role="status"]')?.textContent).toBe('Processing')
  expect(transactionLinks()).toContain('https://basescan.org/tx/0xcached')
  expect(transactionLinks()).not.toContain('https://basescan.org/tx/0xselected')

  await showExecution({ ...execution, route_state: 'SUCCESS', dest_tx_hash: '0xrecovered' })
  expect(container.querySelector('[role="status"]')?.textContent).toBe('Completed')
  expect(transactionLinks()).toContain('https://basescan.org/tx/0xrecovered')
  expect(transactionLinks()).not.toContain('https://basescan.org/tx/0xcached')
})

it('links distinct destination transactions without duplicating a shared receipt hash', async () => {
  const completed: TrackingExecution = {
    ...execution,
    route_state: 'SUCCESS',
    dest_tx_hash: '0xfinal',
    data: {
      bridge: {
        source: { tx_hash: '0xdeposit', token: '0xtoken', amount: '99' },
        dest: { tx_hash: '0xreceive', token: '0xtoken', amount: '99' },
      },
    },
  }
  await showExecution(completed)
  expect(transactionLinks()).toEqual(
    expect.arrayContaining(['https://basescan.org/tx/0xreceive', 'https://basescan.org/tx/0xfinal']),
  )

  await showExecution({ ...completed, dest_tx_hash: '0xreceive' })
  expect(transactionLinks().filter(href => href === 'https://basescan.org/tx/0xreceive')).toHaveLength(1)
  expect(transactionLinks()).not.toContain('https://basescan.org/tx/0xfinal')
})

it.each(['REFUNDED', 'SWAP_REFUND_PENDING'] as const)(
  'keeps destination receipts without claiming a swap for %s',
  async route_state => {
    await showExecution({
      ...execution,
      flow_type: 'swap_bridge_swap',
      route_state,
      dest_tx_hash: '0xfinal',
      data: {
        bridge: {
          source: { tx_hash: '0xdeposit', token: '0xtoken', amount: '99' },
          dest: { tx_hash: '0xreceive', token: '0xtoken', amount: '99' },
        },
      },
    })
    expect(transactionLinks()).toEqual(
      expect.arrayContaining(['https://basescan.org/tx/0xreceive', 'https://basescan.org/tx/0xfinal']),
    )
    expect(container.textContent).toContain('Destination Receive')
    expect(container.textContent).toContain('Destination Transaction')
    expect(container.textContent).not.toContain('Destination Swap')
  },
)

it('converts both fees using token decimals and the price on each fee chain', async () => {
  mocks.resolveToken.mockImplementation((token: unknown) =>
    token === '0xfee' ? { symbol: 'FEE', decimals: 6 } : token,
  )
  mocks.prices.mockImplementation((_addresses: string[], chain: number) => ({ '0xfee': chain === 1 ? 2 : 3 }))
  await showExecution({
    ...execution,
    data: {
      fees: [
        { fee_type: 'partner_fee', chain: 'ethereum', token: '0xfee', amount: '1250000', recipient: '0xpartner' },
        { fee_type: 'protocol_fee', chain: 'base', token: '0xfee', amount: '2000000', recipient: '0xprotocol' },
      ],
    },
  })

  expect(container.textContent).toContain('1.25 FEE (~$2.5)')
  expect(container.textContent).toContain('2 FEE (~$6)')
})

it.each([
  ['1000000', 0],
  ['invalid', 2],
])('omits fee USD when the amount %s or price %s is unavailable', async (amount, price) => {
  mocks.resolveToken.mockImplementation((token: unknown) =>
    token === '0xfee' ? { symbol: 'FEE', decimals: 6 } : token,
  )
  mocks.prices.mockReturnValue({ '0xfee': price })
  await showExecution({
    ...execution,
    data: {
      fees: [{ fee_type: 'partner_fee', chain: 'ethereum', token: '0xfee', amount, recipient: '0xpartner' }],
    },
  })

  expect(container.textContent).not.toContain('(~$')
})

it.each([
  ['ethereum', 1, '1250000', '1.25', '~$2.5'],
  ['base', 8453, '0', '0', '~$0'],
  ['base', 8453, '1250000', '1.25', '~$3.75'],
] as const)(
  'shows the actual refunded asset and amount on %s instead of the quoted output',
  async (chain, chainId, amount, formatted, usd) => {
    mocks.prices.mockImplementation((_addresses: string[], priceChain: number) => ({
      '0xrefund': priceChain === 1 ? 2 : 3,
    }))
    mocks.resolveToken.mockImplementation((token: unknown, tokenChain: number) =>
      token === '0xrefund' && tokenChain === chainId ? { symbol: 'REFUND', decimals: 6 } : token,
    )
    await showExecution({
      ...execution,
      route_state: 'REFUNDED',
      data: { refund: { chain, token: '0xrefund', amount } },
    })

    const refundCard = [...container.querySelectorAll('span')].find(
      span => span.textContent === 'Refunded to your wallet',
    )?.parentElement
    expect(refundCard?.textContent).toContain(`${formatted} REFUND`)
    expect(refundCard?.textContent).toContain(usd)
    expect(refundCard?.textContent).not.toContain('90 OUT')
    expect(refundCard?.textContent).not.toContain('$90')
  },
)

it('does not display unknown history USD as zero dollars', async () => {
  await render({ ...tx, amountInUsd: 0, amountOutUsd: 0 })
  expect(container.textContent).not.toContain('~$0')
})

it('does not present the quoted destination as the refund asset when refund details are missing', async () => {
  await render({ ...tx, status: 'Refunded' })
  expect(container.textContent).toContain('Refund details unavailable')
  expect(container.textContent).not.toContain('OUT')

  await showExecution({ ...execution, route_state: 'REFUNDED' })
  expect(container.textContent).toContain('Refund details unavailable')
  expect(container.textContent).not.toContain('OUT')
})

it('preserves delivered gas when refund details are unavailable locally or from execution', async () => {
  await render({
    ...tx,
    status: 'Refunded',
    gasDropStatus: { status: 'Delivered', amount: '1000000000000000' },
  })
  expect(container.textContent).toContain('Refund details unavailable')
  expect(container.textContent).toContain('0.001 ETH')

  await showExecution({
    ...execution,
    route_state: 'REFUNDED',
    data: { gas_drop: { token_in: '0xinput', token_out: '0xoutput', output_amount: '2000000000000000' } },
  })
  expect(container.textContent).toContain('Refund details unavailable')
  expect(container.textContent).toContain('0.002 ETH')
})

it.each(['ethereum', 'base'] as const)('shows the sender as the refund recipient on %s', async chain => {
  const sender = '0x1111111111111111111111111111111111111111'
  const recipient = '0x2222222222222222222222222222222222222222'
  await showExecution({
    ...execution,
    from_address: sender,
    to_address: recipient,
    route_state: 'REFUNDED',
    data: { refund: { chain, token: '0xrefund', amount: '100' } },
  })

  const addresses = [...container.querySelectorAll('[title]')].map(element => element.getAttribute('title'))
  expect(addresses.filter(address => address === sender)).toHaveLength(2)
  expect(addresses).not.toContain(recipient)
})
