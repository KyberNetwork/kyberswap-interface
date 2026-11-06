// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { Profiler, type ReactNode, act } from 'react'
import { createRoot } from 'react-dom/client'
import type { ScanTxStatusResponse } from 'services/crossChain/adapters/KyberCrossAdapter/api'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import {
  TransactionDetailButton,
  TransactionDetailProvider,
  useTransactionDetailTrigger,
} from 'components/SwapTransactions/TransactionDetail/TransactionDetailProvider'
import { getKyberCrossDetailQueryOptions } from 'components/SwapTransactions/TransactionDetail/kyberCrossDetailQuery'
import type { HistoryTransaction } from 'components/SwapTransactions/history'
import ThemeProvider from 'theme'

const scan = vi.hoisted(() => vi.fn())
vi.mock('services/crossChain/adapters/KyberCrossAdapter/api', () => ({ kyberCrossApi: { scanTxStatus: scan } }))
vi.mock('services/crossChain/adapters/KyberCrossAdapter/types', () => ({
  chainIdToKyberCrossChainName: { 1: 'ethereum' },
}))
vi.mock('components/Modal', () => ({
  default: ({ children }: { children: ReactNode }) => <div role="dialog">{children}</div>,
}))
vi.mock('services/crossChain/utils', () => ({ normalizeAdapterName: (name: string) => name.toLowerCase() }))
vi.mock('components/SwapTransactions/TransactionDetail/KyberCrossTransactionDetail', () => {
  const Detail = ({ tx }: { tx: HistoryTransaction }) => {
    const { data, isPending, errorUpdatedAt } = useQuery(getKyberCrossDetailQueryOptions(tx))
    return (
      <div
        data-detail={tx.sourceTxHash}
        data-source={data ? 'api' : isPending && !errorUpdatedAt ? 'loading' : 'local'}
      />
    )
  }
  return { default: Detail }
})

const tx = {
  adapter: 'KyberCross',
  sourceChain: 1,
  sourceTxHash: 'source-hash',
  usesBackendData: true,
} as HistoryTransaction
const response = (hash = tx.sourceTxHash) =>
  ({
    data: { route_execution: { source_tx_hash: hash, source_chain: 'ethereum', route_state: 'BRIDGE_PENDING' } },
  } as ScanTxStatusResponse)
const Row = ({ transaction }: { transaction: HistoryTransaction }) => (
  <div data-row {...useTransactionDetailTrigger(transaction)}>
    <span>Transaction</span>
    <a href="#explorer">Explorer</a>
  </div>
)
const Harness = ({ showRow = true, transaction = tx }: { showRow?: boolean; transaction?: HistoryTransaction }) => (
  <QueryClientProvider client={client}>
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
  </QueryClientProvider>
)
let client: QueryClient
let container: HTMLDivElement
let root: ReturnType<typeof createRoot>
const element = (selector: string) => {
  const found = container.querySelector<HTMLElement>(selector)
  if (!found) throw new Error(`Missing element: ${selector}`)
  return found
}
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } })
  scan.mockReset()
  scan.mockImplementation(async (hash: string) => response(hash))
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  client.clear()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

it('loads the first execution on the button and opens with cached data without a second request', async () => {
  const openedContent: (string | null)[] = []
  let resolve!: (value: ScanTxStatusResponse) => void
  scan.mockReturnValue(
    new Promise<ScanTxStatusResponse>(done => {
      resolve = done
    }),
  )
  await act(async () =>
    root.render(
      <Profiler
        id="detail"
        onRender={() => {
          const modal = container.querySelector('[role="dialog"]')
          if (modal) openedContent.push(modal.querySelector('[data-detail]')?.getAttribute('data-source') ?? null)
        }}
      >
        <Harness />
      </Profiler>,
    ),
  )
  await act(async () => element('[data-history] button').click())
  expect(element('[data-history] button').hasAttribute('disabled')).toBe(true)
  expect(container.querySelector('[role="dialog"]')).toBeNull()
  await act(async () => element('[data-history] button').click())
  expect(scan).toHaveBeenCalledTimes(1)

  await act(async () => resolve(response()))
  expect(element('[data-detail]').getAttribute('data-source')).toBe('api')
  expect(element('[data-history] button').hasAttribute('disabled')).toBe(false)
  expect(scan).toHaveBeenCalledTimes(1)
  expect(openedContent).toContain('api')
  expect(openedContent).not.toContain(null)
})

it('opens cached details while stale data refreshes in the modal', async () => {
  client.setQueryData(getKyberCrossDetailQueryOptions(tx).queryKey, response().data.route_execution, {
    updatedAt: Date.now() - 10_000,
  })
  scan.mockReturnValue(new Promise(() => undefined))
  await act(async () => root.render(<Harness />))
  await act(async () => element('[data-history] button').click())
  expect(element('[data-detail]').getAttribute('data-source')).toBe('api')
  expect(scan).toHaveBeenCalledTimes(1)
})

it('reopens the local fallback without button loading after a failed request and recovers through polling', async () => {
  vi.useFakeTimers()
  scan.mockRejectedValue(new Error('Not indexed yet'))
  await act(async () => root.render(<Harness />))
  await act(async () => element('[data-history] button').click())
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1_100)
  })
  expect(element('[data-detail]').getAttribute('data-source')).toBe('local')
  expect(element('[data-history] button').hasAttribute('disabled')).toBe(false)
  expect(scan).toHaveBeenCalledTimes(2)

  await act(async () => element('button[aria-label="Close"]').click())
  act(() => element('[data-history] button').click())
  expect(element('[data-detail]').getAttribute('data-source')).toBe('local')
  expect(element('[data-history] button').getAttribute('aria-busy')).toBe('false')
  expect(element('[data-history] button').hasAttribute('disabled')).toBe(false)
  expect(scan).toHaveBeenCalledTimes(2)

  scan.mockResolvedValue(response())
  await act(async () => {
    await vi.advanceTimersByTimeAsync(5_001)
  })
  expect(element('[data-detail]').getAttribute('data-source')).toBe('api')
})

it('does not let an older request replace a more recently selected transaction', async () => {
  let resolveFirst!: (value: ScanTxStatusResponse) => void
  scan.mockReturnValueOnce(
    new Promise<ScanTxStatusResponse>(done => {
      resolveFirst = done
    }),
  )
  await act(async () => root.render(<Harness />))
  await act(async () => element('[data-history] button').click())

  const next = { ...tx, sourceTxHash: 'next-hash' }
  await act(async () => root.render(<Harness transaction={next} />))
  await act(async () => element('[data-history] button').click())
  expect(element('[data-detail]').getAttribute('data-detail')).toBe(next.sourceTxHash)

  await act(async () => element('button[aria-label="Close"]').click())
  await act(async () => resolveFirst(response()))
  expect(container.querySelector('[role="dialog"]')).toBeNull()
})

it('keeps a completed request in cache without reopening an unmounted provider', async () => {
  let resolve!: (value: ScanTxStatusResponse) => void
  scan.mockReturnValue(
    new Promise<ScanTxStatusResponse>(done => {
      resolve = done
    }),
  )
  await act(async () => root.render(<Harness />))
  await act(async () => element('[data-history] button').click())
  await act(async () => root.render(null))
  await act(async () => resolve(response()))

  await act(async () => root.render(<Harness />))
  expect(container.querySelector('[role="dialog"]')).toBeNull()
  await act(async () => element('[data-history] button').click())
  expect(element('[data-detail]').getAttribute('data-source')).toBe('api')
  expect(scan).toHaveBeenCalledTimes(1)
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

it('reopens cached details synchronously without entering button loading', async () => {
  await act(async () => root.render(<Harness />))
  await act(async () => element('[data-history] button').click())
  await act(async () => element('button[aria-label="Close"]').click())
  expect(container.querySelector('[role="dialog"]')).toBeNull()

  act(() => element('[data-history] button').click())
  expect(element('[data-detail]').getAttribute('data-source')).toBe('api')
  expect(element('[data-history] button').hasAttribute('disabled')).toBe(false)
  expect(scan).toHaveBeenCalledTimes(1)
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
