import { useEffect, useState } from 'react';

import { getBalance } from '@kyber/rpc-client';
import { API_URLS, NATIVE_TOKEN_ADDRESS } from '@kyber/schema';

import {
  UnsupportedChainError,
  isChainUnsupported,
  isWalletInventoryChain,
  parseRawAmount,
  walkWalletInventory,
} from './wallet-inventory-client';

export {
  UnsupportedChainError,
  isChainUnsupported,
  isWalletInventoryChain,
  markChainUnsupported,
  parseRawAmount,
  walkWalletInventory,
} from './wallet-inventory-client';
export type { InventoryRawRow } from './wallet-inventory-client';

/** Balances by lowercased token address; the native currency sits under the lowercased sentinel. */
export type WalletInventoryBalances = { [address: string]: bigint };

/** One token the wallet holds, with the metadata the indexer carries for it (absent for unknown tokens). */
export type WalletInventoryHolding = {
  /** Lowercased; the native currency uses the lowercased sentinel. */
  address: string;
  rawBalance: bigint;
  decimals?: number;
  symbol?: string;
};

export type WalletInventoryStatus =
  /** Not enabled, chain unsupported, or no account: the caller's own balance source applies. */
  | 'idle'
  /** First fetch in flight — hold the fallback rather than start work that will be discarded. */
  | 'loading'
  /** `balances` is a complete picture of the wallet; a token absent from it is held at zero. */
  | 'ready'
  /** The service cannot answer for this wallet right now; the caller's own source applies. */
  | 'unavailable';

export type WalletInventory = {
  balances: WalletInventoryBalances | null;
  /** Every non-zero holding, sorted by address; null whenever `balances` is. */
  holdings: WalletInventoryHolding[] | null;
  status: WalletInventoryStatus;
};

/** Matches the cadence of the multicall balance hook it stands in for. */
const POLL_INTERVAL_MS = 15_000;
/**
 * Retry delays after consecutive failures; the last entry is the ceiling. Without backoff a flapping
 * service would flip a selector between the inventory and a full multicall sweep every poll. Jittered
 * so every open tab does not retry on the same tick after an outage.
 */
const RETRY_BACKOFF_MS = [POLL_INTERVAL_MS, 30_000, 60_000, 120_000];
const RETRY_JITTER = 0.4;
/** Data older than this is dropped once a refresh fails, so an outage cannot freeze a screen for good. */
const STALE_MAX_MS = 120_000;
/** Inventories kept for wallets no one is looking at, so a reopened selector paints at once. */
const KEEP_IDLE_ENTRIES = 8;
const NATIVE_KEY = NATIVE_TOKEN_ADDRESS.toLowerCase();

const IDLE: WalletInventory = { balances: null, holdings: null, status: 'idle' };
const LOADING: WalletInventory = { balances: null, holdings: null, status: 'loading' };

type Entry = {
  key: string;
  chainId: number;
  account: string;
  balances: WalletInventoryBalances | null;
  holdings: WalletInventoryHolding[] | null;
  status: WalletInventoryStatus;
  /** What subscribers read; replaced only when the data or `status` change, so identity is stable. */
  view: WalletInventory;
  fetchedAt: number;
  failures: number;
  /** A walk past the page cap is a property of the wallet, so it is never walked again. */
  terminal: boolean;
  /** An expiry arrived while a walk was in flight; the next walk follows at once, not after the poll. */
  dirty: boolean;
  listeners: Set<() => void>;
  timer?: ReturnType<typeof setTimeout>;
  controller?: AbortController;
};

/**
 * One poller per (chain, account), whatever number of selectors are open for it: every hook instance
 * subscribes to the same entry, so N modals cost one walk and one timer.
 */
const entries = new Map<string, Entry>();

const keyOf = (chainId: number, account: string) => `${chainId}:${account.toLowerCase()}`;

/** Same holdings, same amounts — the steady-state poll almost always. */
const balancesEqual = (a: WalletInventoryBalances, b: WalletInventoryBalances): boolean => {
  const aKeys = Object.keys(a);
  if (aKeys.length !== Object.keys(b).length) return false;
  return aKeys.every(key => b[key] === a[key]);
};

const holdingsEqual = (a: WalletInventoryHolding[], b: WalletInventoryHolding[]): boolean =>
  a.length === b.length &&
  a.every((holding, index) => {
    const other = b[index];
    return (
      holding.address === other.address &&
      holding.rawBalance === other.rawBalance &&
      holding.decimals === other.decimals &&
      holding.symbol === other.symbol
    );
  });

type Snapshot = { balances: WalletInventoryBalances; holdings: WalletInventoryHolding[] };

const commit = (entry: Entry, snapshot: Snapshot | null, status: WalletInventoryStatus) => {
  // Keep the previous objects when nothing changed: fresh ones would re-map and re-sort the whole
  // token list on every poll for a screen that has not moved.
  const unchanged =
    !!snapshot &&
    !!entry.balances &&
    !!entry.holdings &&
    balancesEqual(entry.balances, snapshot.balances) &&
    holdingsEqual(entry.holdings, snapshot.holdings);
  const balances = unchanged ? entry.balances : (snapshot?.balances ?? null);
  const holdings = unchanged ? entry.holdings : (snapshot?.holdings ?? null);
  if (balances === entry.balances && holdings === entry.holdings && status === entry.status) return;
  entry.balances = balances;
  entry.holdings = holdings;
  entry.status = status;
  entry.view = { balances, holdings, status };
  entry.listeners.forEach(listener => listener());
};

/** The entry's own data as a snapshot, for a commit that keeps what is on screen. */
const current = (entry: Entry): Snapshot | null =>
  entry.balances && entry.holdings ? { balances: entry.balances, holdings: entry.holdings } : null;

const clearTimer = (entry: Entry) => {
  if (entry.timer) clearTimeout(entry.timer);
  entry.timer = undefined;
};

const schedule = (entry: Entry, delay: number) => {
  clearTimer(entry);
  entry.timer = setTimeout(() => void run(entry), delay);
};

const nextDelay = (entry: Entry) =>
  entry.failures
    ? RETRY_BACKOFF_MS[Math.min(entry.failures - 1, RETRY_BACKOFF_MS.length - 1)] * (1 + Math.random() * RETRY_JITTER)
    : POLL_INTERVAL_MS;

const isHidden = () => typeof document !== 'undefined' && document.hidden;

const run = async (entry: Entry) => {
  // Whatever poll was pending is superseded by this run — cancelled, not merely forgotten, so no
  // second walk fires later from a timer nothing references any more.
  clearTimer(entry);
  if (!entry.listeners.size || entry.terminal || isChainUnsupported(entry.chainId) || entry.controller) return;
  entry.dirty = false;
  // A hidden tab keeps what it has; the visibility listener resumes the poll when it is looked at.
  if (isHidden() && entry.balances) return;

  const controller = new AbortController();
  entry.controller = controller;
  try {
    const { rows, complete } = await walkWalletInventory({
      baseUrl: API_URLS.KD_API,
      chainId: entry.chainId,
      account: entry.account,
      signal: controller.signal,
    });
    if (controller.signal.aborted) return;
    if (!complete) {
      entry.terminal = true;
      commit(entry, null, 'unavailable');
      return;
    }

    const balances: WalletInventoryBalances = {};
    const holdings: WalletInventoryHolding[] = [];
    rows.forEach(row => {
      const amount = parseRawAmount(row.rawAmount);
      if (amount <= 0n) return;
      const address = row.tokenAddress.toLowerCase();
      balances[address] = amount;
      holdings.push({ address, rawBalance: amount, decimals: row.decimals, symbol: row.symbol || undefined });
    });
    // Sorted so two walks over an unchanged wallet compare equal whatever order the service listed them in.
    holdings.sort((a, b) => (a.address < b.address ? -1 : a.address > b.address ? 1 : 0));

    // The service returns no rows both for an empty wallet and for one it has never indexed. A wallet
    // that holds native currency but has no native row is the latter, and its "zeros" are not to be
    // believed; it is retried on the backoff schedule in case the indexer catches up.
    if (!balances[NATIVE_KEY]) {
      const native = await getBalance(entry.chainId, entry.account).catch(() => 0n);
      if (controller.signal.aborted) return;
      if (native > 0n) {
        entry.failures += 1;
        commit(entry, null, 'unavailable');
        return;
      }
    }

    entry.failures = 0;
    entry.fetchedAt = Date.now();
    commit(entry, { balances, holdings }, 'ready');
  } catch (error) {
    if (controller.signal.aborted) return;
    if (error instanceof UnsupportedChainError) {
      commit(entry, null, 'unavailable');
      return;
    }
    entry.failures += 1;
    // Stale-while-revalidate, bounded: data already on screen stays through a hiccup, but not
    // through an outage — past the limit the caller's own source takes over.
    const stale = Date.now() - entry.fetchedAt > STALE_MAX_MS;
    commit(entry, stale ? null : current(entry), entry.balances && !stale ? 'ready' : 'unavailable');
  } finally {
    entry.controller = undefined;
    if (!controller.signal.aborted && entry.listeners.size && !entry.terminal && !isChainUnsupported(entry.chainId)) {
      schedule(entry, entry.dirty ? 0 : nextDelay(entry));
    }
  }
};

/** Resume every watched inventory that fell due while the tab was hidden. */
const onVisible = () => {
  if (isHidden()) return;
  entries.forEach(entry => {
    if (!entry.listeners.size || entry.timer || entry.controller || entry.terminal) return;
    const age = Date.now() - entry.fetchedAt;
    if (age >= POLL_INTERVAL_MS) void run(entry);
    else schedule(entry, POLL_INTERVAL_MS - age);
  });
};
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisible);

/** Drop the oldest unwatched inventories past the cap. */
const prune = () => {
  const idle = Array.from(entries.values())
    .filter(entry => !entry.listeners.size && !entry.controller)
    .sort((a, b) => a.fetchedAt - b.fetchedAt);
  while (idle.length > KEEP_IDLE_ENTRIES) {
    const oldest = idle.shift();
    if (oldest) entries.delete(oldest.key);
  }
};

const subscribe = (chainId: number, account: string, listener: () => void) => {
  const key = keyOf(chainId, account);
  const existing = entries.get(key);
  const entry: Entry = existing ?? {
    key,
    chainId,
    account,
    balances: null,
    holdings: null,
    status: 'loading',
    view: LOADING,
    fetchedAt: 0,
    failures: 0,
    terminal: false,
    dirty: false,
    listeners: new Set(),
  };
  // Registered before pruning: an entry with a listener is never an eviction candidate, and a brand
  // new one (fetchedAt 0) would otherwise sort as the oldest idle entry and evict itself.
  entry.listeners.add(listener);
  if (!existing) {
    entries.set(key, entry);
    prune();
  }

  if (!entry.timer && !entry.controller && !entry.terminal) {
    // A fresh enough inventory is served as is and refreshed on its own schedule, so a reopened modal
    // neither flashes a skeleton nor repeats the request it just made.
    const age = Date.now() - entry.fetchedAt;
    if (entry.balances && age < POLL_INTERVAL_MS) schedule(entry, POLL_INTERVAL_MS - age);
    else void run(entry);
  }

  return () => {
    entry.listeners.delete(listener);
    // A fetch already in flight is left to finish — its result is what makes the next open instant.
    if (!entry.listeners.size) clearTimer(entry);
  };
};

/**
 * Marks a wallet's inventory stale, e.g. after a transaction of its own confirms: a watched inventory
 * refetches at once, an unwatched one on its next subscriber. Stale data stays on screen meanwhile.
 */
export const expireWalletInventory = (chainId: number, account: string) => {
  const entry = entries.get(keyOf(chainId, account));
  if (!entry || entry.terminal) return;
  entry.fetchedAt = 0;
  entry.failures = 0;
  // A walk already in flight started before the transaction confirmed and cannot see its effect;
  // flag it so its completion is followed by another walk immediately rather than after the poll.
  entry.dirty = true;
  if (entry.listeners.size && !entry.controller) void run(entry);
};

/**
 * Wallet balances from the kd-api inventory: one request for every token the wallet holds, in place
 * of a `balanceOf` multicall over an entire token list. Off by default and self-gating — callers only
 * ever read from it while `status` is 'loading' or 'ready', and keep their own source otherwise.
 * Every instance for the same (chain, account) shares one poller.
 */
export const useWalletInventory = (
  chainId: number | undefined,
  account: string | undefined,
  enabled: boolean,
): WalletInventory => {
  const supported = enabled && !!chainId && !!account && isWalletInventoryChain(chainId);
  const key = supported && chainId && account ? keyOf(chainId, account) : '';
  const [, rerender] = useState(0);

  useEffect(() => {
    if (!key || !chainId || !account) return;
    return subscribe(chainId, account, () => rerender(n => n + 1));
  }, [key, chainId, account]);

  if (!supported) return IDLE;
  // Read straight off the registry by key, so a switch to another wallet or chain can never surface
  // the previous one's rows, and the first render of a key already reads as loading (holding the
  // caller's fallback) before its subscription has even been created.
  return entries.get(key)?.view ?? LOADING;
};
