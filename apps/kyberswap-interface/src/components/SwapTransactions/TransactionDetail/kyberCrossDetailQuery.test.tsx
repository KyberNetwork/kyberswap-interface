// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider, type UseQueryResult, useQuery } from '@tanstack/react-query'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { ScanTxStatusResponse, TrackingExecution } from 'services/crossChain/adapters/KyberCrossAdapter/api'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { getKyberCrossDetailQueryOptions } from 'components/SwapTransactions/TransactionDetail/kyberCrossDetailQuery'
import type { HistoryTransaction } from 'components/SwapTransactions/history'

const scan = vi.hoisted(() => vi.fn())
vi.mock('services/crossChain/adapters/KyberCrossAdapter/api', () => ({ kyberCrossApi: { scanTxStatus: scan } }))
vi.mock('services/crossChain/adapters/KyberCrossAdapter/types', () => ({
  chainIdToKyberCrossChainName: { 1: 'ethereum' },
}))

const tx = { sourceChain: 1, sourceTxHash: '0x123' } as HistoryTransaction
const response = (hash: string, route_state: TrackingExecution['route_state'] = 'BRIDGE_PENDING') =>
  ({
    data: { route_execution: { source_tx_hash: hash, source_chain: 'ethereum', route_state } },
  } as ScanTxStatusResponse)
let root: ReturnType<typeof createRoot>
let client: QueryClient
let result: UseQueryResult<TrackingExecution>
const Harness = ({ transaction }: { transaction: HistoryTransaction }) => {
  result = useQuery(getKyberCrossDetailQueryOptions(transaction))
  return null
}
const render = (transaction = tx) =>
  act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <Harness transaction={transaction} />
      </QueryClientProvider>,
    ),
  )
const advance = async (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  scan.mockReset()
  client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } })
  root = createRoot(document.createElement('div'))
})
afterEach(async () => {
  await act(async () => root.unmount())
  client.clear()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

it('polls pending executions and stops on a terminal state', async () => {
  scan.mockResolvedValueOnce(response(tx.sourceTxHash)).mockResolvedValue(response(tx.sourceTxHash, 'SUCCESS'))
  await render()
  await advance(1)
  expect(result.data?.route_state).toBe('BRIDGE_PENDING')
  await advance(5_000)
  expect(result.data?.route_state).toBe('SUCCESS')
  await advance(30_000)
  expect(scan).toHaveBeenCalledTimes(2)
})

it('keeps a late response in its own cache without displaying it for a newly selected transaction', async () => {
  let resolveFirst: (value: ScanTxStatusResponse) => void = () => {
    throw new Error('Request not started')
  }
  scan
    .mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveFirst = resolve
        }),
    )
    .mockResolvedValue(response('0x456'))
  await render()
  await render({ ...tx, sourceTxHash: '0x456' })
  await act(async () => resolveFirst(response(tx.sourceTxHash)))
  await advance(1)
  expect(result.data?.source_tx_hash).toBe('0x456')
  expect(client.getQueryData(['kybercross-execution', 1, tx.sourceTxHash])).toEqual(
    response(tx.sourceTxHash).data.route_execution,
  )
})

it('surfaces a mismatched API response as an error instead of displaying another execution', async () => {
  scan.mockResolvedValue(response('0x456'))
  await render()
  await advance(2_000)
  expect(result.isError).toBe(true)
  expect(result.data).toBeUndefined()
})

it('lets the active request finish but stops polling when detail closes', async () => {
  let resolveRequest: (value: ScanTxStatusResponse) => void = () => {
    throw new Error('Request not started')
  }
  scan.mockImplementation(
    () =>
      new Promise(resolve => {
        resolveRequest = resolve
      }),
  )
  await render()
  await act(async () => root.render(null))
  await act(async () => resolveRequest(response(tx.sourceTxHash)))
  await advance(30_000)
  expect(scan).toHaveBeenCalledTimes(1)
  expect(client.getQueryData(['kybercross-execution', 1, tx.sourceTxHash])).toEqual(
    response(tx.sourceTxHash).data.route_execution,
  )
})

it('keeps polling every five seconds after an error even when the local transaction is complete', async () => {
  scan.mockRejectedValue(new Error('Not indexed yet'))
  await render({ ...tx, status: 'Success' })
  await advance(2_000)
  expect(result.isError).toBe(true)
  expect(result.data).toBeUndefined()
  scan.mockResolvedValue(response(tx.sourceTxHash, 'SUCCESS'))
  await advance(5_000)
  expect(result.isError).toBe(false)
  expect(result.data?.route_state).toBe('SUCCESS')
  const calls = scan.mock.calls.length
  await advance(15_000)
  expect(scan).toHaveBeenCalledTimes(calls)
})
