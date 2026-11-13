import { directRpcFetch, rpcFetch } from '@kyber/rpc-client'
import { ChainId } from '@kyberswap/ks-sdk-core'
// eslint-disable-next-line no-restricted-imports
import { getAccount } from '@wagmi/core'
import blackjackApi from 'services/blackjack'

import { wagmiConfig } from 'components/Web3Provider'
import { NETWORKS_INFO } from 'constants/networks'
import store from 'state'
import {
  ACCESS_LIST_CONFIG,
  AccessListEntry,
  AccessListPolicy,
  fetchAccessList,
  isAccessListRejectionError,
  readRejectingConnectors,
  rememberRejectingConnector,
  resolveAccessListPolicy,
  sanitizeAccessList,
} from 'utils/accessList'
import { calculateGasMarginBigInt } from 'utils/transaction'
import { BlacklistedWalletError, ErrorName, TransactionError } from 'utils/transactionError'
import { Hex } from 'utils/viem'
import { getGatedWalletClient } from 'utils/walletClient'

/**
 * What became of the EIP-2930 access list on a transaction the policy asked one for. `addresses` is 0
 * when the RPC supplied no usable list and the transaction went out plain.
 */
export interface AccessListOutcome {
  addresses: number
  storageKeys: number
  estimatedWithList: boolean
  /** The wallet refused the list before signing and the transaction went out without it. */
  rejectedByWallet: boolean
}

export interface SendEVMTransactionResult {
  hash: string
  accessList?: AccessListOutcome
}

// encoded from bc_r7yhais5
// https://www.base.dev/apps/6985b21e8dcaa0daf5755f6c/settings/builder-code
const BASE_BUILDER_CODE = '62635f72377968616973350b0080218021802180218021802180218021'

// 4-byte selectors whose calldata should NOT carry the Base builder-code
// suffix. Hardware wallets (SafePal in particular) decode these via strict
// ABI and refuse to render the tx when trailing bytes break the expected
// argument length. Builder-code attribution only makes sense for the actual
// swap/router call anyway.
const NO_BUILDER_CODE_SELECTORS = new Set([
  '0x095ea7b3', // ERC20 approve / ERC721 approve
  '0xa22cb465', // setApprovalForAll
])

// Per-request timeout for the pre-signature RPC reads (gas + fee estimation).
// Tighter than the rotating client's 10s default so a slow endpoint fails over
// quickly instead of stalling the "Waiting For Confirmation" step. Only applied
// when the chain's RpcClient is first created (the client is a per-chain singleton).
const PRE_SIGN_RPC_TIMEOUT_MS = 6000
// Time-box the compliance check so a slow Blackjack service can't hold up the
// wallet prompt — consistent with the existing fail-open policy on errors.
const BLACKJACK_TIMEOUT_MS = 2000

// Pre-send security gate invoked by the gated walletClient on every signing method.
// Fails open on network errors so an unreachable Blackjack service doesn't block the
// user's transaction.
export async function ensureNotBlacklisted(account: string) {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const check = store.dispatch(blackjackApi.endpoints.checkBlackjack.initiate(account))
    const res = await Promise.race([
      check,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Blackjack check timed out')), BLACKJACK_TIMEOUT_MS)
      }),
    ])
    if (res?.data?.blacklisted) throw new BlacklistedWalletError()
  } catch (err) {
    if (err instanceof BlacklistedWalletError) throw err
    console.warn('Blackjack check skipped (timeout or network error)', err)
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export async function sendEVMTransaction({
  account,
  contractAddress,
  encodedData,
  value,
  errorInfo,
  isSmartConnector,
  chainId,
  gasLimitMarginBps,
  swap,
  onRequestSignature,
}: {
  account: string
  contractAddress: string
  encodedData: string
  value: bigint
  errorInfo: {
    name: ErrorName
    wallet: string | undefined
  }
  isSmartConnector: boolean
  chainId: ChainId
  gasLimitMarginBps?: number
  /**
   * Present for swaps only. `ACCESS_LIST_CONFIG` governs swaps, so a transaction sent without it
   * (approval, wrap, claim, …) never carries an access list; see `resolveAccessListPolicy`.
   */
  swap?: { isSmartSettlement: boolean }
  // Fired once the tx is fully prepared (gas + fees estimated) and we're about to
  // ask the wallet to sign — lets the UI switch from "preparing" to "awaiting
  // signature" instead of claiming the wallet is open while we're still estimating.
  onRequestSignature?: () => void
}): Promise<SendEVMTransactionResult | undefined> {
  if (!account) throw new Error('Invalid transaction')

  const selector = encodedData.slice(0, 10).toLowerCase()
  const skipBuilderCode = NO_BUILDER_CODE_SELECTORS.has(selector)
  const callData = (
    !isSmartConnector && chainId === ChainId.BASE && !skipBuilderCode
      ? `${encodedData}${BASE_BUILDER_CODE}`
      : encodedData
  ) as Hex

  const txValue = value !== 0n ? value : undefined

  // viem walletClient via wagmi. The wallet client is gated — its `request()` runs
  // `ensureNotBlacklisted` for any signing method, so we don't need a separate inline check here.
  const walletClient = await getGatedWalletClient({ chainId: chainId })
  if (!walletClient) {
    throw new Error('Wallet client unavailable for the requested chain')
  }

  const connectorId = getAccount(wagmiConfig).connector?.id
  const policy: AccessListPolicy = swap
    ? resolveAccessListPolicy({
        config: ACCESS_LIST_CONFIG,
        chainId,
        connectorId,
        isSmartConnector,
        isSmartSettlement: swap.isSmartSettlement,
        chargesGasLimit: Boolean(NETWORKS_INFO[chainId]?.chargesGasLimit),
        rejectingConnectors: readRejectingConnectors(),
      })
    : { attach: false }

  const call = {
    from: account,
    to: contractAddress,
    data: callData,
    ...(txValue !== undefined ? { value: `0x${txValue.toString(16)}` } : {}),
  }
  const endpoints = { from: account, to: contractAddress }

  let accessList: AccessListEntry[] | undefined

  // Route gas estimation through the rotating RPC client (round-robin across
  // healthy public endpoints, per-request timeout, Kyber RPC fallback) so a
  // single slow/overloaded RPC can't stall the flow before the wallet prompt.
  const estimateGas = () =>
    rpcFetch<string>(chainId as number, 'eth_estimateGas', [call], { timeout: PRE_SIGN_RPC_TIMEOUT_MS }).then(BigInt)
  // An estimate that carries the list goes to the default RPC alone: the rotating client reads the
  // -32602 an endpoint gives for the unknown `accessList` field as an endpoint failure and would cool
  // down the whole pool right before the send.
  const estimateGasWithList = (list: AccessListEntry[]) => {
    const rpcUrl = NETWORKS_INFO[chainId]?.defaultRpcUrl
    if (!rpcUrl) throw new Error(`No default RPC for chain ${chainId}`)
    return directRpcFetch<string>(
      rpcUrl,
      'eth_estimateGas',
      [{ ...call, accessList: list }],
      PRE_SIGN_RPC_TIMEOUT_MS,
    ).then(BigInt)
  }
  const estimateError = (error: unknown) =>
    new TransactionError(
      errorInfo.name,
      'estimateGas',
      (error as Error)?.message,
      { from: account, to: contractAddress, data: callData },
      { cause: error },
      errorInfo.wallet,
    )

  // The limit is estimated without the list on purpose: a wallet that drops the list still sends
  // enough gas, and one that keeps it simply uses less. On Arbitrum the list is also L1 calldata
  // charged in gas units, a few thousand for a typical list, which the margin absorbs.
  let listlessGasLimit: bigint
  try {
    listlessGasLimit = calculateGasMarginBigInt(await estimateGas(), chainId, gasLimitMarginBps)
  } catch (error) {
    throw estimateError(error)
  }
  let gasLimit = listlessGasLimit
  let estimatedWithList = false

  if (policy.attach) {
    // The simulation runs at the limit the transaction will carry, so it follows the same path: given
    // less gas, a Smart Settlement swap reverts partway ("Call failed") and yields no list. A node that
    // makes the sender afford the simulated gas (Arbitrum) then asks no more than the transaction costs.
    const rawList = await fetchAccessList(chainId, { ...call, gas: `0x${listlessGasLimit.toString(16)}` })
    accessList = sanitizeAccessList(rawList, endpoints)
    // Only on a chain that charges the limit; see `AccessListPolicy.estimateWithList`.
    if (accessList && policy.estimateWithList) {
      try {
        gasLimit = calculateGasMarginBigInt(await estimateGasWithList(accessList), chainId, gasLimitMarginBps)
        estimatedWithList = true
      } catch {
        // The RPC would not estimate with the list; send plain rather than guess at a limit.
        accessList = undefined
      }
    }
  }

  // Send an explicit `gas` and `chainId` — hardware wallets decode the raw
  // eth_sendTransaction params and fail at the device ("(-104) show tx info
  // failed") on a payload too sparse to render. Fees and `nonce` are left to
  // the wallet: its fee oracle beats anything we can compute a block behind,
  // and letting it pick the nonce avoids racing the device's own counter.
  const txParams: Record<string, unknown> = {
    from: account.toLowerCase(),
    to: contractAddress.toLowerCase(),
    data: callData,
    gas: `0x${gasLimit.toString(16)}`,
    chainId: `0x${(chainId as number).toString(16)}`,
  }
  if (txValue !== undefined) {
    txParams.value = `0x${txValue.toString(16)}`
  }
  if (accessList) {
    txParams.accessList = accessList
    // MetaMask files a list-carrying request as a legacy EIP-2930 transaction unless the type says
    // otherwise, then refuses it on an EIP-1559 chain.
    txParams.type = '0x2'
  }

  // Tx is fully prepared; the wallet prompt opens next. Flip the UI out of the
  // "preparing" state. (The gated walletClient still runs the ≤2s Blackjack check
  // inside `request` before the prompt actually appears.)
  onRequestSignature?.()

  // Reported whenever the policy asked for a list, so a chain whose RPC yields none shows up as such.
  const outcome = (rejectedByWallet: boolean): AccessListOutcome | undefined =>
    policy.attach
      ? {
          addresses: accessList?.length ?? 0,
          storageKeys: accessList?.reduce((count, entry) => count + entry.storageKeys.length, 0) ?? 0,
          estimatedWithList,
          rejectedByWallet,
        }
      : undefined
  const sendError = (error: unknown, accessListAttached: boolean) => {
    const transactionError = new TransactionError(
      errorInfo.name,
      'sendTransaction',
      (error as Error)?.message,
      { from: account, to: contractAddress, data: callData, gasLimit },
      { cause: error },
      errorInfo.wallet,
    )
    transactionError.accessListAttached = accessListAttached
    return transactionError
  }
  const send = async () =>
    (await walletClient.request({
      method: 'eth_sendTransaction',
      params: [txParams] as never,
    })) as `0x${string}`

  try {
    return { hash: await send(), accessList: outcome(false) }
  } catch (error) {
    // Some wallets surface a transaction hash on the error object when the tx
    // was actually broadcasted but the wallet/RPC then reported a failure (e.g.
    // mobile/WC sessions dropping mid-response, providers throwing after the
    // hash already returned). If we have a hash the tx is on-chain — treat as
    // success so the app tracks it instead of letting the user re-submit and
    // pay gas twice. Check the legacy ethers field and the two places viem
    // typically nests it (cause / details).
    const recovered = extractTxHashFromError(error)
    if (recovered) return { hash: recovered, accessList: outcome(false) }
    if (!accessList || !isAccessListRejectionError(error)) throw sendError(error, Boolean(accessList))
  }

  // The wallet refused the list before signing, so this transaction goes out plain, at the list-less
  // limit when the one sent was estimated with the list.
  delete txParams.accessList
  delete txParams.type
  if (estimatedWithList) {
    gasLimit = listlessGasLimit
    txParams.gas = `0x${gasLimit.toString(16)}`
  }
  let plainHash: `0x${string}`
  try {
    plainHash = await send()
  } catch (error) {
    const recovered = extractTxHashFromError(error)
    if (!recovered) throw sendError(error, false)
    plainHash = recovered
  }
  // Remembered only once the plain transaction went through, so a failure that merely looked like a
  // list rejection does not cost the wallet its lists for good.
  if (connectorId) rememberRejectingConnector(connectorId)
  return { hash: plainHash, accessList: outcome(true) }
}

function extractTxHashFromError(error: unknown): `0x${string}` | undefined {
  if (!error || typeof error !== 'object') return undefined
  const e = error as { transactionHash?: unknown; cause?: unknown; data?: unknown; details?: unknown }
  const candidates: unknown[] = [
    e.transactionHash,
    (e.cause as { transactionHash?: unknown })?.transactionHash,
    (e.data as { transactionHash?: unknown })?.transactionHash,
    (e.details as { transactionHash?: unknown })?.transactionHash,
  ]
  for (const c of candidates) {
    if (typeof c === 'string' && /^0x[0-9a-fA-F]{64}$/.test(c)) {
      return c as `0x${string}`
    }
  }
  return undefined
}
