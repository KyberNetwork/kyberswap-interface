// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'

import SwapPage from './SwapPage'

const mocks = vi.hoisted(() => ({ cross: false, mounts: vi.fn(), unmounts: vi.fn() }))
vi.mock('hooks', () => ({ useActiveWeb3React: () => ({ account: 'evm' }) }))
vi.mock('components/SwapForm/hooks/useEvmRecipient', () => ({ useEvmRecipient: () => ({}) }))
vi.mock('components/SwapForm/hooks/useSwapFormPair', () => ({
  useSwapFormPair: () => ({ isCrossChain: mocks.cross, inputChain: 1, outputChain: mocks.cross ? 8453 : 1 }),
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
  const { useEffect } = await import('react')
  const MockProviders = ({ children }: any) => {
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
vi.mock('./SwapPageContent', () => ({
  default: ({ amount, onAmountChange }: any) => <button onClick={() => onAmountChange('12')}>{amount}</button>,
}))

let root: ReturnType<typeof createRoot>
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
  await act(async () => container.querySelector('button')?.click())
  mocks.cross = true
  await act(async () => root.render(<SwapPage />))
  expect(mocks.mounts).toHaveBeenCalledOnce()
  expect(container.textContent).toBe('12')
  mocks.cross = false
  await act(async () => root.render(<SwapPage />))
  expect(mocks.unmounts).not.toHaveBeenCalled()
  expect(container.textContent).toBe('12')
})
