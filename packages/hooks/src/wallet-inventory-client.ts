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

/** Zero balances arrive as the literal "0x", which `BigInt` rejects. */
export const parseRawAmount = (value: string): bigint => {
  if (!value || value === '0x' || value === '0X') return 0n;
  try {
    return BigInt(value);
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

/**
 * Whether the inventory may be asked about a chain. The service itself is the authority on which
 * chains it indexes: every chain is tried once, and one it answers "unsupported chain" for is left
 * to the caller's own balance source for the rest of the session. Nothing is listed ahead of time,
 * so a chain the service starts indexing lights up without a release.
 */
export const isWalletInventoryChain = (chainId: number): boolean => !unsupportedChains.has(chainId);

const PAGE_SIZE = 1000;
/** Safety stop for the cursor walk; a wallet past this is left to the caller's own balance source. */
const MAX_PAGES = 10;
/** Per request, so a wallet that needs several pages is not aborted for the sum of them. */
const REQUEST_TIMEOUT_MS = 8_000;

type PageResponse = { code?: number; message?: string; data?: { balances?: InventoryRawRow[] | null } | null };

const fetchPage = async (url: string, chainId: number, lifetime?: AbortSignal): Promise<InventoryRawRow[]> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  lifetime?.addEventListener('abort', onAbort);
  try {
    const response = await fetch(url, { signal: controller.signal });
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
    const json = (await response.json()) as PageResponse;
    if (json.code !== 0) throw new Error(json.message || 'wallet inventory returned an error code');
    return json.data?.balances ?? [];
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
 */
export const walkWalletInventory = async ({
  baseUrl,
  chainId,
  account,
  signal,
}: {
  baseUrl: string;
  chainId: number;
  account: string;
  signal?: AbortSignal;
}): Promise<{ rows: InventoryRawRow[]; complete: boolean }> => {
  const byAddress = new Map<string, InventoryRawRow>();
  let cursor: { block: number; address: string } | undefined;
  let complete = false;

  for (let page = 0; page < MAX_PAGES; page++) {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
    if (cursor) {
      params.set('sinceBlockNumber', String(cursor.block));
      // Echoed exactly as received: the server compares this cursor as a string.
      params.set('lastTokenAddr', cursor.address);
    }
    const batch = await fetchPage(
      `${baseUrl}/v1/wallets/${chainId}/${account}/balances?${params.toString()}`,
      chainId,
      signal,
    );

    batch.forEach(row => {
      const key = row.tokenAddress.toLowerCase();
      const existing = byAddress.get(key);
      if (!existing || row.blockNumber >= existing.blockNumber) byAddress.set(key, row);
    });

    // A short page is the only end-of-data signal the service gives.
    if (batch.length < PAGE_SIZE) {
      complete = true;
      break;
    }
    const last = batch[batch.length - 1];
    cursor = { block: last.blockNumber, address: last.tokenAddress };
  }

  return { rows: Array.from(byAddress.values()), complete };
};
