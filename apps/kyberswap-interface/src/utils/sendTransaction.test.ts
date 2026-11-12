import { ChainId } from '@kyberswap/ks-sdk-core'
import { InvalidInputRpcError, RpcRequestError } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AccessListConfig } from 'utils/accessList'
import { sendEVMTransaction } from 'utils/sendTransaction'
import { ErrorName } from 'utils/transactionError'

const mocks = vi.hoisted(() => ({
  rpcFetch: vi.fn(),
  directRpcFetch: vi.fn(),
  request: vi.fn(),
  connectorId: 'metaMaskSDK' as string | undefined,
  storage: new Map<string, string>(),
  config: undefined as AccessListConfig | undefined,
  /** Deep copies of what each `eth_sendTransaction` carried; the code mutates one params object across the resend. */
  sent: [] as Record<string, unknown>[],
  /** Wallet answers in order; a missing entry resolves to `hash`. */
  outcomes: [] as ({ value: string } | { error: unknown })[],
}))

vi.mock('@kyber/rpc-client', () => ({ rpcFetch: mocks.rpcFetch, directRpcFetch: mocks.directRpcFetch }))
vi.mock('@wagmi/core', () => ({ getAccount: () => ({ connector: { id: mocks.connectorId } }) }))
vi.mock('components/Web3Provider', () => ({ wagmiConfig: {} }))
vi.mock('services/blackjack', () => ({ default: {} }))
vi.mock('state', () => ({ default: { dispatch: vi.fn() } }))
vi.mock('utils/walletClient', () => ({
  getGatedWalletClient: async () => ({ request: mocks.request }),
}))
vi.mock('utils/accessList', async importOriginal => {
  const actual = await importOriginal<typeof import('utils/accessList')>()
  return {
    ...actual,
    // The shipped constant unless a test installs its own policy.
    get ACCESS_LIST_CONFIG() {
      return mocks.config ?? actual.ACCESS_LIST_CONFIG
    },
  }
})

const account = '0x000000000000000000000000000000000000dEaD'
const router = '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5'
const pool = '0x72ab388e2e2f6facef59e3c3fa2c4e29011c2d38'
const slot = (n: number) => `0x${n.toString(16).padStart(64, '0')}`
const rawList = [
  { address: pool, storageKeys: [slot(1), slot(2)] },
  { address: account, storageKeys: [] },
]
const hash = `0x${'ab'.repeat(32)}` as const
const plainHash = `0x${'cd'.repeat(32)}` as const
const rejection = { code: -32602, message: 'Invalid params' }
/** What `walletClient.request` throws when the wallet answers -32000: viem's wrapper keeps the wallet's text in `details`. */
const viemWrapped32000 = (message: string) =>
  new InvalidInputRpcError(new RpcRequestError({ body: {}, url: 'wallet', error: { code: -32000, message } }))

const send = (overrides: Partial<Parameters<typeof sendEVMTransaction>[0]> = {}) =>
  sendEVMTransaction({
    account,
    contractAddress: router,
    encodedData: '0xe21fd0e9',
    value: 0n,
    errorInfo: { name: ErrorName.SwapError, wallet: 'MetaMask' },
    isSmartConnector: false,
    chainId: ChainId.MAINNET,
    swap: { isSmartSettlement: true },
    ...overrides,
  })

const sentParams = (call = 0) => mocks.sent[call]
const walletAnswers = (...outcomes: typeof mocks.outcomes) => mocks.outcomes.push(...outcomes)
const estimateCalls = () => mocks.rpcFetch.mock.calls.filter(([, method]) => method === 'eth_estimateGas')
const listEstimateCalls = () => mocks.directRpcFetch.mock.calls.filter(([, method]) => method === 'eth_estimateGas')

beforeEach(() => {
  vi.clearAllMocks()
  mocks.connectorId = 'metaMaskSDK'
  mocks.config = undefined
  mocks.storage.clear()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => mocks.storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      mocks.storage.set(key, value)
    },
  })
  // 100,000 gas without a list (rotating client), 80,000 with one (default RPC).
  mocks.rpcFetch.mockResolvedValue('0x186a0')
  mocks.directRpcFetch.mockImplementation(async (_url: string, method: string, [arg]: [{ accessList?: unknown }]) =>
    method === 'eth_createAccessList' ? { accessList: rawList } : arg.accessList ? '0x13880' : '0x186a0',
  )
  mocks.sent = []
  mocks.outcomes = []
  mocks.request.mockImplementation(async ({ params }: { params: unknown[] }) => {
    mocks.sent.push(JSON.parse(JSON.stringify(params[0])))
    const next = mocks.outcomes.shift() ?? { value: hash }
    if ('error' in next) throw next.error
    return next.value
  })
})

describe('sendEVMTransaction with an access list', () => {
  it('attaches the sanitized list as a type-2 transaction whose gas comes from the list-less estimate', async () => {
    const result = await send()

    expect(mocks.directRpcFetch).toHaveBeenCalledWith(
      expect.stringContaining('http'),
      'eth_createAccessList',
      [expect.objectContaining({ from: account, to: router }), 'latest'],
      expect.any(Number),
    )
    expect(estimateCalls()).toHaveLength(1)
    expect(estimateCalls()[0][2][0].accessList).toBeUndefined()
    expect(listEstimateCalls()).toHaveLength(0)
    expect(sentParams()).toMatchObject({
      type: '0x2',
      accessList: [{ address: pool, storageKeys: [slot(1), slot(2)] }],
      gas: `0x${(120_000).toString(16)}`,
    })
    expect(result).toEqual({
      hash,
      accessList: { addresses: 1, storageKeys: 2, estimatedWithList: false, rejectedByWallet: false },
    })
  })

  it('sends plain, but still reports the outcome, when the RPC yields no usable list', async () => {
    mocks.directRpcFetch.mockResolvedValue({ accessList: [{ address: account, storageKeys: [slot(1)] }] })

    const result = await send()

    expect(sentParams().accessList).toBeUndefined()
    expect(sentParams().type).toBeUndefined()
    expect(result?.accessList).toEqual({
      addresses: 0,
      storageKeys: 0,
      estimatedWithList: false,
      rejectedByWallet: false,
    })
  })

  it('attaches nothing, and reports nothing, when the policy keeps the swap list-less', async () => {
    const plain = await send({ swap: { isSmartSettlement: false } })
    const blocked = await send({ swap: { isSmartSettlement: true }, chainId: ChainId.OPTIMISM })

    expect(mocks.directRpcFetch).not.toHaveBeenCalled()
    expect(plain).toEqual({ hash, accessList: undefined })
    expect(blocked).toEqual({ hash, accessList: undefined })
  })

  it('resends plain once when the wallet refuses the list, then remembers the connector', async () => {
    walletAnswers({ error: rejection }, { value: plainHash })

    const result = await send()

    expect(mocks.request).toHaveBeenCalledTimes(2)
    expect(sentParams(0).accessList).toBeDefined()
    expect(sentParams(1).accessList).toBeUndefined()
    expect(sentParams(1).type).toBeUndefined()
    expect(sentParams(1).gas).toBe(sentParams(0).gas)
    expect(estimateCalls()).toHaveLength(1)
    expect(result).toEqual({
      hash: plainHash,
      accessList: { addresses: 1, storageKeys: 2, estimatedWithList: false, rejectedByWallet: true },
    })
    expect(Object.keys(JSON.parse(mocks.storage.get('accessListRejectingConnectors') ?? '{}'))).toEqual(['metaMaskSDK'])
  })

  it('does not remember the connector when the plain resend fails too', async () => {
    walletAnswers({ error: rejection }, { error: new Error('nonce too low') })

    await expect(send()).rejects.toMatchObject({ message: expect.stringContaining('nonce too low') })

    expect(mocks.request).toHaveBeenCalledTimes(2)
    expect(mocks.storage.has('accessListRejectingConnectors')).toBe(false)
  })

  it('skips the list from the start for a connector that refused one before', async () => {
    mocks.storage.set('accessListRejectingConnectors', JSON.stringify({ metaMaskSDK: Date.now() }))

    const result = await send()

    expect(mocks.directRpcFetch).not.toHaveBeenCalled()
    expect(mocks.request).toHaveBeenCalledTimes(1)
    expect(sentParams().accessList).toBeUndefined()
    expect(result?.accessList).toBeUndefined()
  })

  it('surfaces a user rejection as a send error without a plain retry', async () => {
    walletAnswers({ error: { code: 4001, message: 'User rejected the request.' } })

    await expect(send()).rejects.toMatchObject({ message: expect.stringContaining('User rejected') })

    expect(mocks.request).toHaveBeenCalledTimes(1)
    expect(mocks.storage.has('accessListRejectingConnectors')).toBe(false)
  })

  it('keeps a hash the wallet attached to a list rejection instead of resending', async () => {
    walletAnswers({ error: { code: -32602, message: 'Invalid params', transactionHash: hash } })

    const result = await send()

    expect(mocks.request).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      hash,
      accessList: { addresses: 1, storageKeys: 2, estimatedWithList: false, rejectedByWallet: false },
    })
  })

  it('does not read a viem-wrapped -32000 "insufficient funds" as a list rejection', async () => {
    walletAnswers({ error: viemWrapped32000('insufficient funds for gas * price + value') })

    await expect(send()).rejects.toMatchObject({ message: expect.stringContaining('insufficient funds') })

    expect(mocks.request).toHaveBeenCalledTimes(1)
    expect(mocks.storage.has('accessListRejectingConnectors')).toBe(false)
  })

  it('resends plain when the wallet itself answers -32000 "Missing or invalid parameters." through viem', async () => {
    walletAnswers({ error: viemWrapped32000('Missing or invalid parameters.') }, { value: plainHash })

    const result = await send()

    expect(mocks.request).toHaveBeenCalledTimes(2)
    expect(sentParams(1).accessList).toBeUndefined()
    expect(result).toEqual({
      hash: plainHash,
      accessList: { addresses: 1, storageKeys: 2, estimatedWithList: false, rejectedByWallet: true },
    })
  })

  it('sends plain when the RPC reports that the simulation behind the list reverted', async () => {
    mocks.directRpcFetch.mockResolvedValue({ accessList: rawList, error: 'execution reverted' })

    const result = await send()

    expect(sentParams().accessList).toBeUndefined()
    expect(result?.accessList).toEqual({
      addresses: 0,
      storageKeys: 0,
      estimatedWithList: false,
      rejectedByWallet: false,
    })
  })

  it('sends plain when the access-list RPC stalls past its deadline', async () => {
    vi.useFakeTimers()
    try {
      mocks.directRpcFetch.mockReturnValue(new Promise(() => undefined))

      const pending = send()
      await vi.advanceTimersByTimeAsync(3000)
      const result = await pending

      expect(sentParams().accessList).toBeUndefined()
      expect(result?.accessList?.addresses).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('never fetches a list for a transaction without a swap context, even on an `all` chain', async () => {
    mocks.config = { chains: { [ChainId.MAINNET]: 'all' }, walletBlocklist: [], gasLimitWalletAllowlist: [] }

    const result = await send({ swap: undefined })

    expect(mocks.directRpcFetch).not.toHaveBeenCalled()
    expect(sentParams().accessList).toBeUndefined()
    expect(result).toEqual({ hash, accessList: undefined })
  })
})

describe('sendEVMTransaction on a chain that charges the gas limit', () => {
  beforeEach(() => {
    mocks.config = {
      chains: { [ChainId.MONAD]: 'all' },
      walletBlocklist: [],
      gasLimitWalletAllowlist: ['metaMaskSDK'],
    }
  })
  const sendOnMonad = () => send({ chainId: ChainId.MONAD, swap: { isSmartSettlement: false } })

  it('estimates with the list, against the default RPC, for an allowlisted wallet and sends that lower limit', async () => {
    const result = await sendOnMonad()

    expect(estimateCalls()).toHaveLength(0)
    expect(listEstimateCalls()).toHaveLength(1)
    expect(listEstimateCalls()[0][0]).toContain('http')
    expect(listEstimateCalls()[0][2][0].accessList).toBeDefined()
    expect(sentParams()).toMatchObject({ type: '0x2', gas: `0x${(100_000).toString(16)}` })
    expect(result?.accessList).toEqual({
      addresses: 1,
      storageKeys: 2,
      estimatedWithList: true,
      rejectedByWallet: false,
    })
  })

  it('re-estimates without the list before the plain resend, so the wallet is not sent a limit the list paid for', async () => {
    walletAnswers({ error: rejection }, { value: plainHash })

    const result = await sendOnMonad()

    expect(listEstimateCalls()).toHaveLength(1)
    expect(estimateCalls()).toHaveLength(1)
    expect(estimateCalls()[0][2][0].accessList).toBeUndefined()
    expect(sentParams(1)).not.toHaveProperty('accessList')
    expect(sentParams(1).gas).toBe(`0x${(120_000).toString(16)}`)
    expect(result).toEqual({
      hash: plainHash,
      accessList: { addresses: 1, storageKeys: 2, estimatedWithList: true, rejectedByWallet: true },
    })
  })

  it('falls back to a plain transaction when the RPC will not estimate with the list', async () => {
    mocks.directRpcFetch.mockImplementation(async (_url: string, method: string) => {
      if (method === 'eth_estimateGas') throw new Error('invalid argument 0: accessList')
      return { accessList: rawList }
    })

    const result = await sendOnMonad()

    expect(listEstimateCalls()).toHaveLength(1)
    expect(estimateCalls()).toHaveLength(1)
    expect(sentParams()).not.toHaveProperty('accessList')
    expect(sentParams().gas).toBe(`0x${(120_000).toString(16)}`)
    expect(result?.accessList).toEqual({
      addresses: 0,
      storageKeys: 0,
      estimatedWithList: false,
      rejectedByWallet: false,
    })
  })

  it('keeps a wallet outside the allowlist list-less', async () => {
    mocks.connectorId = 'io.rabby'

    const result = await sendOnMonad()

    expect(mocks.directRpcFetch).not.toHaveBeenCalled()
    expect(sentParams()).not.toHaveProperty('accessList')
    expect(result?.accessList).toBeUndefined()
  })
})
