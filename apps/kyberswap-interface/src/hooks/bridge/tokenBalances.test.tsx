// @vitest-environment happy-dom
import { ChainId, Currency, Token } from '@kyberswap/ks-sdk-core'
import { configureStore } from '@reduxjs/toolkit'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import contractQuery from 'services/contractQuery'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { useTokensBalanceOfAnotherChain } from 'hooks/bridge'

const wallet = '0x0000000000000000000000000000000000000001'
const mocks = vi.hoisted(() => ({ account: undefined as string | undefined, read: vi.fn() }))
vi.mock('state/wallet/WalletBalanceContext', () => ({ useEvmBalanceAccount: () => mocks.account }))
vi.mock('components/Web3Provider', () => ({ wagmiConfig: {} }))
vi.mock('@wagmi/core', () => ({
  getPublicClient: (_config: unknown, { chainId }: { chainId: number }) => ({
    multicall: (args: unknown) => mocks.read(chainId, args),
  }),
}))

const token = new Token(1, '0x0000000000000000000000000000000000000010', 6, 'AAA')
const otherToken = new Token(1, '0x0000000000000000000000000000000000000020', 6, 'BBB')
const otherChainToken = new Token(56, token.address, 18, 'AAA')
const result = (amount: bigint) => [{ status: 'success' as const, result: amount }]
const deferred = () => {
  let resolve!: (value: ReturnType<typeof result>) => void
  let reject!: (error: Error) => void
  const promise = new Promise<ReturnType<typeof result>>((done, fail) => {
    resolve = done
    reject = fail
  })
  return { promise, resolve, reject }
}
const createStore = () =>
  configureStore({
    reducer: { [contractQuery.reducerPath]: contractQuery.reducer },
    middleware: getDefault => getDefault({ serializableCheck: false }).concat(contractQuery.middleware),
  })

let store: ReturnType<typeof createStore>
let root: ReturnType<typeof createRoot>
let observed: ReturnType<typeof useTokensBalanceOfAnotherChain>
const Probe = ({ chain, tokens }: { chain?: ChainId; tokens: Currency[] }) => {
  observed = useTokensBalanceOfAnotherChain(chain, tokens)
  return null
}
const render = (chain: ChainId | undefined = ChainId.MAINNET, tokens: Currency[] = [token]) =>
  act(async () =>
    root.render(
      <Provider store={store}>
        <Probe chain={chain} tokens={tokens} />
      </Provider>,
    ),
  )
const advance = (ms = 20) => act(async () => vi.advanceTimersByTimeAsync(ms))
const rawBalance = () => observed[0][0]?.[0]?.quotient.toString()

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  mocks.account = wallet
  mocks.read.mockReset().mockResolvedValue(result(10n))
  store = createStore()
  root = createRoot(document.createElement('div'))
})
afterEach(async () => {
  await act(async () => root.unmount())
  store.dispatch(contractQuery.util.resetApiState())
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

it.each(['wallet', 'chain', 'tokens'] as const)(
  'isolates balances and late responses when %s changes',
  async change => {
    await render()
    await advance()
    expect(rawBalance()).toBe('10')

    const oldRead = deferred()
    const newRead = deferred()
    mocks.read.mockReturnValueOnce(oldRead.promise).mockReturnValueOnce(newRead.promise)
    await advance(15_000)
    expect(rawBalance()).toBe('10')
    expect(observed[1]).toBe(false)

    if (change === 'wallet') mocks.account = '0x0000000000000000000000000000000000000002'
    const nextToken = change === 'chain' ? otherChainToken : change === 'tokens' ? otherToken : token
    await render(nextToken.chainId, [nextToken])
    expect(observed).toEqual([[], true])
    expect(mocks.read).toHaveBeenLastCalledWith(
      nextToken.chainId,
      expect.objectContaining({
        contracts: [expect.objectContaining({ address: nextToken.address, args: [mocks.account] })],
      }),
    )

    await act(async () => oldRead.resolve(result(99n)))
    await advance()
    expect(observed).toEqual([[], true])
    await act(async () => newRead.resolve(result(20n)))
    await advance()
    expect(rawBalance()).toBe('20')
    expect(observed[0][0][0]?.currency.equals(nextToken)).toBe(true)
    expect(observed[1]).toBe(false)
  },
)

it.each(['wallet', 'chain', 'tokens'] as const)(
  'skips RPC reads without %s and resumes when provided',
  async missing => {
    if (missing === 'wallet') mocks.account = undefined
    // Pass an absent chain through the component directly; render() defaults to Mainnet.
    await act(async () =>
      root.render(
        <Provider store={store}>
          <Probe
            chain={missing === 'chain' ? undefined : ChainId.MAINNET}
            tokens={missing === 'tokens' ? [] : [token]}
          />
        </Provider>,
      ),
    )
    await advance(30_000)
    expect(mocks.read).not.toHaveBeenCalled()
    expect(observed).toEqual([[], false])

    mocks.account = wallet
    await render()
    await advance()
    expect(rawBalance()).toBe('10')
    expect(mocks.read).toHaveBeenCalledTimes(1)
  },
)

it('reuses fresh cached balances and refreshes retained stale balances after remount', async () => {
  await render()
  await advance()
  await render(ChainId.BSCMAINNET, [otherChainToken])
  await advance()
  await render()
  expect(rawBalance()).toBe('10')
  expect(observed[1]).toBe(false)
  expect(mocks.read).toHaveBeenCalledTimes(2)

  await act(async () => root.render(null))
  await advance(16_000)
  const refresh = deferred()
  mocks.read.mockReturnValueOnce(refresh.promise)
  await render()
  expect(rawBalance()).toBe('10')
  expect(observed[1]).toBe(false)
  expect(mocks.read).toHaveBeenCalledTimes(3)
  await act(async () => refresh.resolve(result(30n)))
  await advance()
  expect(rawBalance()).toBe('30')
})

it('expires unused balances after five minutes', async () => {
  await render()
  await advance()
  await act(async () => root.render(null))
  await advance(300_001)

  const fresh = deferred()
  mocks.read.mockReturnValueOnce(fresh.promise)
  await render()
  expect(observed).toEqual([[], true])
  expect(mocks.read).toHaveBeenCalledTimes(2)
  await act(async () => fresh.resolve(result(40n)))
  await advance()
  expect(rawBalance()).toBe('40')
})

it('retains a cached balance after an RPC refresh error and recovers on the next poll', async () => {
  await render()
  await advance()
  const refresh = deferred()
  mocks.read.mockReturnValueOnce(refresh.promise)
  await advance(15_000)
  expect(rawBalance()).toBe('10')
  expect(observed[1]).toBe(false)

  const error = new Error('RPC unavailable')
  const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  await act(async () => refresh.reject(error))
  await advance()
  expect(log).toHaveBeenCalledWith(expect.stringContaining('fetchBalances'), error)
  expect(rawBalance()).toBe('10')
  expect(observed[1]).toBe(false)
  log.mockRestore()

  mocks.read.mockResolvedValue(result(50n))
  await advance(15_000)
  expect(rawBalance()).toBe('50')
  expect(observed[1]).toBe(false)
})
