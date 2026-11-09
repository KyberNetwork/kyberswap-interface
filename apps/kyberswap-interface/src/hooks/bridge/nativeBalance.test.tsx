// @vitest-environment happy-dom
import { ChainId } from '@kyberswap/ks-sdk-core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { useEthBalanceOfAnotherChain } from 'hooks/bridge'

const mocks = vi.hoisted(() => ({ account: '0x0000000000000000000000000000000000000001', read: vi.fn() }))
vi.mock('state/wallet/WalletBalanceContext', () => ({ useEvmBalanceAccount: () => mocks.account }))
vi.mock('components/Web3Provider', () => ({ wagmiConfig: {} }))
vi.mock('services/contractQuery', async importOriginal => ({
  ...(await importOriginal<typeof import('services/contractQuery')>()),
  default: {},
}))
vi.mock('@wagmi/core', () => ({
  getPublicClient: (_config: unknown, { chainId }: { chainId: number }) => ({
    getBalance: ({ address }: { address: string }) => mocks.read(chainId, address),
  }),
}))
let root: ReturnType<typeof createRoot>
let client: QueryClient
let observed: string | undefined
let amount: ReturnType<typeof useEthBalanceOfAnotherChain>
const Probe = ({ chain }: { chain: ChainId }) => {
  amount = useEthBalanceOfAnotherChain(chain)
  observed = amount?.quotient.toString()
  return null
}
const render = (chain: ChainId) =>
  act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <Probe chain={chain} />
      </QueryClientProvider>,
    ),
  )
const settle = () =>
  act(async () => {
    await new Promise(resolve => setTimeout(resolve, 20))
  })
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  mocks.account = '0x0000000000000000000000000000000000000001'
  mocks.read.mockReset().mockImplementation((chain: number) => Promise.resolve(BigInt(chain)))
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  root = createRoot(document.createElement('div'))
})
afterEach(async () => {
  await act(async () => root.unmount())
  client.clear()
  vi.unstubAllGlobals()
})
it('restores cached native balances on A → B → A without another read', async () => {
  await render(ChainId.MAINNET)
  await settle()
  expect(observed).toBe('1')
  await render(ChainId.BSCMAINNET)
  await settle()
  expect(observed).toBe('56')
  await render(ChainId.MAINNET)
  expect(observed).toBe('1')
  expect(mocks.read).toHaveBeenCalledTimes(2)
})
it('retains the snapshot during refresh and isolates a late result from another wallet', async () => {
  await render(ChainId.MAINNET)
  await settle()
  let resolve!: (value: bigint) => void
  mocks.read.mockImplementation(
    () =>
      new Promise(done => {
        resolve = done
      }),
  )
  await act(async () => {
    void client.invalidateQueries({ queryKey: ['native-balance'] })
  })
  expect(observed).toBe('1')
  const resolveOldWallet = resolve
  mocks.account = '0x0000000000000000000000000000000000000002'
  await render(ChainId.MAINNET)
  expect(observed).toBeUndefined()
  await act(async () => resolveOldWallet(10n))
  await settle()
  expect(observed).toBeUndefined()
  await act(async () => resolve(20n))
  await settle()
  expect(observed).toBe('20')
})

it('preserves the amount reference for unchanged renders and equal refresh results', async () => {
  await render(ChainId.MAINNET)
  await settle()
  const original = amount
  await render(ChainId.MAINNET)
  expect(amount).toBe(original)
  await act(async () => {
    await client.invalidateQueries({ queryKey: ['native-balance'] })
  })
  await settle()
  expect(amount).toBe(original)
  mocks.read.mockResolvedValue(2n)
  await act(async () => {
    await client.invalidateQueries({ queryKey: ['native-balance'] })
  })
  await settle()
  expect(observed).toBe('2')
  expect(amount).not.toBe(original)
})
