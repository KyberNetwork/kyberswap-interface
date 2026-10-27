// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import type { NormalizedTxResponse } from 'pages/Swap/crossChain/adapters/types'
import type { Quote } from 'pages/Swap/crossChain/registry'

import { useCrossChainExecution } from './useCrossChainExecution'

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  enqueue: vi.fn(),
  dispatch: vi.fn(),
  track: vi.fn(),
  mixpanel: vi.fn(),
  entries: [] as { key: string }[],
}))
vi.mock('constants/env', () => ({ CROSSCHAIN_AGGREGATOR_API: 'https://execution.test' }))
vi.mock('@near-wallet-selector/react-hook', () => ({ useWalletSelector: () => ({}) }))
vi.mock('@solana/wallet-adapter-react', () => ({ useWallet: () => ({}), useConnection: () => ({ connection: {} }) }))
vi.mock('components/Web3Provider/BitcoinProvider', () => ({
  useBitcoinWallet: () => ({ walletInfo: {}, availableWallets: [] }),
}))
vi.mock('hooks/useGatedWalletClient', () => ({
  useGatedWalletClient: () => ({ data: { account: { address: 'sender' } } }),
}))
vi.mock('react-router-dom', () => ({ useSearchParams: () => [new URLSearchParams()] }))
vi.mock('services/blackjack', () => ({
  useLazyCheckBlackjackQuery: () => [async () => ({ data: { blacklisted: false } })],
}))
vi.mock('components/TipLinkGeneratorModal/shared', () => ({ getTipLinkAttribution: () => undefined }))
vi.mock('pages/Swap/crossChain/adapters/RelayAdapter/relaySolanaWallet', () => ({ adaptRelaySolanaWallet: () => ({}) }))
vi.mock('pages/Swap/crossChain/tracking', () => ({ getSwapTrackingData: () => ({}) }))
vi.mock('pages/Swap/crossChain/utils', () => ({ getChainName: () => 'Ethereum', isQuoteExecutable: () => true }))
vi.mock('state/crossChainSwap', () => ({
  addTransaction: (payload: unknown) => ({ type: 'legacy', payload }),
  enqueueTransactionSync: (payload: unknown) => {
    mocks.enqueue(payload)
    return { type: 'enqueue', payload }
  },
  selectTransactionSync: () => mocks.entries[0],
}))
vi.mock('react-redux', () => ({ useStore: () => ({ getState: () => ({}) }) }))
vi.mock('state/hooks', () => ({ useAppDispatch: () => mocks.dispatch }))
vi.mock('hooks/useTracking', () => ({
  default: () => ({ trackingHandler: mocks.track }),
  useCrossChainMixpanel: () => ({ crossChainMixpanelHandler: mocks.mixpanel }),
  CROSS_CHAIN_MIXPANEL_TYPE: { CROSS_CHAIN_SWAP_INIT: 'init' },
  TRACKING_EVENT_TYPE: { CC_SWAP_INITIATED: 'init', CC_SWAP_FAILED: 'failed' },
}))
const makeQuote = (managed = true) =>
  ({
    adapter: { executeSwap: mocks.execute, getName: () => 'NearIntents' },
    isReadOnly: false,
    quote: {
      ...(managed ? { quoteId: 'reviewed-quote', quoteToken: 'reviewed-token' } : {}),
      quoteParams: {
        fromChain: 1,
        toChain: 8453,
        fromToken: { decimals: 6, symbol: 'IN' },
        toToken: { decimals: 6, symbol: 'OUT' },
        amount: '100',
        sender: 'sender',
        recipient: 'recipient',
      },
      outputAmount: 90n,
      inputUsd: 1,
      outputUsd: 1,
      platformFeePercent: 0,
    },
  } as unknown as Quote)
let root: ReturnType<typeof createRoot>
let execution: ReturnType<typeof useCrossChainExecution>
const Harness = ({ quote, syncWithBackend }: { quote: Quote | null; syncWithBackend?: boolean }) => {
  execution = useCrossChainExecution(quote, { syncWithBackend })
  return null
}
const render = (quote: Quote | null, syncWithBackend = true) =>
  act(async () => root.render(<Harness quote={quote} syncWithBackend={syncWithBackend} />))
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.resetAllMocks()
  mocks.entries = []
  mocks.enqueue.mockImplementation(() => {
    const entry = { key: 'captured' }
    mocks.entries = [entry]
    return entry
  })
  root = createRoot(document.createElement('div'))
})
afterEach(async () => {
  await act(async () => root.unmount())
  vi.unstubAllGlobals()
})

it('persists broadcast before confirmation, retaining reviewed identity even when review closes', async () => {
  let finish!: (result: NormalizedTxResponse) => void
  let broadcast!: (hash: string, tracking: { id: string; depositAddress?: string }) => void
  mocks.execute.mockImplementation((...args) => {
    broadcast = args[6]
    return new Promise(resolve => {
      finish = resolve
    })
  })
  await render(makeQuote())
  let submission!: Promise<void>
  await act(async () => {
    submission = execution.handleSwap()
  })
  await act(async () =>
    broadcast('real-source-hash', { id: 'provider-deposit-id', depositAddress: 'provider-deposit-id' }),
  )
  expect(mocks.enqueue).toHaveBeenCalledWith(
    expect.objectContaining({
      quoteId: 'reviewed-quote',
      quoteToken: 'reviewed-token',
      sender: 'sender',
      transaction: expect.objectContaining({
        sourceTxHash: 'real-source-hash',
        id: 'provider-deposit-id',
        depositAddress: 'provider-deposit-id',
      }),
    }),
  )
  const captured = mocks.enqueue.mock.calls[0][0].transaction
  expect(execution.txHash).toBe('real-source-hash')
  expect(mocks.track).toHaveBeenCalledOnce()
  await render(null)
  // BE can settle and remove the outbox before the old review's adapter returns.
  mocks.entries = []
  await act(async () => {
    finish(captured)
    await submission
  })
  expect(mocks.enqueue).toHaveBeenCalledOnce()
  expect(execution.txHash).toBe('')
  expect(mocks.dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'legacy' }))
})
it('does not call a broadcast swap failed when adapter confirmation times out', async () => {
  mocks.execute.mockImplementation(async (...args) => {
    args[6]('source', { id: 'provider' })
    throw new Error('confirmation timeout')
  })
  await render(makeQuote())
  await act(async () => execution.handleSwap())
  expect(mocks.enqueue).toHaveBeenCalledOnce()
  expect(execution.txHash).toBe('source')
  expect(execution.txError).toBe('')
  expect(mocks.track).toHaveBeenCalledWith('init', expect.anything())
  expect(mocks.track).not.toHaveBeenCalledWith('failed', expect.anything())
})
it('creates no record for a rejected wallet or a missing source hash', async () => {
  mocks.execute.mockRejectedValueOnce(new Error('User rejected'))
  await render(makeQuote())
  await act(async () => execution.handleSwap())
  expect(mocks.enqueue).not.toHaveBeenCalled()
  mocks.execute.mockResolvedValueOnce({ sourceTxHash: '' })
  await act(async () => execution.handleSwap())
  expect(mocks.enqueue).not.toHaveBeenCalled()
  expect(mocks.dispatch).not.toHaveBeenCalled()
})
it('keeps legacy callers on local history and deduplicates the broadcast callback and adapter return', async () => {
  mocks.execute.mockImplementation(async (...args) => {
    args[6]('source', { id: 'provider' })
    return { sourceTxHash: 'source', id: 'provider' }
  })
  await render(makeQuote(false))
  await act(async () => execution.handleSwap())
  expect(mocks.enqueue).not.toHaveBeenCalled()
  expect(mocks.dispatch).toHaveBeenCalledTimes(2)
})

it('keeps legacy popup execution local even when a streamed quote has backend identity', async () => {
  const original = makeQuote()
  const refreshed = { ...original, quote: { ...original.quote, outputAmount: 95n } }
  mocks.execute.mockResolvedValue({ sourceTxHash: 'source', id: 'provider' })
  await render(original, false)
  await act(async () => execution.handleSwap(refreshed))
  expect(mocks.execute.mock.calls[0][0]).toBe(refreshed)
  expect(mocks.execute.mock.calls[0][6]).toBeUndefined()
  expect(mocks.enqueue).not.toHaveBeenCalled()
  expect(mocks.dispatch).toHaveBeenCalledOnce()
  expect(mocks.dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'legacy' }))
  expect(mocks.track).toHaveBeenCalledOnce()
})
