import { NETWORKS_INFO, isSupportedChainId } from 'constants/networks'
import { EARN_CHAINS, EARN_DEXES, EarnChain, Exchange, isSupportedExchange } from 'pages/Earns/constants'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'
import { DEFAULT_PARSED_POSITION, ParsedPosition } from 'pages/Earns/types'
import { getNftManagerContractAddress } from 'pages/Earns/utils'
import { getDexVersion } from 'pages/Earns/utils/position'
import type { UnfinalizedPositionSnapshot } from 'state/transactions/type'

/**
 * A zap is confirmed on chain before the backend indexes it. Until it does, the positions list and the
 * position detail page render a locally authored placeholder so the user sees the position they just
 * created. This module owns that cache: what is persisted, how an entry is matched against indexed data,
 * and when an entry stops being relevant.
 */

/** How long a placeholder survives when the indexer never catches up, measured from write time. */
export const UNFINALIZED_POSITION_TTL_MS = 5 * 60 * 1000

// An increase-liquidity placeholder is dropped once the indexed value lands within this relative distance
// of the value the zap reported, i.e. the added liquidity has been picked up.
const VALUE_MATCH_TOLERANCE = 0.01

const STORAGE_KEY_PREFIX = 'kyber_earn_unfinalized_positions_v2'
// Entries under this prefix hold a superseded record shape. Note the current prefix also starts with it.
const LEGACY_STORAGE_KEY_PREFIX = 'kyber_earn_unfinalized_positions'

export interface UnfinalizedPositionTokenInput {
  address: string
  symbol: string
  logo: string
  amount: number
  decimals?: number
}

export interface UnfinalizedPositionInput {
  chainId: number
  dexId: Exchange
  dexLogo?: string
  poolAddress: string
  poolFee: number
  /** The minted NFT id. Required for NFT positions, unused for UniV2 pairs. */
  tokenId?: string
  txHash: string
  value: number
  createdAt: number
  isValueUpdating: boolean
  token0: UnfinalizedPositionTokenInput
  token1: UnfinalizedPositionTokenInput
}

interface UnfinalizedPositionToken {
  address: string
  symbol: string
  logo: string
  amount: number
  decimals: number
}

export interface UnfinalizedPositionRecord {
  key: string
  positionId: string
  chainId: number
  dexId: Exchange
  dexLogo: string
  poolAddress: string
  poolFee: number
  tokenId: string
  txHash: string
  value: number
  /** When the position was created on chain. */
  createdAt: number
  /** Wall clock at write time; the only input to the TTL. */
  cachedAt: number
  isValueUpdating: boolean
  token0: UnfinalizedPositionToken
  token1: UnfinalizedPositionToken
}

/** The shape every zap widget reports for the position its route produces. */
interface WidgetPosition {
  positionId?: string
  chainId: number
  dexLogo: string
  pool: { address: string; fee: number }
  token0: { address: string; symbol: string; logo: string; amount: number; decimals?: number }
  token1: { address: string; symbol: string; logo: string; amount: number; decimals?: number }
  value: number
  createdAt: number
}

export interface ResolvedUnfinalizedPositions {
  /** Placeholder rows for positions the indexer has not returned yet, newest first. */
  placeholders: ParsedPosition[]
  /** Every live placeholder addressable by key, including increase-liquidity ones. */
  placeholderByKey: Map<string, ParsedPosition>
  /** Keys whose indexed row exists but still reports a pre-zap value. */
  valueUpdatingKeys: Set<string>
  /** Keys that expired or finalized and can be dropped from storage. */
  staleKeys: string[]
}

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

const isUniv2Dex = (dexId: Exchange) => EARN_DEXES[dexId].isForkFrom === CoreProtocol.UniswapV2

// NFT managers mint from 1, so '0' never identifies a position — it is what `parsePosition` falls back to
// for UniV2 rows, which would otherwise collide with an NFT entry that failed to resolve its id.
const normalizeTokenId = (tokenId?: string | number): string | undefined => {
  const raw = tokenId === undefined || tokenId === null ? '' : tokenId.toString().trim()
  if (!raw || raw === '0') return undefined
  // Ids are uint256, so compare them as canonical decimal strings rather than as numbers.
  return /^\d+$/.test(raw) ? raw.replace(/^0+(?=\d)/, '') : raw.toLowerCase()
}

/**
 * Identity shared by a cached placeholder and its indexed row. NFT positions are unique per
 * (chain, dex, NFT id); UniV2 pairs have no NFT, and a wallet holds a single LP balance per pool, so they
 * key on the pool address. Returns undefined when the position is not addressable yet.
 */
export const getUnfinalizedPositionKey = ({
  chainId,
  dexId,
  poolAddress,
  tokenId,
}: {
  chainId: number
  dexId: Exchange
  poolAddress?: string
  tokenId?: string
}): string | undefined => {
  if (!isSupportedChainId(chainId) || !isSupportedExchange(dexId)) return undefined

  if (isUniv2Dex(dexId)) {
    const pool = poolAddress?.trim().toLowerCase()
    return pool ? `${chainId}:${dexId.toLowerCase()}:v2:${pool}` : undefined
  }

  const normalizedTokenId = normalizeTokenId(tokenId)
  return normalizedTokenId ? `${chainId}:${dexId.toLowerCase()}:nft:${normalizedTokenId}` : undefined
}

export const getUnfinalizedPositionKeyFromPosition = (position: ParsedPosition) =>
  getUnfinalizedPositionKey({
    chainId: position.chain.id,
    dexId: position.dex.id,
    poolAddress: position.pool.address,
    tokenId: position.tokenId,
  })

/**
 * The position-detail route carries `<nftManager>-<tokenId>` for NFT positions and the pool address for
 * UniV2 pairs, so the key can be rebuilt from the URL alone, before any indexed data has arrived.
 */
export const getUnfinalizedPositionKeyFromRoute = ({
  chainId,
  dexId,
  positionId,
}: {
  chainId?: number | string
  dexId?: string
  positionId?: string
}): string | undefined => {
  const parsedChainId = Number(chainId)
  if (!isSupportedChainId(parsedChainId) || !isSupportedExchange(dexId) || !positionId) return undefined

  const exchange = dexId as Exchange
  return getUnfinalizedPositionKey({
    chainId: parsedChainId,
    dexId: exchange,
    poolAddress: positionId,
    tokenId: isUniv2Dex(exchange) ? undefined : positionId.split('-')[1],
  })
}

const sanitizeToken = (value: unknown): UnfinalizedPositionToken | undefined => {
  if (!value || typeof value !== 'object') return undefined
  const token = value as Partial<UnfinalizedPositionToken>
  if (typeof token.address !== 'string' || !isFiniteNumber(token.amount)) return undefined

  return {
    address: token.address,
    symbol: typeof token.symbol === 'string' ? token.symbol : '',
    logo: typeof token.logo === 'string' ? token.logo : '',
    amount: token.amount,
    decimals: isFiniteNumber(token.decimals) ? token.decimals : DEFAULT_PARSED_POSITION.token0.decimals,
  }
}

// Entries can predate a release or be truncated by a storage quota error, and a malformed one reaching the
// positions list would take the route down, so anything that does not type-check is discarded.
const sanitizeRecord = (value: unknown): UnfinalizedPositionRecord | undefined => {
  if (!value || typeof value !== 'object') return undefined
  const record = value as Partial<UnfinalizedPositionRecord>
  const token0 = sanitizeToken(record.token0)
  const token1 = sanitizeToken(record.token1)

  if (
    !token0 ||
    !token1 ||
    typeof record.key !== 'string' ||
    !record.key ||
    typeof record.positionId !== 'string' ||
    !isSupportedExchange(record.dexId) ||
    !isSupportedChainId(record.chainId) ||
    !isFiniteNumber(record.cachedAt) ||
    !isFiniteNumber(record.value)
  )
    return undefined

  return {
    key: record.key,
    positionId: record.positionId,
    chainId: record.chainId,
    dexId: record.dexId as Exchange,
    dexLogo: typeof record.dexLogo === 'string' ? record.dexLogo : '',
    poolAddress: typeof record.poolAddress === 'string' ? record.poolAddress : '',
    poolFee: isFiniteNumber(record.poolFee) ? record.poolFee : 0,
    tokenId: typeof record.tokenId === 'string' ? record.tokenId : '',
    txHash: typeof record.txHash === 'string' ? record.txHash : '',
    value: record.value,
    createdAt: isFiniteNumber(record.createdAt) ? record.createdAt : record.cachedAt,
    cachedAt: record.cachedAt,
    isValueUpdating: record.isValueUpdating === true,
    token0,
    token1,
  }
}

/**
 * Maps what a zap widget reports about the position it is creating onto the snapshot carried by the
 * transaction. Returns undefined when the widget could not describe the position, in which case the zap
 * simply gets no placeholder.
 */
export const toUnfinalizedPositionSnapshot = (
  dexId: Exchange,
  position?: WidgetPosition,
): UnfinalizedPositionSnapshot | undefined =>
  position
    ? {
        chainId: position.chainId,
        dex: dexId,
        dexLogo: position.dexLogo,
        positionId: position.positionId,
        pool: { address: position.pool.address, fee: position.pool.fee },
        token0: { ...position.token0 },
        token1: { ...position.token1 },
        value: position.value,
        createdAt: position.createdAt,
      }
    : undefined

const EMPTY_RECORDS: readonly UnfinalizedPositionRecord[] = Object.freeze([])

const listeners = new Set<() => void>()
// `getSnapshot` runs on every render of every consumer, so the parsed array is reused while the serialized
// payload is byte-identical. Comparing the stored string rather than trusting a change counter keeps the
// snapshot correct no matter who wrote it.
const snapshotCache = new Map<string, { raw: string | null; records: readonly UnfinalizedPositionRecord[] }>()

const getStorageKey = (owner: string) => `${STORAGE_KEY_PREFIX}_${owner.toLowerCase()}`

const emit = () => listeners.forEach(listener => listener())

const handleStorageEvent = (event: StorageEvent) => {
  // A null key means the whole store was cleared.
  if (event.key !== null && !event.key.startsWith(LEGACY_STORAGE_KEY_PREFIX)) return
  emit()
}

/** Subscribes to writes from this tab and to `storage` events from other tabs. */
export const subscribeUnfinalizedPositions = (listener: () => void) => {
  listeners.add(listener)
  if (listeners.size === 1 && typeof window !== 'undefined') window.addEventListener('storage', handleStorageEvent)

  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && typeof window !== 'undefined') window.removeEventListener('storage', handleStorageEvent)
  }
}

const readRaw = (storageKey: string): string | null => {
  try {
    return window.localStorage.getItem(storageKey)
  } catch (error) {
    console.warn('Failed to read unfinalized positions:', error)
    return null
  }
}

const parseRecords = (raw: string | null): readonly UnfinalizedPositionRecord[] => {
  if (!raw) return EMPTY_RECORDS
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return EMPTY_RECORDS
    const records = parsed.map(sanitizeRecord).filter((record): record is UnfinalizedPositionRecord => !!record)
    return records.length ? records : EMPTY_RECORDS
  } catch (error) {
    console.warn('Failed to parse unfinalized positions:', error)
    return EMPTY_RECORDS
  }
}

// Entries written under a superseded record shape are unreachable and would otherwise be kept forever.
const sweepLegacyStorage = () => {
  try {
    const storage = window.localStorage
    const staleKeys: string[] = []
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index)
      if (key && key.startsWith(LEGACY_STORAGE_KEY_PREFIX) && !key.startsWith(STORAGE_KEY_PREFIX)) staleKeys.push(key)
    }
    staleKeys.forEach(key => storage.removeItem(key))
  } catch {
    // Clearing superseded entries is best effort and must never block the current read or write.
  }
}

/**
 * Sanitized snapshot for the owner. The parsed array is reused while the serialized payload is unchanged,
 * so `useSyncExternalStore` sees a stable reference.
 */
export const getUnfinalizedPositionRecords = (owner?: string): readonly UnfinalizedPositionRecord[] => {
  if (typeof window === 'undefined' || !owner) return EMPTY_RECORDS

  const storageKey = getStorageKey(owner)
  const raw = readRaw(storageKey)
  const cached = snapshotCache.get(storageKey)
  if (cached && cached.raw === raw) return cached.records

  const records = parseRecords(raw)
  snapshotCache.set(storageKey, { raw, records })
  return records
}

const mutateRecords = (
  owner: string | undefined,
  mutator: (records: readonly UnfinalizedPositionRecord[]) => UnfinalizedPositionRecord[],
): boolean => {
  if (typeof window === 'undefined' || !owner) return false

  const storageKey = getStorageKey(owner)

  const now = Date.now()
  const next = mutator(getUnfinalizedPositionRecords(owner)).filter(
    record => now - record.cachedAt <= UNFINALIZED_POSITION_TTL_MS,
  )
  const nextRaw = next.length ? JSON.stringify(next) : null
  if (nextRaw === readRaw(storageKey)) return true

  try {
    if (nextRaw === null) window.localStorage.removeItem(storageKey)
    else window.localStorage.setItem(storageKey, nextRaw)
  } catch (error) {
    console.warn('Failed to persist unfinalized positions:', error)
    return false
  }

  snapshotCache.set(storageKey, { raw: nextRaw, records: next.length ? next : EMPTY_RECORDS })
  emit()
  return true
}

const toRecordToken = (token: UnfinalizedPositionTokenInput): UnfinalizedPositionToken => ({
  address: token.address,
  symbol: token.symbol,
  logo: token.logo,
  amount: isFiniteNumber(token.amount) ? token.amount : 0,
  decimals: isFiniteNumber(token.decimals) ? token.decimals : DEFAULT_PARSED_POSITION.token0.decimals,
})

/**
 * Caches the locally authored snapshot of a confirmed zap. Returns false when the position is not
 * addressable — an NFT position whose minted id could not be read, or an unknown NFT manager — so nothing
 * that the read sites could never match, and whose detail link would be dead, is ever stored.
 */
export const updateUnfinalizedPosition = (input: UnfinalizedPositionInput, owner?: string): boolean => {
  if (typeof window === 'undefined' || !owner || !isFiniteNumber(input.value) || !isSupportedExchange(input.dexId))
    return false

  const key = getUnfinalizedPositionKey({
    chainId: input.chainId,
    dexId: input.dexId,
    poolAddress: input.poolAddress,
    tokenId: input.tokenId,
  })
  if (!key) return false

  const isUniv2 = isUniv2Dex(input.dexId)
  const tokenId = normalizeTokenId(input.tokenId) ?? ''
  const nftManagerAddress = isUniv2 ? undefined : getNftManagerContractAddress(input.dexId, input.chainId)
  if (!isUniv2 && (!tokenId || !nftManagerAddress)) return false

  const cachedAt = Date.now()
  const record: UnfinalizedPositionRecord = {
    key,
    positionId: isUniv2 ? input.poolAddress : `${nftManagerAddress}-${tokenId}`,
    chainId: input.chainId,
    dexId: input.dexId,
    dexLogo: input.dexLogo || '',
    poolAddress: input.poolAddress,
    poolFee: isFiniteNumber(input.poolFee) ? input.poolFee : 0,
    tokenId: isUniv2 ? '' : tokenId,
    txHash: input.txHash,
    value: input.value,
    createdAt: isFiniteNumber(input.createdAt) ? input.createdAt : cachedAt,
    cachedAt,
    isValueUpdating: input.isValueUpdating,
    token0: toRecordToken(input.token0),
    token1: toRecordToken(input.token1),
  }

  return mutateRecords(owner, records => [...records.filter(existing => existing.key !== key), record])
}

/** Drops the given keys; no-op when none of them is cached. */
export const removeUnfinalizedPositions = (keys: readonly string[], owner?: string): boolean => {
  if (!keys.length) return false
  const removed = new Set(keys)
  return mutateRecords(owner, records => records.filter(record => !removed.has(record.key)))
}

/** Drops expired entries, and the superseded caches that nothing can read any more. */
export const pruneUnfinalizedPositions = (owner?: string): boolean => {
  if (typeof window === 'undefined') return false
  sweepLegacyStorage()
  return mutateRecords(owner, records => [...records])
}

const hasIndexedValueSettled = (indexedValue: number, cachedValue: number) => {
  if (!Number.isFinite(indexedValue) || !Number.isFinite(cachedValue)) return false
  const scale = Math.max(Math.abs(indexedValue), Math.abs(cachedValue))
  // Both sides read zero, so there is nothing left to converge on.
  if (scale === 0) return true
  return Math.abs(indexedValue - cachedValue) / scale <= VALUE_MATCH_TOLERANCE
}

const toPlaceholderPosition = (record: UnfinalizedPositionRecord): ParsedPosition => {
  const networkInfo = NETWORKS_INFO[record.chainId as keyof typeof NETWORKS_INFO]
  const dexInfo = EARN_DEXES[record.dexId]

  return {
    ...DEFAULT_PARSED_POSITION,
    positionId: record.positionId,
    tokenId: record.tokenId,
    chain: {
      id: record.chainId,
      name: networkInfo.name,
      logo: EARN_CHAINS[record.chainId as EarnChain]?.logo || networkInfo.icon,
    },
    dex: {
      id: record.dexId,
      name: dexInfo.name,
      logo: record.dexLogo || dexInfo.logo,
      version: getDexVersion(record.dexId),
    },
    pool: {
      ...DEFAULT_PARSED_POSITION.pool,
      address: record.poolAddress,
      fee: record.poolFee,
      isUniv2: isUniv2Dex(record.dexId),
      nativeToken: networkInfo.nativeToken,
    },
    token0: {
      ...DEFAULT_PARSED_POSITION.token0,
      address: record.token0.address,
      symbol: record.token0.symbol,
      logo: record.token0.logo,
      decimals: record.token0.decimals,
      totalProvide: record.token0.amount,
      currentAmount: record.token0.amount,
    },
    token1: {
      ...DEFAULT_PARSED_POSITION.token1,
      address: record.token1.address,
      symbol: record.token1.symbol,
      logo: record.token1.logo,
      decimals: record.token1.decimals,
      totalProvide: record.token1.amount,
      currentAmount: record.token1.amount,
    },
    totalValueTokens: [
      { address: record.token0.address, symbol: record.token0.symbol, amount: record.token0.amount },
      { address: record.token1.address, symbol: record.token1.symbol, amount: record.token1.amount },
    ],
    totalValue: record.value,
    totalProvidedValue: record.value,
    currentValue: record.value,
    createdTime: record.createdAt,
    txHash: record.txHash,
    isUnfinalized: true,
    isValueUpdating: record.isValueUpdating,
  }
}

/**
 * Pure projection of the cache against the indexed positions: what still needs a placeholder row, what only
 * needs the updating badge on its indexed row, and what has gone stale. Touches no storage.
 */
export const resolveUnfinalizedPositions = ({
  records,
  positions,
  now,
}: {
  records: readonly UnfinalizedPositionRecord[]
  positions: readonly ParsedPosition[]
  now: number
}): ResolvedUnfinalizedPositions => {
  const placeholders: ParsedPosition[] = []
  const placeholderByKey = new Map<string, ParsedPosition>()
  const valueUpdatingKeys = new Set<string>()
  const staleKeys: string[] = []

  const positionByKey = new Map<string, ParsedPosition>()
  positions.forEach(position => {
    const key = getUnfinalizedPositionKeyFromPosition(position)
    if (key) positionByKey.set(key, position)
  })

  records.forEach(record => {
    if (now - record.cachedAt > UNFINALIZED_POSITION_TTL_MS) {
      staleKeys.push(record.key)
      return
    }

    const indexedPosition = positionByKey.get(record.key)
    // A brand-new position is finalized as soon as the indexer returns it at all; an increase only once the
    // indexed value has caught up with the value the zap reported.
    const isFinalized = record.isValueUpdating
      ? !!indexedPosition && hasIndexedValueSettled(indexedPosition.totalProvidedValue, record.value)
      : !!indexedPosition
    if (isFinalized) {
      staleKeys.push(record.key)
      return
    }

    const placeholder = toPlaceholderPosition(record)
    placeholderByKey.set(record.key, placeholder)
    if (record.isValueUpdating) valueUpdatingKeys.add(record.key)
    else placeholders.push(placeholder)
  })

  // Newest zap first.
  placeholders.reverse()

  return { placeholders, placeholderByKey, valueUpdatingKeys, staleKeys }
}
