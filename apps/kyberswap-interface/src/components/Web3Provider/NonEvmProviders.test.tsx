// @vitest-environment happy-dom
import { type ReactNode, act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'

import NonEvmProviders from './NonEvmProviders'

const mounts = vi.hoisted(() => ({ bitcoin: vi.fn(), near: vi.fn(), solana: vi.fn() }))
vi.mock('./BitcoinProvider', () => ({
  BitcoinWalletProvider: ({ children }: { children: ReactNode }) => {
    mounts.bitcoin()
    return children
  },
}))
vi.mock('./NearProvider', () => ({
  default: ({ children }: { children: ReactNode }) => {
    mounts.near()
    return children
  },
}))
vi.mock('./SolanaProvider', () => ({
  SolanaProvider: ({ children }: { children: ReactNode }) => {
    mounts.solana()
    return children
  },
}))

it('reuses the route wallet sessions when a non-EVM token selector supplies a nested boundary', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const container = document.createElement('div')
  const root = createRoot(container)
  try {
    await act(async () =>
      root.render(
        <NonEvmProviders>
          <NonEvmProviders>
            <span>tokens</span>
          </NonEvmProviders>
        </NonEvmProviders>,
      ),
    )
    expect(container.textContent).toBe('tokens')
    expect(mounts.bitcoin).toHaveBeenCalledOnce()
    expect(mounts.near).toHaveBeenCalledOnce()
    expect(mounts.solana).toHaveBeenCalledOnce()
  } finally {
    await act(async () => root.unmount())
    vi.unstubAllGlobals()
  }
})
