import { ChainId } from '@kyberswap/ks-sdk-core'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  AccessListConfig,
  isAccessListRejectionError,
  readRejectingConnectors,
  rememberRejectingConnector,
  resolveAccessListPolicy,
  sanitizeAccessList,
} from 'utils/accessList'

vi.mock('@kyber/rpc-client', () => ({ directRpcFetch: vi.fn() }))

const sender = '0x000000000000000000000000000000000000dEaD'
const router = '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5'
const pool = '0x72AB388E2E2F6FACEF59E3C3FA2C4E29011C2D38'
const token = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const slot = (n: number) => `0x${n.toString(16).padStart(64, '0')}`
const endpoints = { from: sender, to: router }

describe('sanitizeAccessList', () => {
  it('lowercases entries and merges the keys of a repeated address', () => {
    expect(
      sanitizeAccessList(
        [
          { address: pool, storageKeys: [slot(1), slot(2)] },
          { address: pool.toLowerCase(), storageKeys: [slot(2), slot(3)] },
        ],
        endpoints,
      ),
    ).toEqual([{ address: pool.toLowerCase(), storageKeys: [slot(1), slot(2), slot(3)] }])
  })

  it('drops the sender, the callee, precompiles and malformed keys', () => {
    expect(
      sanitizeAccessList(
        [
          { address: sender, storageKeys: [slot(1)] },
          { address: router.toLowerCase(), storageKeys: [slot(1)] },
          { address: '0x0000000000000000000000000000000000000001', storageKeys: [] },
          { address: token, storageKeys: ['0x1234', 42, slot(7)] },
          { address: 'not-an-address', storageKeys: [slot(1)] },
        ],
        endpoints,
      ),
    ).toEqual([{ address: token.toLowerCase(), storageKeys: [slot(7)] }])
  })

  it('keeps an address without keys, since warming the account alone is worth listing', () => {
    expect(sanitizeAccessList([{ address: token }], endpoints)).toEqual([
      { address: token.toLowerCase(), storageKeys: [] },
    ])
  })

  it('returns undefined when nothing is left or the input is not a list', () => {
    expect(sanitizeAccessList([], endpoints)).toBeUndefined()
    expect(sanitizeAccessList([{ address: sender, storageKeys: [] }], endpoints)).toBeUndefined()
    expect(sanitizeAccessList({ accessList: [] }, endpoints)).toBeUndefined()
    expect(sanitizeAccessList(undefined, endpoints)).toBeUndefined()
  })
})

describe('resolveAccessListPolicy', () => {
  const config: AccessListConfig = {
    chains: { [ChainId.BASE]: 'ss', [ChainId.MATIC]: 'all', [ChainId.MONAD]: 'all' },
    walletBlocklist: ['app.phantom'],
    gasLimitWalletAllowlist: ['io.metamask'],
  }
  const base = {
    config,
    chainId: ChainId.BASE,
    connectorId: 'io.rabby',
    isSmartConnector: false,
    isSmartSettlement: true,
    chargesGasLimit: false,
    rejectingConnectors: new Set<string>(),
  }

  it('attaches nothing on a chain that is absent from the config', () => {
    expect(resolveAccessListPolicy({ ...base, chainId: ChainId.MAINNET })).toEqual({ attach: false })
  })

  it('on an `ss` chain attaches only to Smart Settlement swaps, with a list-less estimate', () => {
    expect(resolveAccessListPolicy({ ...base, isSmartSettlement: false })).toEqual({ attach: false })
    expect(resolveAccessListPolicy(base)).toEqual({ attach: true, estimateWithList: false })
  })

  it('on an `all` chain attaches to every swap', () => {
    expect(resolveAccessListPolicy({ ...base, chainId: ChainId.MATIC, isSmartSettlement: false })).toEqual({
      attach: true,
      estimateWithList: false,
    })
  })

  it('skips wallets on the blocklist, wallets seen rejecting a list, and smart accounts', () => {
    expect(resolveAccessListPolicy({ ...base, connectorId: 'app.phantom' })).toEqual({ attach: false })
    expect(resolveAccessListPolicy({ ...base, rejectingConnectors: new Set(['io.rabby']) })).toEqual({
      attach: false,
    })
    expect(resolveAccessListPolicy({ ...base, isSmartConnector: true })).toEqual({ attach: false })
  })

  it('on a chain that charges the gas limit, only an allowlisted wallet gets a list, estimated with it', () => {
    const monad = { ...base, chainId: ChainId.MONAD, chargesGasLimit: true, isSmartSettlement: false }
    expect(resolveAccessListPolicy(monad)).toEqual({ attach: false })
    expect(resolveAccessListPolicy({ ...monad, connectorId: undefined })).toEqual({ attach: false })
    expect(resolveAccessListPolicy({ ...monad, connectorId: 'io.metamask' })).toEqual({
      attach: true,
      estimateWithList: true,
    })
  })
})

describe('isAccessListRejectionError', () => {
  it('recognizes a wallet refusing the list', () => {
    expect(isAccessListRejectionError({ code: -32000, message: 'Missing or invalid parameters.' })).toBe(true)
    expect(isAccessListRejectionError({ code: -32602, message: 'Invalid params' })).toBe(true)
    expect(isAccessListRejectionError({ code: -104, message: 'show tx info failed' })).toBe(true)
    expect(isAccessListRejectionError({ message: 'Request failed', cause: { code: -32602 } })).toBe(true)
    expect(isAccessListRejectionError({ message: 'unsupported field: accessList' })).toBe(true)
  })

  it('leaves other failures alone', () => {
    expect(isAccessListRejectionError({ code: 4001, message: 'User rejected the request.' })).toBe(false)
    expect(isAccessListRejectionError({ code: -32000, message: 'insufficient funds for gas * price + value' })).toBe(
      false,
    )
    expect(isAccessListRejectionError({ code: -32602, cause: { code: 4001, message: 'User rejected' } })).toBe(false)
    expect(isAccessListRejectionError(new Error('network down'))).toBe(false)
    expect(isAccessListRejectionError(undefined)).toBe(false)
  })
})

describe('rejecting connectors memory', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('is empty and inert without storage', () => {
    expect(readRejectingConnectors().size).toBe(0)
    expect(() => rememberRejectingConnector('app.phantom')).not.toThrow()
  })

  it('remembers each connector once, never the WalletConnect id many wallets share', () => {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
    })
    rememberRejectingConnector('app.phantom')
    rememberRejectingConnector('app.phantom')
    rememberRejectingConnector('io.safepal')
    rememberRejectingConnector('walletConnect')
    expect([...readRejectingConnectors()]).toEqual(['app.phantom', 'io.safepal'])
  })

  it('treats corrupt storage as empty', () => {
    vi.stubGlobal('localStorage', { getItem: () => '{not json', setItem: () => undefined })
    expect(readRejectingConnectors().size).toBe(0)
  })
})
