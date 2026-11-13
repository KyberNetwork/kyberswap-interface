// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'

import TransactionUpdater from './TransactionUpdater'

const mocks = vi.hoisted(() => ({
  transactions: [] as { status: string }[],
  poll: vi.fn(),
  provider: vi.fn(),
  legacy: vi.fn(),
  backend: vi.fn(),
}))
vi.mock('services/walletTransactionsApi', () => ({ useGetTransactionsInfiniteQuerySubscription: mocks.poll }))
vi.mock('hooks', () => ({ useActiveWeb3React: () => ({ account: '0xAbC' }) }))
vi.mock('components/SwapWallets/SwapWalletContext', () => ({ useSwapWallets: () => undefined }))
vi.mock('state/crossChainSwap', () => ({ useCrossChainTransactions: () => mocks.transactions }))
vi.mock('state/crossChainSwap/useBackendTransactionUpdater', () => ({ useBackendTransactionUpdater: mocks.backend }))
vi.mock('state/crossChainSwap/useRestoreMyNearWalletTransaction', () => ({
  useRestoreMyNearWalletTransaction: () => {},
}))
vi.mock('./ProviderTransactionUpdater', () => ({
  default: () => {
    mocks.provider()
    return null
  },
}))
vi.mock('./LegacyWalletHistorySubscriptions', () => ({
  default: () => {
    mocks.legacy()
    return null
  },
}))
let root: ReturnType<typeof createRoot>
afterEach(async () => {
  await act(async () => root.unmount())
  vi.unstubAllGlobals()
})
it('polls EVM history without loading wallet SDKs and retains terminal enrichment for saved transfers', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  root = createRoot(document.createElement('div'))
  await act(async () => root.render(<TransactionUpdater evmOnly />))
  expect(mocks.poll).toHaveBeenCalledWith('0xabc', expect.objectContaining({ pollingInterval: 10000 }))
  expect(mocks.backend).toHaveBeenCalled()
  expect(mocks.provider).not.toHaveBeenCalled()
  expect(mocks.legacy).not.toHaveBeenCalled()
  mocks.transactions = [{ status: 'Success' }]
  await act(async () => root.render(<TransactionUpdater evmOnly />))
  expect(mocks.provider).toHaveBeenCalled()
  expect(mocks.legacy).not.toHaveBeenCalled()
})
