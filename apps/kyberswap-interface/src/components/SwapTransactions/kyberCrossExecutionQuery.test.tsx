// @vitest-environment happy-dom
import {
  QueryClient,
  QueryClientProvider,
  type UseQueryResult,
  focusManager,
  onlineManager,
  useQuery,
} from '@tanstack/react-query'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { ScanTxStatusResponse, TrackingExecution } from 'services/crossChain/adapters/KyberCrossAdapter/api'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { HistoryTransaction } from 'components/SwapTransactions/history'
import {
  getKyberCrossDetailQueryOptions,
  useHistoryGasDrop,
} from 'components/SwapTransactions/kyberCrossExecutionQuery'

const scan = vi.hoisted(() => vi.fn())
vi.mock('services/crossChain/adapters/KyberCrossAdapter/api', () => ({ kyberCrossApi: { scanTxStatus: scan } }))
vi.mock('services/crossChain/adapters/KyberCrossAdapter/types', () => ({
  chainIdToKyberCrossChainName: { 1: 'ethereum' },
}))

describe('detail polling', () => {
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
    client = new QueryClient()
    root = createRoot(document.createElement('div'))
  })
  afterEach(async () => {
    await act(async () => root.unmount())
    client.clear()
    focusManager.setFocused(undefined)
    onlineManager.setOnline(true)
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

  it.each(['SUCCESS', 'FAILED', 'REFUNDED'] as const)(
    'never automatically refetches a final %s execution on focus, reconnect, invalidation or reopen',
    async status => {
      scan.mockResolvedValue(response(tx.sourceTxHash, status))
      await render()
      await advance(1)
      expect(result.data?.route_state).toBe(status)
      await advance(30_000)
      await act(async () => {
        focusManager.setFocused(false)
        focusManager.setFocused(true)
        onlineManager.setOnline(false)
        onlineManager.setOnline(true)
        await client.invalidateQueries({ queryKey: getKyberCrossDetailQueryOptions(tx).queryKey })
      })
      await advance(1)
      await act(async () => root.render(null))
      await advance(6 * 60_000)
      await render()
      await advance(30_000)
      expect(result.data?.route_state).toBe(status)
      expect(scan).toHaveBeenCalledTimes(1)
    },
  )

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
})

describe('history Gas Drop', () => {
  const tx = { adapter: 'KyberCross', sourceChain: 1, sourceTxHash: '0x123' } as HistoryTransaction
  const execution = (fields: Partial<TrackingExecution> = {}): TrackingExecution =>
    ({
      source_tx_hash: tx.sourceTxHash,
      source_chain: 'ethereum',
      route_state: 'SUCCESS',
      data: {},
      ...fields,
    } as TrackingExecution)
  const delivered = execution({ data: { gas_drop: { token_in: '0x1', token_out: '0x2', output_amount: '1000' } } })
  let root: ReturnType<typeof createRoot>
  let client: QueryClient
  let result: ReturnType<typeof useHistoryGasDrop>
  const Harness = ({ transaction }: { transaction: HistoryTransaction }) => {
    result = useHistoryGasDrop(transaction)
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
  const advance = (ms: number) =>
    act(async () => {
      await vi.advanceTimersByTimeAsync(ms)
    })

  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    scan.mockReset()
    client = new QueryClient()
    root = createRoot(document.createElement('div'))
  })
  afterEach(async () => {
    await act(async () => root.unmount())
    client.clear()
    focusManager.setFocused(undefined)
    onlineManager.setOnline(true)
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  const gasDrop = { amount: '10', minAmount: '9', inputToken: '0x1' }

  it.each([
    { status: 'Delivered' as const, amount: '20' },
    { status: 'Failed' as const },
    { status: 'NotExecuted' as const },
  ])('keeps final local Gas Drop ahead of API/cache: $status', async gasDropStatus => {
    client.setQueryData(getKyberCrossDetailQueryOptions(tx).queryKey, delivered)
    await render({ ...tx, status: 'Success', gasDrop, gasDropStatus })
    await advance(10_000)
    expect(scan).not.toHaveBeenCalled()
    expect(result).toEqual(gasDropStatus)
  })

  it.each([undefined, { status: 'Pending' as const }, { status: 'Delivered' as const }])(
    'fills incomplete local Gas Drop once after backend settlement: %j',
    async gasDropStatus => {
      scan.mockResolvedValue({ data: { route_execution: delivered } })
      await render({ ...tx, status: 'Success', gasDrop, gasDropStatus })
      await advance(1)
      expect(result).toEqual({ status: 'Delivered', amount: '1000' })
      await advance(30_000)
      expect(scan).toHaveBeenCalledTimes(1)
    },
  )

  it('waits for local swap settlement before its one lookup and recovers stale Pending', async () => {
    const local = { ...tx, gasDrop, gasDropStatus: { status: 'Pending' as const } }
    scan.mockResolvedValue({ data: { route_execution: delivered } })
    await render({ ...local, status: 'Processing' })
    await advance(10_000)
    expect(result).toEqual({ status: 'Pending' })
    expect(scan).not.toHaveBeenCalled()
    await render({ ...local, status: 'Success' })
    await advance(1)
    expect(result).toEqual({ status: 'Delivered', amount: '1000' })
    await act(async () => root.render(null))
    await render({ ...local, status: 'Success' })
    await advance(30_000)
    expect(scan).toHaveBeenCalledTimes(1)
  })

  it('uses completed modal data instead of stale local Pending without fetching', async () => {
    client.setQueryData(getKyberCrossDetailQueryOptions(tx).queryKey, delivered)
    await render({ ...tx, status: 'Success', gasDrop, gasDropStatus: { status: 'Pending' } })
    expect(result).toEqual({ status: 'Delivered', amount: '1000' })
    expect(scan).not.toHaveBeenCalled()
  })

  it('uses the local quote to identify failed gas delivery in a completed execution', async () => {
    scan.mockResolvedValue({ data: { route_execution: execution() } })
    await render({ ...tx, status: 'Success', gasDrop, gasDropStatus: { status: 'Pending' } })
    await advance(1)
    expect(result).toEqual({ status: 'Failed' })
  })

  it('preserves incomplete local data when the one lookup fails', async () => {
    scan.mockRejectedValue(new Error('Not found'))
    await render({ ...tx, status: 'Success', gasDrop, gasDropStatus: { status: 'Pending' } })
    await advance(30_000)
    expect(result).toEqual({ status: 'Pending' })
    expect(scan).toHaveBeenCalledTimes(1)
  })

  it('loads Gas Drop without local data and reuses the modal cache on remount', async () => {
    scan.mockResolvedValue({ data: { route_execution: delivered } })
    await render()
    await advance(1)
    expect(scan).toHaveBeenCalledWith(tx.sourceTxHash)
    expect(result).toEqual({ status: 'Delivered', amount: '1000' })
    expect(client.getQueryData(getKyberCrossDetailQueryOptions(tx).queryKey)).toEqual(delivered)
    await act(async () => root.render(null))
    await advance(6 * 60_000)
    await render()
    expect(scan).toHaveBeenCalledTimes(1)
  })

  it('does not poll or refetch a cached pending execution when history remounts', async () => {
    scan.mockResolvedValue({ data: { route_execution: execution({ route_state: 'GAS_DROP_PENDING' }) } })
    await render()
    await advance(1)
    expect(result).toEqual({ status: 'Pending' })
    await advance(30_000)
    await act(async () => root.render(null))
    await render()
    expect(result).toEqual({ status: 'Pending' })
    expect(scan).toHaveBeenCalledTimes(1)

    await act(async () => {
      client.setQueryData(getKyberCrossDetailQueryOptions(tx).queryKey, delivered)
    })
    await advance(1)
    expect(result).toEqual({ status: 'Delivered', amount: '1000' })
    expect(scan).toHaveBeenCalledTimes(1)
  })

  it('does not invent Gas Drop for an execution without it or fetch other providers', async () => {
    scan.mockResolvedValue({ data: { route_execution: execution() } })
    await render()
    await advance(1)
    expect(result).toBeUndefined()
    await render({ ...tx, adapter: 'Relay', sourceTxHash: '0x456' })
    await advance(10_000)
    expect(result).toBeUndefined()
    expect(scan).toHaveBeenCalledTimes(1)
  })

  it('never retries a failed row on timers, focus, reconnect or remount', async () => {
    scan.mockRejectedValue(new Error('Not found'))
    await render()
    await advance(30_000)
    expect(result).toBeUndefined()
    await act(async () => {
      focusManager.setFocused(false)
      focusManager.setFocused(true)
      onlineManager.setOnline(false)
      onlineManager.setOnline(true)
    })
    await advance(1)
    await act(async () => root.render(null))
    await advance(6 * 60_000)
    await render()
    await advance(30_000)
    expect(scan).toHaveBeenCalledTimes(1)
  })
})
