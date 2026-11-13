// @vitest-environment happy-dom
import { Suspense, act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'

import {
  getCrossChainSwapIdentity,
  useOptionalCrossChainSwap,
} from 'components/SwapForm/CrossChain/hooks/useCrossChainSwap'
import { useSwapWalletSnapshot, useSwapWallets } from 'components/SwapWallets/SwapWalletContext'

import SwapCrossChainProviders from './SwapCrossChainProviders'
import {
  SwapPageRuntime,
  type SwapRuntimeSnapshot,
  createSwapPageRuntime,
  useSwapRouteSnapshot,
} from './SwapPageRuntime'

const owners = vi.hoisted(() => ({ confirmSwap: vi.fn(), connectInput: vi.fn() }))
vi.mock('components/Web3Provider/NonEvmProviders', () => ({ default: ({ children }: any) => children }))
vi.mock('components/SwapWallets/SwapWalletProvider', async () => {
  const { SwapWalletContext } = await import('components/SwapWallets/SwapWalletContext')
  return {
    SwapWalletProvider: ({ children }: any) => (
      <SwapWalletContext.Provider
        value={{ inputAddress: 'sender', inputConnection: { family: 'evm' }, connectInput: owners.connectInput } as any}
      >
        {children}
      </SwapWalletContext.Provider>
    ),
  }
})
vi.mock('components/SwapForm/CrossChain/hooks/CrossChainSwapEngine', async () => {
  const { memo, useLayoutEffect } = await import('react')
  return {
    default: memo(({ onChange, fromChain }: any) => {
      useLayoutEffect(() => {
        onChange({ fromChainId: fromChain, selectedQuote: null, loading: false, confirmSwap: owners.confirmSwap })
      }, [onChange, fromChain])
      return null
    }),
  }
})

const Reader = () => {
  const quote = useSwapRouteSnapshot()
  const wallets = useSwapWalletSnapshot()
  return (
    <span>
      {wallets?.inputAddress ?? 'no wallet'}:{quote?.fromChainId ?? 'no quote'}
    </span>
  )
}

it('invalidates stale quotes without resetting the signer on amount edits and isolates page instances', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const runtime = createSwapPageRuntime()
  const otherPage = createSwapPageRuntime()
  const container = document.createElement('div')
  const root = createRoot(container)
  const snapshot = { wallets: { inputAddress: 'sol-sender' }, route: { fromChainId: 1 } } as SwapRuntimeSnapshot
  const render = (identity: string, walletIdentity = 'sol-eth') =>
    act(async () =>
      root.render(
        <SwapPageRuntime runtime={runtime} identity={identity} walletIdentity={walletIdentity}>
          <Reader />
        </SwapPageRuntime>,
      ),
    )
  try {
    await render('12')
    await act(async () => runtime.publish('12', 'sol-eth', snapshot))
    expect(container.textContent).toBe('sol-sender:1')
    await render('34')
    expect(container.textContent).toBe('sol-sender:no quote')
    await act(async () => runtime.publish('12', 'sol-eth', snapshot))
    expect(container.textContent).toBe('sol-sender:no quote')
    await render('34', 'eth-sol')
    expect(container.textContent).toBe('no wallet:no quote')
    expect(otherPage.getSnapshot()).toBeUndefined()
  } finally {
    await act(async () => root.unmount())
    vi.unstubAllGlobals()
  }
})

it('projects only route and signer data through the real publisher while actions stay inside their owners', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const runtime = createSwapPageRuntime()
  const container = document.createElement('div')
  const root = createRoot(container)
  const options = {
    enabled: true,
    fromChain: 1,
    toChain: 8453,
    tokenIn: 'ETH',
    tokenOut: 'ETH',
    amount: '12',
    setAmount: vi.fn(),
  }
  const identity = getCrossChainSwapIdentity(options)
  const publish = vi.fn((snapshot: SwapRuntimeSnapshot) => runtime.publish(identity, 'evm', snapshot))
  const OwnerReader = () => {
    const cross = useOptionalCrossChainSwap()
    const wallets = useSwapWallets()
    return (
      <span data-owner>
        {String(cross?.confirmSwap === owners.confirmSwap && wallets?.connectInput === owners.connectInput)}
      </span>
    )
  }
  const OutsideReader = () => {
    const cross = useOptionalCrossChainSwap()
    const wallets = useSwapWallets()
    return <span data-outside>{String(cross === undefined && wallets === undefined)}</span>
  }
  try {
    await act(async () =>
      root.render(
        <SwapPageRuntime runtime={runtime} identity={identity} walletIdentity="evm">
          <Reader />
          <OutsideReader />
          <Suspense fallback={null}>
            <SwapCrossChainProviders {...options} onRuntimeChange={publish}>
              <OwnerReader />
            </SwapCrossChainProviders>
          </Suspense>
        </SwapPageRuntime>,
      ),
    )
    await act(async () => {
      await vi.dynamicImportSettled()
    })
    expect(container.textContent).toContain('sender:1')
    expect(container.querySelector('[data-owner]')?.textContent).toBe('true')
    expect(container.querySelector('[data-outside]')?.textContent).toBe('true')
    const snapshot = runtime.getSnapshot()?.snapshot
    expect(snapshot?.route).not.toHaveProperty('confirmSwap')
    expect(snapshot?.wallets).not.toHaveProperty('connectInput')
    expect(owners.confirmSwap).not.toHaveBeenCalled()
    expect(owners.connectInput).not.toHaveBeenCalled()
  } finally {
    await act(async () => root.unmount())
    vi.unstubAllGlobals()
  }
})
