// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { useCrossChainBalance } from 'components/SwapForm/CrossChain/hooks/useCrossChainBalance'
import { BitcoinToken, type Chain, type Currency, NonEvmChain } from 'types/crossChain'

const evmClient = vi.hoisted(() => ({ getBalance: vi.fn(), readContract: vi.fn() }))
vi.mock('wagmi', () => ({ usePublicClient: () => evmClient }))

vi.mock('@near-wallet-selector/react-hook', () => ({ useWalletSelector: () => ({}) }))
vi.mock('@solana/wallet-adapter-react', () => ({ useConnection: () => ({}) }))
vi.mock('pages/Swap/crossChain/utils', () => ({ SOLANA_NATIVE: 'native-sol' }))

let root: ReturnType<typeof createRoot>
let client: QueryClient
let balance: string | undefined
const Harness = ({ address, chain, currency }: { address?: string; chain: Chain; currency: Currency }) => {
  balance = useCrossChainBalance(chain, currency, address)
  return null
}
const render = (address?: string, chain: Chain = NonEvmChain.Bitcoin, currency: Currency = BitcoinToken) =>
  act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <Harness address={address} chain={chain} currency={currency} />
      </QueryClientProvider>,
    ),
  )

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  root = createRoot(document.createElement('div'))
})
afterEach(async () => {
  await act(async () => root.unmount())
  client.clear()
  vi.unstubAllGlobals()
})

it('keys balances by the effective receiver and never displays a late result for the previous address', async () => {
  let resolveFirst: (value: unknown) => void = () => {
    throw new Error('Request not started')
  }
  const fetchBalance = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveFirst = resolve
        }),
    )
    .mockResolvedValue({ ok: true, json: async () => ({ confirmed: 200 }) })
  vi.stubGlobal('fetch', fetchBalance)
  await render('receiver-a')
  await render('pasted-b')
  expect(fetchBalance.mock.calls.map(call => call[0])).toEqual([
    'https://api.blockchain.info/haskoin-store/btc/address/receiver-a/balance',
    'https://api.blockchain.info/haskoin-store/btc/address/pasted-b/balance',
  ])
  await act(async () => {
    resolveFirst({ ok: true, json: async () => ({ confirmed: 100 }) })
    await new Promise(resolve => setTimeout(resolve, 10))
  })
  expect(balance).toBe('200')
  await render()
  expect(balance).toBeUndefined()
  expect(fetchBalance).toHaveBeenCalledTimes(2)
})

it('reads native and ERC20 balances for the chosen EVM receiver', async () => {
  const address = '0x1111111111111111111111111111111111111111'
  const tokenAddress = '0x2222222222222222222222222222222222222222'
  evmClient.getBalance.mockResolvedValue(123n)
  evmClient.readContract.mockResolvedValue(456n)
  await render(address, 1, { isNative: true } as Currency)
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 10))
  })
  expect(balance).toBe('123')
  expect(evmClient.getBalance).toHaveBeenCalledWith({ address })
  await render(address, 1, { isNative: false, wrapped: { address: tokenAddress } } as Currency)
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 10))
  })
  expect(balance).toBe('456')
  expect(evmClient.readContract).toHaveBeenCalledWith(
    expect.objectContaining({ address: tokenAddress, functionName: 'balanceOf', args: [address] }),
  )
  await render(undefined, 1, { isNative: true } as Currency)
  expect(balance).toBeUndefined()
  expect(evmClient.getBalance).toHaveBeenCalledTimes(1)
})
