// @vitest-environment happy-dom
import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { WalletBalanceContext } from 'state/wallet/WalletBalanceContext'
import { useNativeBalance, useTokenBalances } from 'state/wallet/hooks'

const globalAccount = '0x0000000000000000000000000000000000000001'
const receiver = '0x0000000000000000000000000000000000000002'
const tokens = [new Token(ChainId.MAINNET, '0x0000000000000000000000000000000000000003', 18, 'TOKEN')]
const mocks = vi.hoisted(() => ({ block: 1, nativeRead: vi.fn(), tokenRead: vi.fn() }))
vi.mock('hooks', () => ({
  useActiveWeb3React: () => ({ chainId: 1, account: '0x0000000000000000000000000000000000000001' }),
}))
vi.mock('hooks/useContract', () => ({
  useMulticallContract: () => ({
    address: '0x0000000000000000000000000000000000000004',
    chainId: 1,
    abi: [
      {
        type: 'function',
        name: 'getEthBalance',
        inputs: [{ type: 'address' }],
        outputs: [{ type: 'uint256' }],
        stateMutability: 'view',
      },
    ],
  }),
}))
vi.mock('hooks/useTokens', () => ({ useAllTokens: () => ({}) }))
vi.mock('hooks/bridge', () => ({
  useEthBalanceOfAnotherChain: () => undefined,
  useTokensBalanceOfAnotherChain: () => [[], false],
}))
vi.mock('state/application/hooks', () => ({ useBlockNumberFor: () => mocks.block }))
vi.mock('state/tokenPrices/hooks', () => ({ useTokenPrices: () => ({}) }))
vi.mock('wagmi', () => ({
  useReadContract: (args: any) =>
    useQuery({
      ...args.query,
      queryKey: ['readContract', { scopeKey: args.scopeKey, block: String(args.blockNumber) }],
      queryFn: () => mocks.nativeRead(args.args[0]),
    }),
  useReadContracts: (args: any) =>
    useQuery({
      ...args.query,
      queryKey: ['readContracts', { scopeKey: args.scopeKey, block: String(args.blockNumber) }],
      queryFn: () => mocks.tokenRead(args.contracts[0].args[0]),
    }),
}))
let root: ReturnType<typeof createRoot>
let client: QueryClient
let observed: { native?: string; token?: string }
const Probe = () => {
  const native = useNativeBalance(1)
  const balances = useTokenBalances(tokens, 1)
  observed = { native: native?.quotient.toString(), token: balances[tokens[0].address]?.quotient.toString() }
  return null
}
const render = (address?: string) =>
  act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <WalletBalanceContext.Provider value={address === undefined ? undefined : { chain: 56, address }}>
          <Probe />
        </WalletBalanceContext.Provider>
      </QueryClientProvider>,
    ),
  )
const settle = () =>
  act(async () => {
    await new Promise(resolve => setTimeout(resolve, 20))
  })
beforeEach(() => {
  vi.clearAllMocks()
  mocks.block = 1
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  root = createRoot(document.createElement('div'))
  mocks.nativeRead.mockImplementation(account => Promise.resolve(account === globalAccount ? 10n : 20n))
  mocks.tokenRead.mockImplementation(account =>
    Promise.resolve([{ status: 'success', result: account === globalAccount ? 100n : 200n }]),
  )
})
afterEach(async () => {
  await act(async () => root.unmount())
  client.clear()
  vi.unstubAllGlobals()
})
it('reads native and ERC20 holdings for the scoped receiver across EVM networks and clears on disconnect', async () => {
  await render(receiver)
  await settle()
  expect(mocks.nativeRead).toHaveBeenCalledWith(receiver)
  expect(mocks.tokenRead).toHaveBeenCalledWith(receiver)
  expect(observed).toEqual({ native: '20', token: '200' })
  await render('')
  expect(observed).toEqual({ native: undefined, token: undefined })
})
it('keeps balances across block refreshes but never uses them as placeholders for another wallet', async () => {
  await render()
  await settle()
  expect(observed).toEqual({ native: '10', token: '100' })
  let resolveNative!: (value: bigint) => void
  let resolveToken!: (value: unknown) => void
  mocks.nativeRead.mockImplementation(
    () =>
      new Promise(done => {
        resolveNative = done
      }),
  )
  mocks.tokenRead.mockImplementation(
    () =>
      new Promise(done => {
        resolveToken = done
      }),
  )
  mocks.block++
  await render()
  expect(observed).toEqual({ native: '10', token: '100' })
  await render(receiver)
  expect(observed).toEqual({ native: undefined, token: undefined })
  await act(async () => {
    resolveNative(20n)
    resolveToken([{ status: 'success', result: 200n }])
  })
  await settle()
  expect(observed).toEqual({ native: '20', token: '200' })
})
