// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import HistoryPanel from 'components/SwapTransactions/History/HistoryPanel'
import { useSwapWalletSnapshot } from 'components/SwapWallets/SwapWalletContext'
import { NonEvmChain } from 'types/crossChain'

import SwapPage from './SwapPage'
import { useSwapRouteSnapshot } from './SwapPageRuntime'

const mocks = vi.hoisted(() => {
  let resolveProviders: () => void = () => {}
  const providersReady = new Promise<void>(resolve => {
    resolveProviders = resolve
  })
  return {
    cross: false,
    mounts: vi.fn(),
    unmounts: vi.fn(),
    providersReady,
    resolveProviders,
    inputChain: 1 as number | string,
    outputChain: 8453,
    sender: 'sender',
    history: false,
  }
})
vi.mock('hooks', () => ({ useActiveWeb3React: () => ({ account: 'evm' }) }))
vi.mock('components/SwapForm/hooks/useEvmRecipient', () => ({ useEvmRecipient: () => ({}) }))
vi.mock('components/SwapForm/hooks/useSwapFormPair', () => ({
  useSwapFormPair: () => ({
    isCrossChain: mocks.cross,
    inputChain: mocks.inputChain,
    outputChain: mocks.cross ? mocks.outputChain : 1,
  }),
}))
vi.mock('components/SwapForm/hooks/useSwapInputAmount', async () => {
  const { useState } = await import('react')
  return {
    useSwapInputAmount: () => {
      const [typedValue, onUserInput] = useState('')
      return { typedValue, onUserInput }
    },
  }
})
vi.mock('components/TradeLayout/Tabs', () => ({ TAB: { SWAP: 'swap' } }))
vi.mock('components/TradeLayout/useTradeController', () => ({ useTradeController: () => ({}) }))
vi.mock('components/TradeLayout/useTradeLayoutPrefetch', () => ({ useTradeLayoutPrefetch: () => {} }))
vi.mock('components/SwapTransactions/TransactionUpdater', () => ({
  TransactionStatusUpdater: () => null,
  WalletHistorySubscriptions: () => null,
}))
vi.mock('components/SwapTransactions/TransactionDetail/TransactionDetailProvider', () => ({
  TransactionDetailProvider: ({ children }: any) => children,
}))
vi.mock('components/SwapForm/SingleChain/SingleChainSwapFormProvider', () => ({
  SingleChainSwapFormProvider: ({ children }: any) => children,
}))
vi.mock('./SwapCrossChainProviders', async () => {
  await mocks.providersReady
  const { useEffect, useLayoutEffect } = await import('react')
  const MockProviders = ({ children, onRuntimeChange }: any) => {
    // Publish on every producer render to catch a context -> parent -> producer update loop.
    useLayoutEffect(() =>
      onRuntimeChange({ wallets: { inputAddress: mocks.sender }, route: { fromChainId: mocks.inputChain } }),
    )
    useEffect(() => {
      mocks.mounts()
      return () => {
        mocks.unmounts()
      }
    }, [])
    return children
  }
  return { default: MockProviders }
})
vi.mock('components/SwapForm/PendingSwapForm', () => ({ PendingSwapForm: () => <span>Pending form</span> }))
vi.mock('./SwapPageContent', () => ({
  SwapPageFormFallback: () => <span>Pending form</span>,
  default: function MockPageContent({ form, inputChain }: any) {
    const wallets = useSwapWalletSnapshot()
    const cross = useSwapRouteSnapshot()
    return (
      <>
        {form}
        <span data-sender>{wallets?.inputAddress}</span>
        <span data-quote>{cross?.fromChainId}</span>
        {mocks.history && <HistoryPanel inputChain={inputChain} onBack={() => {}} />}
      </>
    )
  },
  SwapPageForm: ({ amount, onAmountChange }: any) => (
    <button data-form onClick={() => onAmountChange(amount ? '34' : '12')}>
      {amount}
    </button>
  ),
}))

// Keep the real HistoryPanel keying and pagination state; isolate only data and presentation.
vi.mock('services/walletTransactionsApi', () => ({
  default: {},
  useGetTransactionsInfiniteQueryState: () => ({ currentData: { pages: [] } }),
}))
vi.mock('state/hooks', () => ({ useAppDispatch: () => vi.fn(), useAppSelector: () => [] }))
vi.mock('components/SwapTransactions/localTransactionSelectors', () => ({ selectLocalSwapHistory: vi.fn() }))
vi.mock('components/SwapTransactions/history', () => ({
  HISTORY_PAGE_SIZE: 10,
  getLoadedHistory: () => ({ transactions: Array.from({ length: 30 }, (_, id) => ({ id })), hasMore: false }),
}))
vi.mock('components/SwapTransactions/History/TransactionHistoryList', () => ({
  default: ({ cursorPagination }: any) => (
    <button data-history-page onClick={cursorPagination.onNext}>
      {cursorPagination.currentPage}
    </button>
  ),
}))
vi.mock('components/SwapTransactions/History/HistorySearchResults', () => ({ HistorySearchResults: () => null }))
vi.mock('components/Button/IconButton', () => ({
  default: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}))
vi.mock('components/Input', () => ({ default: (props: any) => <input {...props} /> }))
vi.mock('components/Loader', () => ({ default: () => null }))
vi.mock('components/Stack', () => ({
  Stack: ({ children }: any) => <div>{children}</div>,
  HStack: ({ children }: any) => <div>{children}</div>,
}))
vi.mock('components/Tooltip', () => ({ MouseoverTooltip: ({ children }: any) => children }))

let root: ReturnType<typeof createRoot>
beforeEach(() => {
  mocks.cross = false
  mocks.history = false
  mocks.inputChain = 1
  mocks.outputChain = 8453
  mocks.sender = 'sender'
  mocks.mounts.mockClear()
  mocks.unmounts.mockClear()
})
afterEach(async () => {
  await act(async () => root.unmount())
  vi.unstubAllGlobals()
})
it('defers cross-chain providers and retains them and the amount across mode changes', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const container = document.createElement('div')
  root = createRoot(container)
  await act(async () => root.render(<SwapPage />))
  expect(mocks.mounts).not.toHaveBeenCalled()
  await act(async () => container.querySelector<HTMLButtonElement>('[data-form]')?.click())
  mocks.cross = true
  await act(async () => root.render(<SwapPage />))
  // Pending provider code must not mount interactive form controls outside its wallet contexts.
  expect(mocks.mounts).not.toHaveBeenCalled()
  expect(container.querySelector('[data-form]')).toBeNull()
  await act(async () => mocks.resolveProviders())
  expect(mocks.mounts).toHaveBeenCalledOnce()
  expect(container.querySelector('[data-form]')?.textContent).toBe('12')
  expect(container.querySelector('[data-sender]')?.textContent).toBe('sender')
  expect(container.querySelector('[data-quote]')?.textContent).toBe('1')
  mocks.cross = false
  await act(async () => root.render(<SwapPage />))
  expect(mocks.unmounts).not.toHaveBeenCalled()
  expect(container.querySelector('[data-form]')?.textContent).toBe('12')
})

it('preserves History pagination on output-chain changes and resets it when the input signer changes', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  mocks.cross = true
  mocks.history = true
  mocks.inputChain = NonEvmChain.Solana
  mocks.outputChain = 1
  mocks.sender = 'sol-sender'
  mocks.resolveProviders()
  const container = document.createElement('div')
  root = createRoot(container)
  await act(async () => {
    root.render(<SwapPage />)
  })
  const page = () => container.querySelector<HTMLButtonElement>('[data-history-page]')
  expect(page()?.textContent).toBe('1')
  await act(async () => page()?.click())
  expect(page()?.textContent).toBe('2')

  mocks.outputChain = 8453
  await act(async () => root.render(<SwapPage />))
  expect(page()?.textContent).toBe('2')

  mocks.sender = 'another-sol-sender'
  await act(async () => root.render(<SwapPage />))
  expect(page()?.textContent).toBe('1')
})
