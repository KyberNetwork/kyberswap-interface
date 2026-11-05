// @vitest-environment happy-dom
import { type ReactNode, act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import {
  TransactionDetailButton,
  TransactionDetailProvider,
  useTransactionDetailTrigger,
} from 'components/SwapTransactions/TransactionDetail/TransactionDetailProvider'
import type { HistoryTransaction } from 'components/SwapTransactions/history'
import ThemeProvider from 'theme'

vi.mock('components/Modal', () => ({
  default: ({ children }: { children: ReactNode }) => <div role="dialog">{children}</div>,
}))
vi.mock('services/crossChain/utils', () => ({ normalizeAdapterName: (name: string) => name.toLowerCase() }))
let detailPending = false
const pendingDetail = new Promise<never>(() => undefined)
vi.mock('components/SwapTransactions/TransactionDetail/KyberCrossTransactionDetail', () => ({
  default: ({ tx }: { tx: HistoryTransaction }) => {
    if (detailPending) throw pendingDetail
    return <div data-detail={tx.sourceTxHash} />
  },
}))

const tx = {
  adapter: 'KyberCross',
  sourceChain: 1,
  sourceTxHash: 'source-hash',
  usesBackendData: true,
} as HistoryTransaction
const Row = ({ transaction }: { transaction: HistoryTransaction }) => (
  <div data-row {...useTransactionDetailTrigger(transaction)}>
    <span>Transaction</span>
    <a href="#explorer">Explorer</a>
  </div>
)
const Harness = ({ showRow = true, transaction = tx }: { showRow?: boolean; transaction?: HistoryTransaction }) => (
  <ThemeProvider>
    <TransactionDetailProvider>
      {showRow && (
        <>
          <Row transaction={transaction} />
          <div data-history>
            <span>KyberCross</span>
            <TransactionDetailButton tx={transaction} />
          </div>
        </>
      )}
    </TransactionDetailProvider>
  </ThemeProvider>
)
let container: HTMLDivElement
let root: ReturnType<typeof createRoot>
const element = (selector: string) => {
  const found = container.querySelector<HTMLElement>(selector)
  if (!found) throw new Error(`Missing element: ${selector}`)
  return found
}
beforeEach(() => {
  detailPending = false
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  vi.unstubAllGlobals()
})

it('opens history detail only from its button and keeps selection after the row disappears', async () => {
  await act(async () => root.render(<Harness />))
  await act(async () => element('[data-history] span').click())
  expect(container.querySelector('[role="dialog"]')).toBeNull()

  await act(async () => element('[data-history] button').click())
  expect(container.querySelector('[data-detail]')?.getAttribute('data-detail')).toBe(tx.sourceTxHash)

  await act(async () => root.render(<Harness showRow={false} />))
  expect(container.querySelector('[role="dialog"]')).not.toBeNull()
  await act(async () => element('button[aria-label="Close"]').click())
  expect(container.querySelector('[role="dialog"]')).toBeNull()

  const next = { ...tx, sourceTxHash: 'next-hash' }
  await act(async () => root.render(<Harness transaction={next} />))
  await act(async () => element('[data-history] button').click())
  expect(container.querySelector('[data-detail]')?.getAttribute('data-detail')).toBe(next.sourceTxHash)
})

it('keeps the common close control available while detail content is loading', async () => {
  detailPending = true
  await act(async () => root.render(<Harness />))
  await act(async () => element('[data-row]').click())
  expect(container.querySelector('[role="dialog"]')).not.toBeNull()
  expect(container.querySelector('[data-detail]')).toBeNull()

  await act(async () => element('button[aria-label="Close"]').click())
  expect(container.querySelector('[role="dialog"]')).toBeNull()
})

it('preserves explorer clicks and opens with keyboard activation only on the row', async () => {
  await act(async () => root.render(<Harness />))
  await act(async () => element('a').click())
  expect(container.querySelector('[role="dialog"]')).toBeNull()

  await act(async () =>
    element('[data-row]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })),
  )
  expect(container.querySelector('[role="dialog"]')).not.toBeNull()
})

it('leaves other providers non-interactive', async () => {
  await act(async () => root.render(<Harness transaction={{ ...tx, adapter: 'Relay' }} />))
  expect(container.querySelector('[data-history] button')).toBeNull()
  await act(async () => element('[data-row]').click())
  expect(container.querySelector('[role="dialog"]')).toBeNull()
})

it('opens detail before the row is confirmed by the backend', async () => {
  await act(async () => root.render(<Harness transaction={{ ...tx, usesBackendData: false, status: 'Success' }} />))
  await act(async () => element('[data-history] button').click())
  expect(container.querySelector('[data-detail]')?.getAttribute('data-detail')).toBe(tx.sourceTxHash)
})
