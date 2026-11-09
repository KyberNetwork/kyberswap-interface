import { ChainId } from '@kyber/schema';

/** Chain ids not in `@kyber/schema`, whose enum backs the widget schemas rather than this map. */
const GOERLI = 5;
const UNICHAIN = 130;
const HYPEREVM = 999;
const RONIN = 2020;
const ABSTRACT = 2741;
const RISE = 4153;
const MEGAETH = 4326;
const PLASMA = 9745;
const ETHERLINK = 42793;
const ELYSIUM = 99901;

/** What a chain still needs before the inventory can serve it. */
const NOT_INDEXED = 'needs KyberData to index the chain';
/** KyberData already serves the chain; the inventory waits on the decision to turn it on. */
const NOT_RELEASED = 'needs a release decision';

/**
 * Whether the inventory serves each chain, with what the others still need. A release gate as much
 * as a list: the service may index a chain ahead of time for testing, and nothing here reads it
 * until this map says so. A chain the service reports as unsupported is additionally disabled for
 * the session (see `isWalletInventoryChain`), so the map running ahead of the backend degrades to
 * the caller's own balance source rather than failing. Both the app and the widget packages read
 * this one map, and the app checks that it names every chain the app knows, so a new chain fails
 * type-check there until its decision is recorded here.
 *
 * Plain chain ids, since a chain reaches this map whether or not the widget schema names it.
 */
export const WALLET_INVENTORY_CHAIN_DECISIONS = {
  [ChainId.Ethereum]: true,
  [ChainId.Base]: true,
  [ChainId.Bsc]: true,
  [ChainId.Arbitrum]: true,
  [ChainId.Robinhood]: true,
  [ChainId.Optimism]: true,
  [ChainId.PolygonPos]: true,
  [ChainId.Avalanche]: true,
  [ChainId.Monad]: true,
  [HYPEREVM]: true,
  [ELYSIUM]: true,
  [GOERLI]: 'testnet',
  [ChainId.Fantom]: NOT_INDEXED,
  [ChainId.ZkSync]: NOT_INDEXED,
  [ChainId.Linea]: NOT_INDEXED,
  [ChainId.Scroll]: NOT_INDEXED,
  [ChainId.Blast]: NOT_INDEXED,
  [ChainId.Mantle]: NOT_INDEXED,
  [ChainId.Sonic]: NOT_INDEXED,
  [ChainId.Berachain]: NOT_INDEXED,
  [ChainId.Arc]: NOT_RELEASED,
  [UNICHAIN]: NOT_INDEXED,
  [RONIN]: NOT_INDEXED,
  [ABSTRACT]: NOT_INDEXED,
  [RISE]: NOT_INDEXED,
  [MEGAETH]: NOT_INDEXED,
  [PLASMA]: NOT_INDEXED,
  [ETHERLINK]: NOT_INDEXED,
} as const;

/** The chains the inventory serves. */
export const WALLET_INVENTORY_CHAINS: number[] = Object.entries(WALLET_INVENTORY_CHAIN_DECISIONS).flatMap(
  ([chainId, decision]) => (decision === true ? [Number(chainId)] : []),
);

/** The service answered that it does not index this chain. */
export class UnsupportedChainError extends Error {
  constructor(chainId: number) {
    super(`wallet inventory does not index chain ${chainId}`);
    this.name = 'UnsupportedChainError';
  }
}

/** One row of the service's response, untouched apart from de-duplication. */
export type InventoryRawRow = {
  tokenAddress: string;
  rawAmount: string;
  blockNumber: number;
  decimals?: number;
  symbol?: string;
};

const MAX_UINT256 = (1n << 256n) - 1n;

/**
 * Zero balances arrive as the literal "0x", which `BigInt` rejects.
 *
 * A value past `uint256` is not a balance either: the service has hex-encoded more than the 32-byte
 * word `balanceOf` answers with (some proxied tokens return extra words, and the raw buffer arrives
 * whole). It reads as zero like any other malformed row, since the SDK refuses to build an amount
 * from it and one such row must not take a screen down with it.
 */
export const parseRawAmount = (value: string): bigint => {
  if (!value || value === '0x' || value === '0X') return 0n;
  try {
    const amount = BigInt(value);
    return amount > MAX_UINT256 ? 0n : amount;
  } catch {
    return 0n;
  }
};

/** Chains the service has answered "unsupported chain" for this session, shared by every consumer. */
const unsupportedChains = new Set<number>();

export const markChainUnsupported = (chainId: number) => {
  unsupportedChains.add(chainId);
};

export const isChainUnsupported = (chainId: number): boolean => unsupportedChains.has(chainId);

/** Whether the inventory may be asked about a chain: on the list, and not disabled for the session. */
export const isWalletInventoryChain = (chainId: number): boolean =>
  WALLET_INVENTORY_CHAINS.some(chain => chain === chainId) && !unsupportedChains.has(chainId);

const PAGE_SIZE = 1000;
/** Safety stop for the cursor walk; a wallet past this is left to the caller's own balance source. */
const MAX_PAGES = 10;
/** Per request, so a wallet that needs several pages is not aborted for the sum of them. */
const REQUEST_TIMEOUT_MS = 8_000;

/**
 * How long after a transaction the service is still behind it, generously covered (observed lag is
 * 15–70s). Callers keep asking for live reads of the transaction's tokens until the index has caught
 * up or this much time has passed. One number shared by the app and the widget stores.
 */
export const INDEXER_CATCHUP_WINDOW_MS = 150_000;

type PageResponse = {
  code?: number;
  message?: string;
  data?: { balances?: InventoryRawRow[] | null; liveBalances?: InventoryRawRow[] | null } | null;
};

const fetchPage = async (
  url: string,
  chainId: number,
  lifetime?: AbortSignal,
): Promise<{ balances: InventoryRawRow[]; live: InventoryRawRow[] }> => {
  const controller = new AbortController();
  // The abort is the polite cancel; the rejection is the guarantee. A mobile in-app browser or a tab
  // the system froze can leave an aborted fetch pending for good, and a caller that never hears back
  // would hold its in-flight state — and every wallet behind it — forever.
  let expire: (() => void) | undefined;
  const deadline = new Promise<never>((_, reject) => {
    expire = () => {
      controller.abort();
      reject(new Error('wallet inventory request timed out'));
    };
  });
  const timer = setTimeout(() => expire?.(), REQUEST_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  lifetime?.addEventListener('abort', onAbort);
  try {
    const response = await Promise.race([fetch(url, { signal: controller.signal }), deadline]);
    if (response.status === 400) {
      // Only the service's own "unsupported chain" answer disables the chain; any other 400 (a
      // rejected cursor, an edge rule) is a transient failure for this request alone.
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      if (/unsupported chain/i.test(body?.message ?? '')) {
        unsupportedChains.add(chainId);
        throw new UnsupportedChainError(chainId);
      }
      throw new Error(`wallet inventory rejected the request: ${body?.message ?? response.status}`);
    }
    if (!response.ok) throw new Error(`wallet inventory responded ${response.status}`);
    const json = (await Promise.race([response.json(), deadline])) as PageResponse;
    if (json.code !== 0) throw new Error(json.message || 'wallet inventory returned an error code');
    return { balances: json.data?.balances ?? [], live: json.data?.liveBalances ?? [] };
  } finally {
    clearTimeout(timer);
    lifetime?.removeEventListener('abort', onAbort);
  }
};

/**
 * Every row the service holds for one wallet on one chain, walked to completion.
 *
 * Pagination is a keyset cursor over `(blockNumber, tokenAddress)` ascending. A row's block only ever
 * moves forward, so anything that changes mid-walk is re-stamped into the range ahead of the cursor:
 * a token that arrives during the walk is still picked up, and a token already collected that changes
 * again reappears with a fresher value. Rows are de-duplicated by address keeping the highest block.
 * Zero rows (tombstones) are kept; callers decide what a zero means to them.
 *
 * `liveAddrs` names tokens the service reads from the node as it answers, rather than from its
 * index. Their rows come back stamped at the head block, so they outrank the indexed rows for the
 * same tokens — which is how a balance that just changed is right on screen before the indexer has
 * caught up. They are asked for once per walk: the reads are a point in time, not per page.
 *
 * `indexedBlock` in the result is how far the *index* has come, live reads excluded — a caller
 * waiting for the indexer to catch up with a transaction must not be fooled by a live row stamped
 * at the head.
 */
export const walkWalletInventory = async ({
  baseUrl,
  chainId,
  account,
  signal,
  liveAddrs,
}: {
  baseUrl: string;
  chainId: number;
  account: string;
  signal?: AbortSignal;
  liveAddrs?: readonly string[];
}): Promise<{ rows: InventoryRawRow[]; complete: boolean; indexedBlock: number }> => {
  const byAddress = new Map<string, InventoryRawRow>();
  const merge = (row: InventoryRawRow) => {
    const key = row.tokenAddress.toLowerCase();
    const existing = byAddress.get(key);
    if (!existing || row.blockNumber >= existing.blockNumber) byAddress.set(key, row);
  };
  let cursor: { block: number; address: string } | undefined;
  let complete = false;
  let indexedBlock = 0;

  for (let page = 0; page < MAX_PAGES; page++) {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
    if (cursor) {
      params.set('sinceBlockNumber', String(cursor.block));
      // Echoed exactly as received: the server compares this cursor as a string.
      params.set('lastTokenAddr', cursor.address);
    } else {
      // The service reads one node value per address given, so only the first page asks. Repeated
      // params: the service ignores a comma-separated list.
      new Set(liveAddrs?.map(a => a.toLowerCase())).forEach(a => params.append('liveAddrs', a));
    }
    const batch = await fetchPage(
      `${baseUrl}/v1/wallets/${chainId}/${account}/balances?${params.toString()}`,
      chainId,
      signal,
    );

    batch.balances.forEach(row => {
      indexedBlock = Math.max(indexedBlock, row.blockNumber);
      merge(row);
    });
    // Live reads share the block-monotonic merge: stamped at the head, they win over the indexed row
    // for the same token, including when they report it emptied.
    batch.live.forEach(merge);

    // A short page is the only end-of-data signal the service gives; live rows are extra to it.
    if (batch.balances.length < PAGE_SIZE) {
      complete = true;
      break;
    }
    const last = batch.balances[batch.balances.length - 1];
    cursor = { block: last.blockNumber, address: last.tokenAddress };
  }

  return { rows: Array.from(byAddress.values()), complete, indexedBlock };
};
