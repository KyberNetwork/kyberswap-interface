// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'

import { useWalletInventory } from './hooks'
import { InventoryEntry } from './store'

const mocks = vi.hoisted(() => ({ account: 'wallet', version: 0, entry: undefined as InventoryEntry | undefined }))
vi.mock('hooks', () => ({ useActiveWeb3React: () => ({ chainId: 1 }) }))
vi.mock('state/wallet/WalletBalanceContext', () => ({ useEvmBalanceAccount: () => mocks.account }))
vi.mock('state/wallet/hooks', () => ({ useNativeBalance: () => undefined }))
vi.mock('./store', () => ({
  isInventoryChain: () => true,
  inventoryKey: (chain: number, account: string) => `${chain}:${account}`,
  subscribeStore: () => () => undefined,
  getStoreVersion: () => mocks.version,
  readEntry: () => mocks.entry,
  register: vi.fn(),
  unregister: vi.fn(),
}))

it('owns acquisition loading through completion, failure and disconnect', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const root = createRoot(document.createElement('div'))
  let inventory!: ReturnType<typeof useWalletInventory>
  const Probe = () => {
    inventory = useWalletInventory(1)
    return null
  }
  const render = async () => {
    mocks.version += 1
    await act(async () => root.render(<Probe />))
  }
  try {
    await render()
    expect(inventory.loading).toBe(true)
    for (const status of ['loading', 'settled', 'error'] as const) {
      mocks.entry = { status, rows: {} } as InventoryEntry
      await render()
      expect(inventory.loading).toBe(status === 'loading')
    }
    mocks.entry = undefined
    mocks.account = ''
    await render()
    expect(inventory.loading).toBe(false)
    expect(inventory.active).toBe(false)
  } finally {
    await act(async () => root.unmount())
    vi.unstubAllGlobals()
  }
})
