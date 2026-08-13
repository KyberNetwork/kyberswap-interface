import { ChainId } from '@kyberswap/ks-sdk-core'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Exchange } from 'pages/Earns/constants'
import { DEFAULT_PARSED_POSITION, ParsedPosition } from 'pages/Earns/types'
import {
  UNFINALIZED_POSITION_TTL_MS,
  UnfinalizedPositionInput,
  getUnfinalizedPositionKey,
  getUnfinalizedPositionKeyFromPosition,
  getUnfinalizedPositionKeyFromRoute,
  getUnfinalizedPositionRecords,
  pruneUnfinalizedPositions,
  resolveUnfinalizedPositions,
  updateUnfinalizedPosition,
} from 'pages/Earns/utils/unfinalizedPosition'

const OWNER = '0x1111111111111111111111111111111111111111'
const POOL = '0x2222222222222222222222222222222222222222'
const NFT_DEX = Exchange.DEX_UNISWAPV3
const UNIV2_DEX = Exchange.DEX_UNISWAPV2

const createStorage = (): Storage => {
  const store = new Map<string, string>()
  return {
    get length() {
      return store.size
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => void store.delete(key),
    setItem: (key: string, value: string) => void store.set(key, value),
  } as Storage
}

const input = (overrides: Partial<UnfinalizedPositionInput> = {}): UnfinalizedPositionInput => ({
  chainId: ChainId.MAINNET,
  dexId: NFT_DEX,
  dexLogo: 'dex.png',
  poolAddress: POOL,
  poolFee: 0.3,
  tokenId: '123',
  txHash: '0xabc',
  value: 1000,
  createdAt: Date.now(),
  isValueUpdating: false,
  token0: { address: '0xaaa', symbol: 'A', logo: 'a.png', amount: 1, decimals: 6 },
  token1: { address: '0xbbb', symbol: 'B', logo: 'b.png', amount: 2, decimals: 8 },
  ...overrides,
})

const indexedPosition = (overrides: Partial<ParsedPosition> = {}): ParsedPosition => ({
  ...DEFAULT_PARSED_POSITION,
  positionId: `0xnft-123`,
  tokenId: '123',
  chain: { ...DEFAULT_PARSED_POSITION.chain, id: ChainId.MAINNET },
  dex: { ...DEFAULT_PARSED_POSITION.dex, id: NFT_DEX },
  pool: { ...DEFAULT_PARSED_POSITION.pool, address: POOL },
  ...overrides,
})

const resolve = (positions: ParsedPosition[] = [], now = Date.now()) =>
  resolveUnfinalizedPositions({ records: getUnfinalizedPositionRecords(OWNER), positions, now })

describe('unfinalized position cache', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: createStorage(),
      addEventListener: () => {},
      removeEventListener: () => {},
    })
  })

  describe('keys', () => {
    it('matches a cached NFT position with its indexed row', () => {
      const cached = getUnfinalizedPositionKey({ chainId: ChainId.MAINNET, dexId: NFT_DEX, tokenId: '123' })
      expect(getUnfinalizedPositionKeyFromPosition(indexedPosition())).toBe(cached)
    })

    it('rebuilds the key of an NFT position from its detail route', () => {
      expect(
        getUnfinalizedPositionKeyFromRoute({
          chainId: String(ChainId.MAINNET),
          dexId: NFT_DEX,
          positionId: '0x1234567890123456789012345678901234567890-123',
        }),
      ).toBe(getUnfinalizedPositionKey({ chainId: ChainId.MAINNET, dexId: NFT_DEX, tokenId: '123' }))
    })

    it('rebuilds the key of a UniV2 pair from its detail route, which carries the pool address', () => {
      expect(getUnfinalizedPositionKeyFromRoute({ chainId: ChainId.MAINNET, dexId: UNIV2_DEX, positionId: POOL })).toBe(
        getUnfinalizedPositionKey({ chainId: ChainId.MAINNET, dexId: UNIV2_DEX, poolAddress: POOL }),
      )
    })

    it('separates positions that share a token id across chains and dexes', () => {
      const base = { dexId: NFT_DEX, tokenId: '123' }
      expect(getUnfinalizedPositionKey({ ...base, chainId: ChainId.MAINNET })).not.toBe(
        getUnfinalizedPositionKey({ ...base, chainId: ChainId.BASE }),
      )
      expect(getUnfinalizedPositionKey({ ...base, chainId: ChainId.MAINNET })).not.toBe(
        getUnfinalizedPositionKey({ chainId: ChainId.MAINNET, dexId: Exchange.DEX_PANCAKESWAPV3, tokenId: '123' }),
      )
    })

    it('keeps token ids beyond 2^53 distinct', () => {
      const first = getUnfinalizedPositionKey({ chainId: 1, dexId: NFT_DEX, tokenId: '9007199254740993' })
      const second = getUnfinalizedPositionKey({ chainId: 1, dexId: NFT_DEX, tokenId: '9007199254740992' })
      expect(first).not.toBe(second)
    })

    it('refuses to address an NFT position whose token id is missing or a UniV2 placeholder id', () => {
      expect(getUnfinalizedPositionKey({ chainId: 1, dexId: NFT_DEX, tokenId: '' })).toBeUndefined()
      expect(getUnfinalizedPositionKey({ chainId: 1, dexId: NFT_DEX, tokenId: '0' })).toBeUndefined()
    })
  })

  describe('writing', () => {
    it('stores a position that can be addressed', () => {
      expect(updateUnfinalizedPosition(input(), OWNER)).toBe(true)
      expect(getUnfinalizedPositionRecords(OWNER)).toHaveLength(1)
    })

    it('refuses an NFT position whose minted id could not be resolved', () => {
      expect(updateUnfinalizedPosition(input({ tokenId: undefined }), OWNER)).toBe(false)
      expect(getUnfinalizedPositionRecords(OWNER)).toHaveLength(0)
    })

    it('stores a UniV2 pair, which has no token id', () => {
      expect(updateUnfinalizedPosition(input({ dexId: UNIV2_DEX, tokenId: undefined }), OWNER)).toBe(true)
      expect(getUnfinalizedPositionRecords(OWNER)[0].positionId).toBe(POOL)
    })

    it('ignores a write with no owner, so one wallet cannot leak into another session', () => {
      expect(updateUnfinalizedPosition(input(), undefined)).toBe(false)
    })

    it('replaces an entry for the same position rather than duplicating it', () => {
      updateUnfinalizedPosition(input({ value: 1000 }), OWNER)
      updateUnfinalizedPosition(input({ value: 2000 }), OWNER)
      const records = getUnfinalizedPositionRecords(OWNER)
      expect(records).toHaveLength(1)
      expect(records[0].value).toBe(2000)
    })

    it('times out from the write, so an increase on an old position still gets its full window', () => {
      const createdAt = Date.now() - 400 * 24 * 60 * 60 * 1000
      updateUnfinalizedPosition(input({ createdAt, isValueUpdating: true }), OWNER)
      expect(resolve([]).placeholderByKey.size).toBe(1)
    })
  })

  describe('reading', () => {
    it('shows a placeholder until the indexer returns the position', () => {
      updateUnfinalizedPosition(input(), OWNER)
      expect(resolve([]).placeholders).toHaveLength(1)

      const { placeholders, staleKeys } = resolve([indexedPosition()])
      expect(placeholders).toHaveLength(0)
      expect(staleKeys).toHaveLength(1)
    })

    it('does not persist indexed data back onto the cached entry', () => {
      const createdAt = Date.now() - 60_000
      updateUnfinalizedPosition(input({ createdAt, txHash: '0xzap', isValueUpdating: true }), OWNER)
      resolve([indexedPosition({ totalProvidedValue: 1 })])

      const [record] = getUnfinalizedPositionRecords(OWNER)
      expect(record.createdAt).toBe(createdAt)
      expect(record.txHash).toBe('0xzap')
    })

    it('keeps an increase-liquidity entry while the indexed value is still stale', () => {
      updateUnfinalizedPosition(input({ value: 1000, isValueUpdating: true }), OWNER)
      const { valueUpdatingKeys, staleKeys } = resolve([indexedPosition({ totalProvidedValue: 400 })])
      expect(valueUpdatingKeys.size).toBe(1)
      expect(staleKeys).toHaveLength(0)
    })

    it('drops an increase-liquidity entry once the indexed value has caught up', () => {
      updateUnfinalizedPosition(input({ value: 1000, isValueUpdating: true }), OWNER)
      const { valueUpdatingKeys, staleKeys } = resolve([indexedPosition({ totalProvidedValue: 1000 })])
      expect(valueUpdatingKeys.size).toBe(0)
      expect(staleKeys).toHaveLength(1)
    })

    it('keeps an increase-liquidity entry when the indexed value reads zero', () => {
      updateUnfinalizedPosition(input({ value: 1000, isValueUpdating: true }), OWNER)
      const { valueUpdatingKeys, staleKeys } = resolve([indexedPosition({ totalProvidedValue: 0 })])
      expect(valueUpdatingKeys.size).toBe(1)
      expect(staleKeys).toHaveLength(0)
    })

    it('addresses the right entry when several zaps are pending', () => {
      updateUnfinalizedPosition(input({ tokenId: '111' }), OWNER)
      updateUnfinalizedPosition(input({ tokenId: '222' }), OWNER)

      const { placeholderByKey } = resolve([])
      const firstKey = getUnfinalizedPositionKey({ chainId: ChainId.MAINNET, dexId: NFT_DEX, tokenId: '111' })
      expect(placeholderByKey.get(firstKey as string)?.tokenId).toBe('111')
    })

    it('does not let a UniV2 row finalize an unrelated NFT entry', () => {
      updateUnfinalizedPosition(input({ tokenId: '123' }), OWNER)
      const univ2Row = indexedPosition({ dex: { ...DEFAULT_PARSED_POSITION.dex, id: UNIV2_DEX }, tokenId: '0' })
      expect(resolve([univ2Row]).staleKeys).toHaveLength(0)
    })

    it('expires an entry once its window has passed', () => {
      updateUnfinalizedPosition(input(), OWNER)
      const { placeholders, staleKeys } = resolve([], Date.now() + UNFINALIZED_POSITION_TTL_MS + 1)
      expect(placeholders).toHaveLength(0)
      expect(staleKeys).toHaveLength(1)
    })

    it('renders a placeholder carrying the amounts the zap reported', () => {
      updateUnfinalizedPosition(input(), OWNER)
      const [placeholder] = resolve([]).placeholders
      expect(placeholder.isUnfinalized).toBe(true)
      expect(placeholder.token0.symbol).toBe('A')
      expect(placeholder.token0.decimals).toBe(6)
      expect(placeholder.totalProvidedValue).toBe(1000)
    })

    it('returns the newest zap first', () => {
      updateUnfinalizedPosition(input({ tokenId: '111' }), OWNER)
      updateUnfinalizedPosition(input({ tokenId: '222' }), OWNER)
      expect(resolve([]).placeholders[0].tokenId).toBe('222')
    })
  })

  describe('hygiene', () => {
    const write = (raw: string) =>
      window.localStorage.setItem(`kyber_earn_unfinalized_positions_v2_${OWNER.toLowerCase()}`, raw)

    it('ignores malformed json', () => {
      write('{oops')
      expect(getUnfinalizedPositionRecords(OWNER)).toHaveLength(0)
    })

    it('ignores json that is not an array', () => {
      write('{"key":"a"}')
      expect(getUnfinalizedPositionRecords(OWNER)).toHaveLength(0)
    })

    it('discards entries of a foreign shape instead of rendering them', () => {
      write(JSON.stringify([{ positionId: '0x1', tokenId: '1', chain: { id: 1 } }]))
      expect(getUnfinalizedPositionRecords(OWNER)).toHaveLength(0)
      expect(() => resolve([])).not.toThrow()
    })

    it('discards entries naming a chain or dex the app does not support', () => {
      updateUnfinalizedPosition(input(), OWNER)
      const [record] = getUnfinalizedPositionRecords(OWNER)
      write(JSON.stringify([{ ...record, chainId: 999_999 }]))
      expect(getUnfinalizedPositionRecords(OWNER)).toHaveLength(0)

      write(JSON.stringify([{ ...record, dexId: 'not-a-dex' }]))
      expect(getUnfinalizedPositionRecords(OWNER)).toHaveLength(0)
    })

    it('returns a stable reference while storage is unchanged', () => {
      updateUnfinalizedPosition(input(), OWNER)
      expect(getUnfinalizedPositionRecords(OWNER)).toBe(getUnfinalizedPositionRecords(OWNER))
    })

    it('keeps each wallet in its own bucket', () => {
      const other = '0x9999999999999999999999999999999999999999'
      updateUnfinalizedPosition(input(), OWNER)
      expect(getUnfinalizedPositionRecords(other)).toHaveLength(0)
    })

    it('clears entries left by a superseded cache shape', () => {
      window.localStorage.setItem(`kyber_earn_unfinalized_positions_${OWNER.toLowerCase()}`, '[{"tokenId":"1"}]')
      updateUnfinalizedPosition(input(), OWNER)
      pruneUnfinalizedPositions(OWNER)

      expect(window.localStorage.getItem(`kyber_earn_unfinalized_positions_${OWNER.toLowerCase()}`)).toBeNull()
      expect(getUnfinalizedPositionRecords(OWNER)).toHaveLength(1)
    })
  })
})
