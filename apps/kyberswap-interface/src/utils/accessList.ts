import { directRpcFetch } from '@kyber/rpc-client'
import { ChainId } from '@kyberswap/ks-sdk-core'

import { NETWORKS_INFO } from 'constants/networks'

import { Address, Hex } from './viem'

export type AccessListEntry = { address: Address; storageKeys: Hex[] }

/**
 * Which swaps on a chain carry an EIP-2930 access list. Only swaps are candidates: approvals, wraps,
 * claims and the like reach `sendEVMTransaction` without a swap context and stay list-less.
 * - `ss`: Smart Settlement swaps only. Their executor runs each candidate pool in a reverting
 *   sub-call before executing the winner, and a revert un-warms everything the attempt touched;
 *   a list keeps that state warm for the whole transaction, which is where the gas saving comes from.
 * - `all`: every swap, for a chain whose cold-access prices make a plain swap worth it.
 */
export type AccessListMode = 'off' | 'ss' | 'all'

export type AccessListConfig = {
  /** A chain that is absent is `off`. */
  chains: Partial<Record<ChainId, AccessListMode>>
  /** Connector ids of wallets that refuse a transaction carrying an access list. */
  walletBlocklist: string[]
  /**
   * Connector ids trusted to sign the list exactly as sent. Only these wallets get a gas limit
   * estimated with the list on a chain that charges the limit (see `NetworkInfo.chargesGasLimit`).
   */
  gasLimitWalletAllowlist: string[]
}

export const ACCESS_LIST_CONFIG: AccessListConfig = {
  // Chains whose default RPC answers `eth_createAccessList` and where Smart Settlement routes measured
  // a 5–37% gas saving with a list. Optimism and Unichain also run Smart Settlement, but their public
  // RPCs refuse the method.
  chains: {
    [ChainId.MAINNET]: 'ss',
    [ChainId.BASE]: 'ss',
    [ChainId.BSCMAINNET]: 'ss',
    [ChainId.ARBITRUM]: 'ss',
    [ChainId.MATIC]: 'ss',
  },
  // Connector ids, as `CONNECTION` in components/Web3Provider spells them; literal here so this
  // module stays free of the wallet stack. SafePal's hardware fails to sign a type-2 transaction
  // that carries a list (-104 "show tx info failed"); Phantom rejects the request outright (-32000).
  walletBlocklist: ['io.safepal', 'https://www.safepal.com/download', 'app.phantom'],
  // Empty keeps every chain that charges the gas limit (Monad) list-less until a wallet is confirmed
  // at runtime to sign the list exactly as sent.
  gasLimitWalletAllowlist: [],
}

export type AccessListPolicy =
  | { attach: false }
  | {
      attach: true
      /**
       * Estimate gas with the list in place. Only on a chain that charges the gas limit: there the
       * saving exists only if the limit itself is lower, and that is safe only when the wallet is
       * known to keep the list. Everywhere else the limit comes from a list-less estimate, so a wallet
       * that silently drops the list still has enough gas.
       */
      estimateWithList: boolean
    }

export function resolveAccessListPolicy({
  config,
  chainId,
  connectorId,
  isSmartConnector,
  isSmartSettlement,
  chargesGasLimit,
  rejectingConnectors,
}: {
  config: AccessListConfig
  chainId: ChainId
  connectorId: string | undefined
  isSmartConnector: boolean
  isSmartSettlement: boolean
  chargesGasLimit: boolean
  /** Connectors seen refusing a list on this device; see `rememberRejectingConnector`. */
  rejectingConnectors: ReadonlySet<string>
}): AccessListPolicy {
  const mode = config.chains[chainId] ?? 'off'
  if (mode === 'off' || (mode === 'ss' && !isSmartSettlement)) return { attach: false }
  // A smart account batches the call; the list has no place in that request.
  if (isSmartConnector) return { attach: false }
  if (connectorId && (config.walletBlocklist.includes(connectorId) || rejectingConnectors.has(connectorId))) {
    return { attach: false }
  }
  if (chargesGasLimit) {
    if (!connectorId || !config.gasLimitWalletAllowlist.includes(connectorId)) return { attach: false }
    return { attach: true, estimateWithList: true }
  }
  return { attach: true, estimateWithList: false }
}

const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/
const STORAGE_KEY_PATTERN = /^0x[0-9a-fA-F]{64}$/
// Precompiles live at the lowest addresses (RIP-7212's P256VERIFY at 0x…0100 included) and are warm by definition.
const PRECOMPILE_PATTERN = /^0x0{37}[01][0-9a-f]{2}$/

/**
 * Normalizes a list for the transaction: lowercase, one entry per address, no malformed keys, and
 * none of the entries the protocol already warms for free (sender, callee, precompiles), since each
 * listed address costs 2,400 gas and each key 1,900 whether or not it was needed. `undefined` when
 * nothing useful is left.
 */
export function sanitizeAccessList(
  list: unknown,
  { from, to }: { from: string; to: string },
): AccessListEntry[] | undefined {
  if (!Array.isArray(list)) return undefined
  const skip = new Set([from.toLowerCase(), to.toLowerCase()])
  const byAddress = new Map<string, Set<string>>()

  for (const entry of list) {
    const address = (entry as { address?: unknown })?.address
    if (typeof address !== 'string' || !ADDRESS_PATTERN.test(address)) continue
    const lower = address.toLowerCase()
    if (skip.has(lower) || PRECOMPILE_PATTERN.test(lower)) continue

    const keys = byAddress.get(lower) ?? new Set<string>()
    const storageKeys = (entry as { storageKeys?: unknown }).storageKeys
    if (Array.isArray(storageKeys)) {
      for (const key of storageKeys) {
        if (typeof key === 'string' && STORAGE_KEY_PATTERN.test(key)) keys.add(key.toLowerCase())
      }
    }
    byAddress.set(lower, keys)
  }

  if (byAddress.size === 0) return undefined
  return [...byAddress.entries()].map(([address, keys]) => ({
    address: address as Address,
    storageKeys: [...keys] as Hex[],
  }))
}

// Bounds the wait for the list. The call runs beside the gas estimate, so a slow answer costs the
// user nothing beyond this; a missing answer costs only the saving.
const ACCESS_LIST_RPC_TIMEOUT_MS = 2500

/** Settles with `undefined` once `ms` pass or the promise rejects, whichever comes first. */
const settleWithin = <T>(promise: Promise<T>, ms: number): Promise<T | undefined> =>
  new Promise(resolve => {
    const timer = setTimeout(() => resolve(undefined), ms)
    promise.then(
      value => {
        clearTimeout(timer)
        resolve(value)
      },
      () => {
        clearTimeout(timer)
        resolve(undefined)
      },
    )
  })

/**
 * `eth_createAccessList` for the swap about to be sent, against the chain's default RPC. Requested at
 * send time so only a swap the policy attaches a list to pays for the call, and the list reflects
 * the state the transaction will run on.
 * Deliberately not the rotating client: it puts an endpoint on cooldown for every method when one
 * answers `-32601`, and a chain whose public RPCs lack this method would lose its pool right before
 * the gas estimate. Resolves to `undefined` whenever the RPC cannot or will not answer.
 */
export async function fetchAccessList(
  chainId: ChainId,
  call: { from: string; to: string; data: string; value?: string },
): Promise<unknown> {
  const rpcUrl = NETWORKS_INFO[chainId]?.defaultRpcUrl
  if (!rpcUrl) return undefined
  // `directRpcFetch` stops its own timer once the headers arrive; the deadline here covers the body too.
  const result = await settleWithin(
    directRpcFetch<{ accessList?: unknown; error?: unknown }>(
      rpcUrl,
      'eth_createAccessList',
      [call, 'latest'],
      ACCESS_LIST_RPC_TIMEOUT_MS,
    ),
    ACCESS_LIST_RPC_TIMEOUT_MS,
  )
  // A list built by a simulation that reverted describes a path the real transaction will not take.
  if (!result || result.error) return undefined
  return result.accessList
}

const REJECTING_CONNECTORS_KEY = 'accessListRejectingConnectors'
// A refusal is remembered this long; wallets ship fixes, so the list is tried again afterwards.
const REJECTION_MEMORY_MS = 30 * 24 * 60 * 60 * 1000
// One connector id can stand for many wallets: WalletConnect (and Uniswap's flavour of it) for every
// wallet reached through it, `injected` for any wallet without an EIP-6963 announcement. One wallet's
// refusal says nothing about the next, so a transaction from these is retried plain each time instead.
const SHARED_CONNECTOR_IDS = new Set(['walletConnect', 'uniswapWalletConnect', 'injected'])

/** Connector id → time of its last refusal, without the entries that have aged out. */
function readRejectionTimes(): Record<string, number> {
  if (typeof localStorage === 'undefined') return {}
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(REJECTING_CONNECTORS_KEY) || '{}')
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const now = Date.now()
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, number] => typeof entry[1] === 'number' && now - entry[1] < REJECTION_MEMORY_MS,
      ),
    )
  } catch {
    return {}
  }
}

/** Connectors that refused a list-carrying transaction on this device within `REJECTION_MEMORY_MS`. */
export function readRejectingConnectors(): Set<string> {
  return new Set(Object.keys(readRejectionTimes()))
}

/** The wallet refused a list; later transactions from it go out plain from the start, for a while. */
export function rememberRejectingConnector(connectorId: string): void {
  if (SHARED_CONNECTOR_IDS.has(connectorId) || typeof localStorage === 'undefined') return
  try {
    const known = { ...readRejectionTimes(), [connectorId]: Date.now() }
    localStorage.setItem(REJECTING_CONNECTORS_KEY, JSON.stringify(known))
  } catch {
    // Storage can be full or blocked; the next transaction simply retries the list.
  }
}

const USER_REJECTION_CODE = 4001
// -32602 is "invalid params"; -104 is SafePal's device-side "show tx info failed".
const PARAMS_REJECTION_CODES = new Set([-32602, -104])
const PARAMS_REJECTION_MESSAGE = /invalid param|missing or invalid parameters|access ?list/i
const USER_REJECTION_MESSAGE = /user (rejected|denied|cancel)|rejected by (the )?user|declined/i

/**
 * Whether a wallet turned the request down because of its access list, as opposed to the user
 * closing the prompt or the transaction being unfundable. Phantom answers -32000 "Missing or invalid
 * parameters."; -32000 alone is also geth's generic server error, so that code counts only with a
 * parameters message — the wallet's own. viem wraps every -32000 in an error whose `message` opens
 * with "Missing or invalid parameters." and keeps the wallet's text in `details`, so `details` is
 * what gets read whenever it is present.
 */
export function isAccessListRejectionError(error: unknown): boolean {
  let sawParamsRejection = false
  let current: unknown = error
  for (let depth = 0; depth < 6 && current && typeof current === 'object'; depth++) {
    const { code, message, details, cause } = current as {
      code?: unknown
      message?: unknown
      details?: unknown
      cause?: unknown
    }
    const text = typeof details === 'string' ? details : typeof message === 'string' ? message : ''
    if (code === USER_REJECTION_CODE || USER_REJECTION_MESSAGE.test(text)) return false
    if (
      (typeof code === 'number' && PARAMS_REJECTION_CODES.has(code)) ||
      (code === -32000 && PARAMS_REJECTION_MESSAGE.test(text)) ||
      /access ?list/i.test(text)
    ) {
      sawParamsRejection = true
    }
    current = cause
  }
  return sawParamsRejection
}
