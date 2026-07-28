import { getGasPrice, rpcFetch } from '@kyber/rpc-client'
import { ChainId } from '@kyberswap/ks-sdk-core'
// eslint-disable-next-line no-restricted-imports
import { getAccount, getPublicClient } from '@wagmi/core'
import blackjackApi from 'services/blackjack'

import { CONNECTION, wagmiConfig } from 'components/Web3Provider'
import store from 'state'
import { createAccessListIfEnabled } from 'utils/accessList'
import { calculateGasMarginBigInt } from 'utils/transaction'
import { BlacklistedWalletError, ErrorName, TransactionError } from 'utils/transactionError'
import { Hex } from 'utils/viem'
import { getGatedWalletClient } from 'utils/walletClient'

// Wallets known to mishandle EIP-1559 transactions that carry an `accessList`.
// SafePal's hardware can't sign the type-2 + accessList combo cleanly (-104
// "show tx info failed", or the signature ends up not matching the
// broadcasted tx data and the chain rejects it). Drop accessList for these
// wallets — they lose the gas refund but the tx becomes signable.
const ACCESS_LIST_INCOMPATIBLE_CONNECTORS = new Set<string>([CONNECTION.SAFEPAL])

export interface SendEVMTransactionResult {
  hash: string
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
// Priority fee used when a provider can't supply one (1.5 gwei).
const DEFAULT_PRIORITY_FEE_WEI = 1_500_000_000n
// Time-box the compliance check so a slow Blackjack service can't hold up the
// wallet prompt — consistent with the existing fail-open policy on errors.
const BLACKJACK_TIMEOUT_MS = 2000

// EIP-1559 fee estimation routed through the rotating RPC client so a single
// slow endpoint can't stall the flow before the wallet prompt. Mirrors viem's
// default formula (maxFeePerGas = baseFee * 1.2 + tip). Returns undefined on
// legacy chains or when the RPC is unreachable — the caller then leaves fees to
// the wallet.
async function estimateEip1559Fees(
  chainId: number,
): Promise<{ maxFeePerGas: bigint; maxPriorityFeePerGas: bigint } | undefined> {
  let baseFeePerGas: bigint
  try {
    const block = await rpcFetch<{ baseFeePerGas?: string } | null>(
      chainId,
      'eth_getBlockByNumber',
      ['latest', false],
      { timeout: PRE_SIGN_RPC_TIMEOUT_MS },
    )
    if (!block?.baseFeePerGas) return undefined // legacy / non-EIP-1559 chain
    baseFeePerGas = BigInt(block.baseFeePerGas)
  } catch {
    return undefined
  }

  let maxPriorityFeePerGas: bigint
  try {
    const tip = await rpcFetch<string>(chainId, 'eth_maxPriorityFeePerGas', [], {
      timeout: PRE_SIGN_RPC_TIMEOUT_MS,
    })
    maxPriorityFeePerGas = BigInt(tip)
  } catch {
    // Not all providers expose eth_maxPriorityFeePerGas — derive the tip from
    // gasPrice - baseFee, falling back to a sane default.
    try {
      const gasPrice = await getGasPrice(chainId, { timeout: PRE_SIGN_RPC_TIMEOUT_MS })
      maxPriorityFeePerGas = gasPrice > baseFeePerGas ? gasPrice - baseFeePerGas : DEFAULT_PRIORITY_FEE_WEI
    } catch {
      maxPriorityFeePerGas = DEFAULT_PRIORITY_FEE_WEI
    }
  }

  return {
    maxFeePerGas: (baseFeePerGas * 12n) / 10n + maxPriorityFeePerGas,
    maxPriorityFeePerGas,
  }
}

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

  // viem walletClient + publicClient via wagmi. The wallet client is gated — its
  // `request()` runs `ensureNotBlacklisted` for any signing method, so we don't need a
  // separate inline check here.
  const publicClient = getPublicClient(wagmiConfig, { chainId: chainId as number })
  const walletClient = await getGatedWalletClient({ chainId: chainId })
  if (!publicClient || !walletClient) {
    throw new Error('Wallet client unavailable for the requested chain')
  }

  const connectorId = getAccount(wagmiConfig).connector?.id
  const accessList = ACCESS_LIST_INCOMPATIBLE_CONNECTORS.has(connectorId ?? '')
    ? undefined
    : await createAccessListIfEnabled(publicClient, chainId, {
        from: account,
        to: contractAddress,
        data: callData,
        value: txValue,
      })

  let gasEstimate: bigint
  try {
    // Route gas estimation through the rotating RPC client (round-robin across
    // healthy public endpoints, per-request timeout, Kyber RPC fallback) so a
    // single slow/overloaded RPC can't stall the flow before the wallet prompt.
    const gasHex = await rpcFetch<string>(
      chainId as number,
      'eth_estimateGas',
      [
        {
          from: account,
          to: contractAddress,
          data: callData,
          ...(txValue !== undefined ? { value: `0x${txValue.toString(16)}` } : {}),
          ...(accessList ? { accessList } : {}),
        },
      ],
      { timeout: PRE_SIGN_RPC_TIMEOUT_MS },
    )
    gasEstimate = BigInt(gasHex)
  } catch (error) {
    throw new TransactionError(
      errorInfo.name,
      'estimateGas',
      (error as Error)?.message,
      { from: account, to: contractAddress, data: callData },
      { cause: error },
      errorInfo.wallet,
    )
  }

  const gasLimit = calculateGasMarginBigInt(gasEstimate, chainId, gasLimitMarginBps)

  // Build the full eth_sendTransaction payload ethers v5 used to populate
  // (type, chainId, fees, gas). Hardware wallets like SafePal can't decode a
  // minimal viem-style payload missing these fields and fail at the device
  // with "(-104) show tx info failed". Software wallets auto-fill the gaps,
  // so the regression only surfaces on hardware. We let the wallet pick
  // `nonce` to avoid racing the device's own counter.
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
  }
  const fees = await estimateEip1559Fees(chainId as number)
  if (fees) {
    txParams.type = '0x2'
    txParams.maxFeePerGas = `0x${fees.maxFeePerGas.toString(16)}`
    txParams.maxPriorityFeePerGas = `0x${fees.maxPriorityFeePerGas.toString(16)}`
  }

  // Tx is fully prepared; the wallet prompt opens next. Flip the UI out of the
  // "preparing" state. (The gated walletClient still runs the ≤2s Blackjack check
  // inside `request` before the prompt actually appears.)
  onRequestSignature?.()

  try {
    const hash = (await walletClient.request({
      method: 'eth_sendTransaction',
      params: [txParams] as never,
    })) as `0x${string}`
    return { hash }
  } catch (error) {
    // Some wallets surface a transaction hash on the error object when the tx
    // was actually broadcasted but the wallet/RPC then reported a failure (e.g.
    // mobile/WC sessions dropping mid-response, providers throwing after the
    // hash already returned). If we have a hash the tx is on-chain — treat as
    // success so the app tracks it instead of letting the user re-submit and
    // pay gas twice. Check the legacy ethers field and the two places viem
    // typically nests it (cause / details).
    const recovered = extractTxHashFromError(error)
    if (recovered) return { hash: recovered }
    throw new TransactionError(
      errorInfo.name,
      'sendTransaction',
      (error as Error)?.message,
      { from: account, to: contractAddress, data: callData, gasLimit },
      { cause: error },
      errorInfo.wallet,
    )
  }
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
