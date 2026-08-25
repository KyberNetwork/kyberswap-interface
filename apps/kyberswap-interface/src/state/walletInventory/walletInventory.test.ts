import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { InventoryRow, adaptRow, parseRawAmount } from 'services/walletInventory'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { computeInventoryDiscoveries } from 'components/TokenSelectorModal/hooks/useInventoryDiscoveries'
import { mergeHeldSearchResults } from 'components/TokenSelectorModal/utils'
import { ETHER_ADDRESS } from 'constants/index'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { INVENTORY_CATCHUP_INTERVAL_MS, INVENTORY_TTL_MS } from 'state/walletInventory/constants'
import { buildInventoryBalanceMap, resolveInventory } from 'state/walletInventory/resolve'
import {
  InventoryEntry,
  commitFailure,
  commitResult,
  expireInventory,
  getStoreVersion,
  inventoryKey,
  isAwaitingBlock,
  readEntry,
  readMeta,
  register,
  resetInventoryStore,
} from 'state/walletInventory/store'
import { selectDue } from 'state/walletInventory/updater'

const ACCOUNT = '0x28c6c06298d514db089934071355e5743bf21d60'
const USDT_LOWER = '0xdac17f958d2ee523a2206206994597c13d831ec7'
const USDT_CHECKSUM = '0xdAC17F958D2ee523a2206206994597C13D831ec7'
const KEY = inventoryKey(ChainId.MAINNET, ACCOUNT)

const row = (address: string, rawBalance: bigint, blockNumber: number): InventoryRow => ({
  address,
  rawBalance,
  blockNumber,
})

beforeEach(() => resetInventoryStore())
afterEach(() => {
  vi.useRealTimers()
})

describe('parseRawAmount', () => {
  it('reads a zero balance from the empty hex body the API sends', () => {
    // BigInt('0x') throws, and "0x" is exactly how a zero (i.e. a tombstone) arrives.
    expect(parseRawAmount('0x')).toBe(0n)
    expect(parseRawAmount('')).toBe(0n)
  })

  it('reads large hex amounts without precision loss', () => {
    expect(parseRawAmount('0x01cbfee17a39c5')).toBe(505770541726149n)
    // 30 digits: routed through a float64 this would land on 99999999999999991433150857216.
    expect(parseRawAmount('0x01431e0fae6d7217caa0000000')).toBe(100000000000000000000000000000n)
  })

  it('falls back to zero on malformed input instead of throwing', () => {
    expect(parseRawAmount('not-a-number')).toBe(0n)
  })
})

describe('adaptRow', () => {
  it('checksums the address so lookups match the keys the app uses elsewhere', () => {
    const adapted = adaptRow(ChainId.MAINNET, {
      tokenAddress: USDT_LOWER,
      rawAmount: '0x01cbfee17a39c5',
      blockNumber: 25822395,
    })
    expect(adapted?.address).toBe(USDT_CHECKSUM)
    expect(adapted?.rawBalance).toBe(505770541726149n)
  })

  it('normalizes the native sentinel to the address the app keys native balances by', () => {
    const adapted = adaptRow(ChainId.MAINNET, {
      tokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      rawAmount: '0x0186a0',
      blockNumber: 1,
      decimals: 18,
      symbol: 'ETH',
    })
    expect(adapted?.address).toBe(ETHER_ADDRESS)
    expect(adapted?.decimals).toBe(18)
  })

  it('keeps metadata optional, since unknown tokens arrive without any', () => {
    const adapted = adaptRow(ChainId.MAINNET, {
      tokenAddress: USDT_LOWER,
      rawAmount: '0x01',
      blockNumber: 1,
    })
    expect(adapted?.decimals).toBeUndefined()
    expect(adapted?.symbol).toBeUndefined()
  })

  it('drops a row whose address cannot be parsed rather than poisoning the map', () => {
    expect(adaptRow(ChainId.MAINNET, { tokenAddress: '0x123', rawAmount: '0x01', blockNumber: 1 })).toBeUndefined()
  })
})

describe('store commits', () => {
  it('marks a complete walk settled so absence can be read as zero', () => {
    commitResult(KEY, { rows: [row(USDT_CHECKSUM, 5n, 100)], complete: true, blockNumber: 100 })
    expect(readEntry(KEY)?.status).toBe('settled')
  })

  it('records a capped walk as partial, which consumers read as "use multicall"', () => {
    commitResult(KEY, { rows: [row(ETHER_ADDRESS, 7n, 110)], complete: false, blockNumber: 110 })
    expect(readEntry(KEY)?.status).toBe('partial')
    expect(resolveInventory(readEntry(KEY), true, '7').active).toBe(false)
  })

  it('never moves a token backwards in block terms', () => {
    commitResult(KEY, { rows: [row(USDT_CHECKSUM, 9n, 200)], complete: true, blockNumber: 200 })
    commitResult(KEY, { rows: [row(USDT_CHECKSUM, 3n, 150)], complete: true, blockNumber: 150 })
    expect(readEntry(KEY)?.rows[USDT_CHECKSUM]?.rawBalance).toBe(9n)
  })

  it('keeps the entry reference and wakes no subscribers when a poll returns unchanged data', () => {
    commitResult(KEY, { rows: [row(USDT_CHECKSUM, 5n, 100)], complete: true, blockNumber: 100 })
    const before = readEntry(KEY)
    const versionBefore = getStoreVersion()

    // The steady-state 30s poll: same balances, only the walk's high-water block advanced. A new
    // entry object here would cascade into a full re-sort of the token list on every tick.
    commitResult(KEY, { rows: [row(USDT_CHECKSUM, 5n, 100)], complete: true, blockNumber: 130 })

    expect(readEntry(KEY)).toBe(before)
    expect(readEntry(KEY)?.rows).toBe(before?.rows)
    expect(getStoreVersion()).toBe(versionBefore)
    // Bookkeeping still advanced so the awaiting-block logic sees the newer chain position.
    expect(readEntry(KEY)?.blockNumber).toBe(130)
  })

  it('still emits and replaces the entry when a balance actually moves', () => {
    commitResult(KEY, { rows: [row(USDT_CHECKSUM, 5n, 100)], complete: true, blockNumber: 100 })
    const before = readEntry(KEY)
    const versionBefore = getStoreVersion()

    commitResult(KEY, { rows: [row(USDT_CHECKSUM, 9n, 130)], complete: true, blockNumber: 130 })

    expect(readEntry(KEY)).not.toBe(before)
    expect(getStoreVersion()).toBeGreaterThan(versionBefore)
    expect(readEntry(KEY)?.rows[USDT_CHECKSUM]?.rawBalance).toBe(9n)
  })

  it('ends a catch-up watch when the indexer passes the block without any balance change', () => {
    // An approve: the transaction confirms at block 120 but moves no token balance.
    commitResult(KEY, { rows: [row(USDT_CHECKSUM, 5n, 100)], complete: true, blockNumber: 100 })
    expireInventory(ChainId.MAINNET, ACCOUNT, 120)

    commitResult(KEY, { rows: [row(USDT_CHECKSUM, 5n, 100)], complete: true, blockNumber: 125 })
    expect(isAwaitingBlock(KEY, Date.now())).toBe(false)
  })

  it('serves stale data after a failure instead of blanking the screen', () => {
    commitResult(KEY, { rows: [row(USDT_CHECKSUM, 5n, 100)], complete: true, blockNumber: 100 })
    commitFailure(KEY)

    const entry = readEntry(KEY)
    expect(entry?.status).toBe('settled')
    expect(entry?.rows[USDT_CHECKSUM]?.rawBalance).toBe(5n)
  })

  it('reports an error only when there is nothing at all to show', () => {
    commitFailure(KEY)
    expect(readEntry(KEY)?.status).toBe('error')
  })
})

describe('post-transaction catch-up', () => {
  it('keeps the watch alive across commits fetched inside the indexer lag', () => {
    commitResult(KEY, { rows: [row(USDT_CHECKSUM, 5n, 100)], complete: true, blockNumber: 100 })
    expireInventory(ChainId.MAINNET, ACCOUNT, 120)

    // Indexer still behind the transaction: the result commits (it matches what is on screen, so it
    // repaints nothing), but the watch must survive it, or catch-up would stop at the first stale poll.
    commitResult(KEY, { rows: [row(USDT_CHECKSUM, 5n, 110)], complete: true, blockNumber: 110 })
    expect(readEntry(KEY)?.blockNumber).toBe(110)
    expect(isAwaitingBlock(KEY, Date.now())).toBe(true)

    commitResult(KEY, { rows: [row(USDT_CHECKSUM, 2n, 125)], complete: true, blockNumber: 125 })
    expect(readEntry(KEY)?.rows[USDT_CHECKSUM]?.rawBalance).toBe(2n)
    expect(isAwaitingBlock(KEY, Date.now())).toBe(false)
  })

  it('never lets a stale in-flight walk overwrite a fresher committed balance', () => {
    // Two walks resolve out of order around a swap: the post-swap result lands first.
    commitResult(KEY, { rows: [row(USDT_CHECKSUM, 2n, 125)], complete: true, blockNumber: 125 })
    commitResult(KEY, { rows: [row(USDT_CHECKSUM, 5n, 110)], complete: true, blockNumber: 110 })
    expect(readEntry(KEY)?.rows[USDT_CHECKSUM]?.rawBalance).toBe(2n)
  })

  it('ignores transactions on chains the inventory does not serve', () => {
    expireInventory(ChainId.LINEA, ACCOUNT, 120)
    expect(readMeta(inventoryKey(ChainId.LINEA, ACCOUNT))).toBeUndefined()
  })

  it('paces the catch-up poll instead of refiring on every sweep', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000_000)
    register(ChainId.MAINNET, ACCOUNT)
    commitResult(KEY, { rows: [row(USDT_CHECKSUM, 5n, 100)], complete: true, blockNumber: 100 })
    expireInventory(ChainId.MAINNET, ACCOUNT, 120)

    // Forced: the first fetch fires immediately.
    expect(selectDue(1_000_000, true)).toHaveLength(1)
    // The stale result commits, advancing fetchedAt; the very next sweep must NOT refire —
    // this is the regression guard against the refuse-and-refetch tight loop.
    commitResult(KEY, { rows: [row(USDT_CHECKSUM, 5n, 100)], complete: true, blockNumber: 105 })
    expect(selectDue(Date.now() + 50, true)).toHaveLength(0)
    // After the catch-up interval it fires again — and only while the tab is visible.
    const later = Date.now() + INVENTORY_CATCHUP_INTERVAL_MS + 1
    expect(selectDue(later, false)).toHaveLength(0)
    expect(selectDue(later, true)).toHaveLength(1)
  })

  it('honors the failure backoff even while chasing a block', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000_000)
    register(ChainId.MAINNET, ACCOUNT)
    commitResult(KEY, { rows: [row(USDT_CHECKSUM, 5n, 100)], complete: true, blockNumber: 100 })
    expireInventory(ChainId.MAINNET, ACCOUNT, 120)
    commitFailure(KEY)

    // The service is erroring: the catch-up must wait out nextRetryAt like every other branch.
    expect(selectDue(Date.now() + 1_000, true)).toHaveLength(0)
  })
})

describe('resolveInventory', () => {
  const entry = (rows: InventoryRow[], status: InventoryEntry['status']): InventoryEntry => ({
    rows: Object.fromEntries(rows.map(r => [r.address, r])),
    status,
    blockNumber: 100,
    fetchedAt: 1,
  })

  it('stays inactive without a subscription', () => {
    const resolved = resolveInventory(entry([], 'settled'), false)
    expect(resolved.active).toBe(false)
    expect(resolved.pending).toBe(false)
  })

  it('reports pending before the first fetch lands, so the caller holds its multicall fallback', () => {
    const resolved = resolveInventory(undefined, true)
    expect(resolved.active).toBe(false)
    expect(resolved.pending).toBe(true)
  })

  it('drops pending once a fetch fails, so the fallback takes over instead of hanging', () => {
    const failed = { ...entry([], 'error'), status: 'error' as const }
    expect(resolveInventory(failed, true).pending).toBe(false)
  })

  it('distrusts a settled inventory that misses a funded wallet native balance', () => {
    // The API returns no rows both for a wallet it never indexed and for an empty one. A funded
    // wallet with no native row therefore means the data is not to be believed.
    const resolved = resolveInventory(entry([row(USDT_CHECKSUM, 5n, 100)], 'settled'), true, '1000')
    expect(resolved.active).toBe(false)
  })

  it('hands a partial inventory back to multicall — a capped walk is not authoritative', () => {
    const resolved = resolveInventory(entry([row(USDT_CHECKSUM, 5n, 100)], 'partial'), true, '1000')
    expect(resolved.active).toBe(false)
    expect(resolved.pending).toBe(false)
  })

  it('withholds settled until the native read lands, so no zeros are asserted prematurely', () => {
    // Settled-but-empty response, native balance still loading: this is the exact window where an
    // un-indexed funded wallet would otherwise flash "0" on every token before the trust check runs.
    const resolved = resolveInventory(entry([], 'settled'), true, undefined)
    expect(resolved.active).toBe(true)
    expect(resolved.settled).toBe(false)
  })

  it('accepts a settled inventory with no native row when the wallet holds no native balance', () => {
    const resolved = resolveInventory(entry([row(USDT_CHECKSUM, 5n, 100)], 'settled'), true, '0')
    expect(resolved.active).toBe(true)
    expect(resolved.settled).toBe(true)
  })

  it('overlays the live native balance over the indexed one', () => {
    const resolved = resolveInventory(entry([row(ETHER_ADDRESS, 5n, 100)], 'settled'), true, '999')
    expect(resolved.rows[ETHER_ADDRESS].rawBalance).toBe(999n)
  })

  it('overlays a live native balance of exactly zero — a drained wallet must not show its stale amount', () => {
    // Max-send just mined: the per-block read says 0 while the indexer still reports the old 5.
    const resolved = resolveInventory(entry([row(ETHER_ADDRESS, 5n, 100)], 'settled'), true, '0')
    expect(resolved.rows[ETHER_ADDRESS].rawBalance).toBe(0n)
  })
})

describe('buildInventoryBalanceMap', () => {
  const token = new Token(ChainId.MAINNET, USDT_CHECKSUM, 6, 'USDT')
  const other = new Token(ChainId.MAINNET, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18, 'DAI')

  const inventory = (rows: InventoryRow[], settled: boolean) => ({
    rows: Object.fromEntries(rows.map(r => [r.address, r])),
    active: true,
    settled,
    pending: false,
  })

  it('synthesizes an explicit zero for unlisted tokens once settled', () => {
    const map = buildInventoryBalanceMap([token, other], inventory([row(USDT_CHECKSUM, 5n, 1)], true))
    expect(map[USDT_CHECKSUM]?.quotient.toString()).toBe('5')
    // The API omits zero balances, so "absent from a settled walk" is the only way a zero arrives.
    expect(map[other.address]?.quotient.toString()).toBe('0')
  })

  it('leaves unlisted tokens undefined while the walk is incomplete, so the UI keeps loading', () => {
    const map = buildInventoryBalanceMap([token, other], inventory([row(USDT_CHECKSUM, 5n, 1)], false))
    expect(map[other.address]).toBeUndefined()
  })

  it('returns nothing at all when the inventory is inactive', () => {
    const map = buildInventoryBalanceMap([token], { rows: {}, active: false, settled: false, pending: false })
    expect(Object.keys(map)).toHaveLength(0)
  })

  it('reuses one zero amount per token across rebuilds', () => {
    const first = buildInventoryBalanceMap([token, other], inventory([row(USDT_CHECKSUM, 5n, 1)], true))
    const second = buildInventoryBalanceMap([token, other], inventory([row(USDT_CHECKSUM, 5n, 2)], true))
    expect(first[other.address]).toBe(second[other.address])
  })
})

describe('computeInventoryDiscoveries', () => {
  const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
  const FAKE_USDT = '0x1000000000000000000000000000000000000001'
  const NOVEL = '0x2000000000000000000000000000000000000002'

  const whitelisted = (address: string, symbol: string) =>
    new WrappedTokenInfo({ chainId: ChainId.MAINNET, address, decimals: 18, symbol, name: symbol, isWhitelisted: true })

  const activeInventory = (rows: InventoryRow[]) => ({
    rows: Object.fromEntries(rows.map(r => [r.address, r])),
    active: true,
    settled: true,
    pending: false,
  })

  const heldRow = (address: string, symbol: string): InventoryRow => ({
    address,
    rawBalance: 5n,
    blockNumber: 1,
    decimals: 18,
    symbol,
  })

  it('flags a held token borrowing a whitelisted symbol at a different address', () => {
    const { tokens, impersonators } = computeInventoryDiscoveries(
      activeInventory([heldRow(FAKE_USDT, 'USDT')]),
      { [USDT_CHECKSUM]: whitelisted(USDT_CHECKSUM, 'USDT') },
      [],
      ChainId.MAINNET,
    )
    expect(tokens.map(t => t.address)).toEqual([FAKE_USDT])
    expect(impersonators.has(FAKE_USDT)).toBe(true)
  })

  it('flags an already-imported fake too — being tricked into importing must not clear the warning', () => {
    const imported = new Token(ChainId.MAINNET, FAKE_USDT, 18, 'USDT')
    const { tokens, impersonators } = computeInventoryDiscoveries(
      activeInventory([]),
      { [USDT_CHECKSUM]: whitelisted(USDT_CHECKSUM, 'USDT') },
      [imported],
      ChainId.MAINNET,
    )
    // Imported tokens are not discoveries (they already render in the list)…
    expect(tokens).toHaveLength(0)
    // …but their impersonation flag must still be raised.
    expect(impersonators.has(FAKE_USDT)).toBe(true)
  })

  it('does not let an imported fake pose as the symbol owner', () => {
    // `defaultTokens` merges user imports; only genuinely whitelisted entries may own a symbol.
    const importedFake = new WrappedTokenInfo({
      chainId: ChainId.MAINNET,
      address: FAKE_USDT,
      decimals: 18,
      symbol: 'USDT',
      name: 'USDT',
    })
    const { impersonators } = computeInventoryDiscoveries(
      activeInventory([heldRow(NOVEL, 'USDT')]),
      { [FAKE_USDT]: importedFake },
      [new Token(ChainId.MAINNET, FAKE_USDT, 18, 'USDT')],
      ChainId.MAINNET,
    )
    // No whitelisted USDT exists here, so neither token can be called an impersonator of one.
    expect(impersonators.size).toBe(0)
  })

  it('does not flag legitimate multi-address symbols where every owner is whitelisted', () => {
    const { impersonators } = computeInventoryDiscoveries(
      activeInventory([]),
      { [USDT_CHECKSUM]: whitelisted(USDT_CHECKSUM, 'USDC'), [DAI]: whitelisted(DAI, 'USDC') },
      [new Token(ChainId.MAINNET, DAI, 18, 'USDC')],
      ChainId.MAINNET,
    )
    expect(impersonators.size).toBe(0)
  })

  it('drops rows without decimals rather than guessing an amount scale', () => {
    const bare: InventoryRow = { address: NOVEL, rawBalance: 5n, blockNumber: 1 }
    const { tokens } = computeInventoryDiscoveries(activeInventory([bare]), {}, [], ChainId.MAINNET)
    expect(tokens).toHaveLength(0)
  })
})

describe('mergeHeldSearchResults', () => {
  const usdt = new Token(ChainId.MAINNET, USDT_CHECKSUM, 6, 'USDT')
  const dai = new Token(ChainId.MAINNET, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18, 'DAI')
  const novel = new Token(ChainId.MAINNET, '0x2000000000000000000000000000000000000002', 18, 'NOV')

  it('returns results untouched when nothing is held', () => {
    const results = [usdt, dai]
    expect(mergeHeldSearchResults(results, [novel], undefined)).toBe(results)
    expect(mergeHeldSearchResults(results, [novel], new Set())).toBe(results)
  })

  it('leads with held tokens while keeping the catalog order within each group', () => {
    const merged = mergeHeldSearchResults([usdt, dai, novel], [], new Set([novel.address, dai.address]))
    expect(merged.map(t => t.symbol)).toEqual(['DAI', 'NOV', 'USDT'])
  })

  it('adds held matches the catalog missed, without duplicating ones it found', () => {
    const catalogNovel = new Token(ChainId.MAINNET, novel.address, 18, 'NOV', 'Novel Token')
    const merged = mergeHeldSearchResults([usdt, catalogNovel], [novel, dai], new Set([novel.address, dai.address]))
    expect(merged.map(t => t.wrapped.address)).toEqual([novel.address, dai.address, usdt.address])
    // The catalog's richer row (it carries a name) is the one kept.
    expect(merged[0]).toBe(catalogNovel)
  })
})

describe('selectDue', () => {
  const now = 1_000_000

  it('fetches a cold wallet even while the tab is hidden', () => {
    register(ChainId.MAINNET, ACCOUNT)
    expect(selectDue(now, false)).toHaveLength(1)
  })

  it('holds off on a TTL refresh while the tab is hidden', () => {
    register(ChainId.MAINNET, ACCOUNT)
    vi.useFakeTimers()
    vi.setSystemTime(now)
    commitResult(KEY, { rows: [], complete: true, blockNumber: 100 })

    const later = now + INVENTORY_TTL_MS + 1
    expect(selectDue(later, false)).toHaveLength(0)
    expect(selectDue(later, true)).toHaveLength(1)
  })

  it('ignores chains the service does not index', () => {
    register(ChainId.LINEA, ACCOUNT)
    expect(selectDue(now, true)).toHaveLength(0)
  })
})
