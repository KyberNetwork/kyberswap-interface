// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { useReceiverBalance } from 'components/SwapForm/CrossChain/hooks/useReceiverBalance'
import { BitcoinToken, NonEvmChain } from 'types/crossChain'

vi.mock('@near-wallet-selector/react-hook', () => ({ useWalletSelector: () => ({}) }))
vi.mock('@solana/wallet-adapter-react', () => ({ useConnection: () => ({}) }))
vi.mock('pages/Swap/crossChain/utils', () => ({ SOLANA_NATIVE: 'native-sol' }))

let root: ReturnType<typeof createRoot>
let client: QueryClient
let balance: string | undefined
const Harness = ({ address }: { address?: string }) => {
  balance = useReceiverBalance(NonEvmChain.Bitcoin, BitcoinToken, address)
  return null
}
const render = (address?: string) =>
  act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <Harness address={address} />
      </QueryClientProvider>,
    ),
  )

beforeEach(() => {
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
