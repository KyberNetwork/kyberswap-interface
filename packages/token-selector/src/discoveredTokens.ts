import { useEffect, useMemo, useSyncExternalStore } from "react";

import { WalletInventoryHolding } from "@kyber/hooks";
import { API_URLS, NATIVE_TOKEN_ADDRESS, Token } from "@kyber/schema";

/**
 * Tokens the wallet holds that are on neither the chain's list nor the user's imports. They are
 * listed from the inventory so a holding never has to be imported by address to be seen, described
 * with the token catalog's name and logo where it knows them, and kept importable — a discovery is by
 * definition off the list this selector works from.
 */

type CatalogToken = {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
};
type CatalogMetadata = ReadonlyMap<string, CatalogToken | null>;

const TOKEN_API = `${API_URLS.KYBERSWAP_SETTING_API}/v1/tokens`;
/** The catalog pages address lookups at this size at most. */
const CATALOG_PAGE_SIZE = 100;
/** A failed lookup is left alone for this long before it may be asked for again. */
const CATALOG_RETRY_MS = 30_000;
const NATIVE_KEY = NATIVE_TOKEN_ADDRESS.toLowerCase();
const NO_TOKENS: Token[] = [];

let metadata: Map<string, CatalogToken | null> = new Map();
const inflight = new Map<string, Promise<void>>();
const retryAt = new Map<string, number>();
const listeners = new Set<() => void>();

const metadataKey = (chainId: number, address: string) =>
  `${chainId}:${address.toLowerCase()}`;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const getMetadata = (): CatalogMetadata => metadata;

const fetchCatalogPage = async (
  chainId: number,
  addresses: string[],
): Promise<CatalogToken[]> => {
  const response = await fetch(
    `${TOKEN_API}?addresses=${addresses.join(",")}&chainIds=${chainId}&page=1&pageSize=${CATALOG_PAGE_SIZE}`,
  );
  if (!response.ok) throw new Error(`token catalog replied ${response.status}`);
  const body = (await response.json()) as {
    data?: { tokens?: CatalogToken[] };
  };
  if (!Array.isArray(body?.data?.tokens))
    throw new Error("token catalog replied without a token list");
  return body.data.tokens;
};

const lookup = async (
  chainId: number,
  batch: Map<string, string>,
): Promise<void> => {
  const keys = Array.from(batch.keys());
  const addresses = Array.from(batch.values());
  let tokens: CatalogToken[];
  try {
    const pages: string[][] = [];
    for (let start = 0; start < addresses.length; start += CATALOG_PAGE_SIZE) {
      pages.push(addresses.slice(start, start + CATALOG_PAGE_SIZE));
    }
    tokens = (
      await Promise.all(pages.map((page) => fetchCatalogPage(chainId, page)))
    ).flat();
  } catch {
    const until = Date.now() + CATALOG_RETRY_MS;
    keys.forEach((key) => retryAt.set(key, until));
    return;
  } finally {
    keys.forEach((key) => inflight.delete(key));
  }

  const byAddress = new Map(
    tokens.map((token) => [token.address.toLowerCase(), token]),
  );
  const next = new Map(metadata);
  let found = 0;
  batch.forEach((address, key) => {
    const token = byAddress.get(address.toLowerCase());
    if (token) found += 1;
    next.set(key, token ?? null);
  });
  metadata = next;
  // Only an answer that carries a token changes any row; negatives are recorded silently.
  if (found) listeners.forEach((listener) => listener());
};

/** Asks the catalog about every address not yet asked about; answered ones cost a lookup. */
const ensureMetadata = async (
  chainId: number,
  addresses: readonly string[],
): Promise<void> => {
  const now = Date.now();
  const waits: Promise<void>[] = [];
  const batch = new Map<string, string>();
  addresses.forEach((address) => {
    const key = metadataKey(chainId, address);
    if (metadata.has(key) || batch.has(key)) return;
    const request = inflight.get(key);
    if (request) {
      waits.push(request);
      return;
    }
    if ((retryAt.get(key) ?? 0) > now) return;
    batch.set(key, address);
  });
  if (batch.size) {
    const request = lookup(chainId, batch);
    batch.forEach((_, key) => inflight.set(key, request));
    waits.push(request);
  }
  await Promise.all(waits);
};

// One instance per (chain, address) while its fields hold, so rows and memos keyed on the token
// treat "same token" as "same object" across inventory polls.
const instances = new Map<string, Token>();

const discoveredToken = (
  chainId: number,
  holding: WalletInventoryHolding,
  known: CatalogToken | undefined,
): Token => {
  const decimals = holding.decimals as number;
  const catalog = known && known.decimals === decimals ? known : undefined;
  const symbol = catalog?.symbol || holding.symbol || "";
  const name = catalog?.name || symbol;
  const logo = catalog?.logoURI;
  const key = metadataKey(chainId, holding.address);
  const cached = instances.get(key);
  if (
    cached &&
    cached.decimals === decimals &&
    cached.symbol === symbol &&
    cached.name === name &&
    cached.logo === logo
  ) {
    return cached;
  }
  const token: Token = {
    address: holding.address,
    symbol,
    name,
    decimals,
    logo,
  };
  instances.set(key, token);
  return token;
};

export const useDiscoveredTokens = ({
  chainId,
  holdings,
  tokens,
  importedTokens,
}: {
  chainId?: number;
  holdings: WalletInventoryHolding[] | null;
  tokens: Token[];
  importedTokens: Token[];
}): Token[] => {
  const catalog = useSyncExternalStore(subscribe, getMetadata, getMetadata);

  const discovered = useMemo(() => {
    if (!chainId || !holdings?.length) return NO_TOKENS;
    const listed = new Set(
      [...tokens, ...importedTokens].map((token) =>
        token.address.toLowerCase(),
      ),
    );
    const result: Token[] = [];
    holdings.forEach((holding) => {
      // Without decimals no amount can be shown truthfully, so the row is not shown at all.
      if (
        holding.address === NATIVE_KEY ||
        holding.decimals === undefined ||
        listed.has(holding.address)
      )
        return;
      result.push(
        discoveredToken(
          chainId,
          holding,
          catalog.get(metadataKey(chainId, holding.address)) ?? undefined,
        ),
      );
    });
    // Alphabetical rather than by amount: airdropped impersonations are minted with enormous supplies.
    result.sort((a, b) => a.symbol.localeCompare(b.symbol));
    return result.length ? result : NO_TOKENS;
  }, [chainId, holdings, tokens, importedTokens, catalog]);

  useEffect(() => {
    if (!chainId || !discovered.length) return;
    void ensureMetadata(
      chainId,
      discovered.map((token) => token.address),
    );
  }, [chainId, discovered]);

  return discovered;
};
