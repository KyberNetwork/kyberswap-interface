import { Token } from '@kyber/schema'
import { ChainId, WETH } from '@kyberswap/ks-sdk-core'
import { getPublicClient, waitForTransactionReceipt } from '@wagmi/core'

import { wagmiConfig } from 'components/Web3Provider'
import { EARN_CHAINS, EARN_DEXES, EarnChain, Exchange } from 'pages/Earns/constants'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'
import { sendEVMTransaction } from 'utils/sendTransaction'
import { BlacklistedWalletError, ErrorName } from 'utils/transactionError'
import { Hash, Log, keccak256, toBytes } from 'utils/viem'

type LegacyTransactionRequest = {
  from?: string
  to?: string
  data?: string
  value?: string | number | bigint | { toString: () => string }
  gasLimit?: string | number | bigint
}

// A zap resolves its minted id from two places at once — the placeholder cache write and the "View
// position" navigation — so the in-flight lookup is shared: one round trip, and both read the same id.
// Failed lookups are evicted so a later attempt can retry, and the map is capped because a long-lived tab
// would otherwise retain every receipt's logs.
const receiptLogsByTx = new Map<string, Promise<readonly Log[] | undefined>>()
const RECEIPT_CACHE_LIMIT = 32

// Waiting is only worth it for a zap that was just mined, where a fallback RPC may not have caught up with
// the block yet. Callers describing an arbitrary past transaction ask for a single lookup instead, so a
// pending or foreign-chain hash resolves to nothing immediately rather than holding a poll open.
const RECEIPT_TIMEOUT_MS = 20_000
const RECEIPT_POLLING_INTERVAL_MS = 2_000
const RECEIPT_RETRY_COUNT = 3

const readReceiptLogs = async (chainId: number, txHash: string, waitForMined: boolean) => {
  const client = getPublicClient(wagmiConfig, { chainId })
  if (!waitForMined) {
    if (!client) return undefined
    const receipt = await client.getTransactionReceipt({ hash: txHash as Hash })
    return receipt.logs as readonly Log[]
  }

  const receipt = await waitForTransactionReceipt(wagmiConfig, {
    chainId: chainId as (typeof wagmiConfig)['chains'][number]['id'],
    hash: txHash as Hash,
    pollingInterval: RECEIPT_POLLING_INTERVAL_MS,
    retryCount: RECEIPT_RETRY_COUNT,
    timeout: RECEIPT_TIMEOUT_MS,
  })
  return receipt.logs as readonly Log[]
}

const getReceiptLogs = (
  chainId: number,
  txHash: string,
  waitForMined: boolean,
): Promise<readonly Log[] | undefined> => {
  // The two modes are cached apart so a single lookup that missed cannot satisfy a caller that is willing
  // to wait for the block to land.
  const cacheKey = `${chainId}:${txHash.toLowerCase()}:${waitForMined ? 'wait' : 'once'}`
  const cached = receiptLogsByTx.get(cacheKey)
  if (cached) return cached

  const pending = readReceiptLogs(chainId, txHash, waitForMined).catch(error => {
    console.error('Failed to read transaction receipt', error)
    receiptLogsByTx.delete(cacheKey)
    return undefined
  })

  if (receiptLogsByTx.size >= RECEIPT_CACHE_LIMIT) {
    const oldest = receiptLogsByTx.keys().next().value
    if (oldest) receiptLogsByTx.delete(oldest)
  }
  receiptLogsByTx.set(cacheKey, pending)
  return pending
}

const increaseLiquidityTopic = keccak256(toBytes('IncreaseLiquidity(uint256,uint128,uint256,uint256)'))
// Algebra position managers (QuickSwap V3, Thena, Camelot V3) widen the event with actualLiquidity + pool.
const algebraIncreaseLiquidityTopic = keccak256(
  toBytes('IncreaseLiquidity(uint256,uint128,uint128,uint256,uint256,address)'),
)
const transferTopic = keccak256(toBytes('Transfer(address,address,uint256)'))

/**
 * The NFT id minted by a position-opening transaction. Pass `waitForMined` for a transaction that was just
 * sent, to ride out an RPC that has not seen the block yet.
 */
export const getTokenId = async (
  chainId: number,
  txHash: string,
  exchange: Exchange,
  { waitForMined = false }: { waitForMined?: boolean } = {},
) => {
  const logs = await getReceiptLogs(chainId, txHash, waitForMined)
  if (!logs) return

  const { isForkFrom } = EARN_DEXES[exchange]
  // Only the position manager mints the position NFT, so same-shaped events from the zap router, a hook or
  // a farming contract in the same receipt are ignored. A configured address that does not match any
  // emitter tells us nothing, so fall back to scanning the whole receipt rather than reporting no id.
  const nftManager = getNftManagerContractAddress(exchange, chainId)?.toLowerCase()
  const managerLogs = nftManager ? logs.filter(log => log.address.toLowerCase() === nftManager) : []
  const nftManagerLogs = managerLogs.length ? managerLogs : logs

  let hexTokenId: string | undefined
  if (isForkFrom === CoreProtocol.UniswapV4) {
    // V4-style managers emit no IncreaseLiquidity; the mint is the ERC-721 Transfer whose indexed tokenId
    // is topics[3].
    const transferLogs = nftManagerLogs.filter(log => log.topics[0] === transferTopic && log.topics.length === 4)
    hexTokenId = transferLogs[transferLogs.length - 1]?.topics[3]
  } else {
    const topic =
      isForkFrom === CoreProtocol.AlgebraV1 || isForkFrom === CoreProtocol.AlgebraV19
        ? algebraIncreaseLiquidityTopic
        : increaseLiquidityTopic
    hexTokenId = nftManagerLogs.find(log => log.topics[0] === topic)?.topics[1]
  }
  if (!hexTokenId) return

  // Use BigInt to preserve precision past 2^53. Callers stringify immediately
  // (e.g. `getTokenId(...).toString()`), so returning a numeric string is safe.
  return BigInt(hexTokenId).toString()
}

export const isNativeToken = (tokenAddress: string, chainId: keyof typeof WETH) =>
  EARN_CHAINS[chainId as EarnChain].nativeAddress === tokenAddress.toLowerCase()

export const isWrappedNativeToken = (tokenAddress: string, chainId: keyof typeof WETH) =>
  WETH[chainId] && tokenAddress.toLowerCase() === WETH[chainId].address.toLowerCase()

export const getDefaultRevertPrice = (pool: { token0: Token; token1: Token } | null, chainId: number) => {
  if (!pool) return false

  const isToken0Native = isWrappedNativeToken(pool.token0.address, chainId as keyof typeof WETH)
  const isToken0Stable = pool.token0.isStable
  const isToken1Stable = pool.token1.isStable

  return Boolean(isToken0Stable || (isToken0Native && !isToken1Stable))
}

export const submitTransaction = async ({
  account,
  chainId,
  txData,
  onError,
  isSmartConnector = false,
}: {
  account: string | undefined
  chainId: ChainId | number | undefined
  txData: LegacyTransactionRequest
  onError?: (error: Error) => void
  isSmartConnector?: boolean
}) => {
  if (!account) throw new Error('Wallet is not connected')
  if (!chainId) throw new Error('Chain is not ready')
  // Fail early with a clear message when the upstream API response is missing
  // `to` — viem otherwise rejects at sendTransaction with an opaque error.
  if (!txData.to) throw new Error('Missing contract address in transaction data')
  try {
    const value = txData.value ? BigInt(txData.value.toString()) : 0n
    const res = await sendEVMTransaction({
      account,
      contractAddress: txData.to as string,
      encodedData: (txData.data ?? '0x') as string as `0x${string}`,
      value,
      errorInfo: { name: ErrorName.SwapError, wallet: undefined },
      isSmartConnector,
      chainId: chainId as ChainId,
    })

    return {
      txHash: res?.hash ?? null,
      error: null,
    }
  } catch (error) {
    if (error instanceof BlacklistedWalletError) throw error
    console.error('Submit transaction error:', error)
    if (onError) onError(error as Error)
    return {
      txHash: null,
      error: error as Error,
    }
  }
}

export const getNftManagerContractAddress = (dex: Exchange, chainId: number) => {
  const nftManagerContractElement = EARN_DEXES[dex].nftManagerContract

  return typeof nftManagerContractElement === 'string'
    ? nftManagerContractElement
    : nftManagerContractElement[chainId as keyof typeof nftManagerContractElement]
}

export const truncateSymbol = (symbol: string, maxLength = 10) =>
  symbol.length > maxLength ? symbol.slice(0, maxLength) + '...' : symbol
