import { ChainId } from '@kyberswap/ks-sdk-core'
import { getPublicClient } from '@wagmi/core'
import blackjackApi from 'services/blackjack'

import { wagmiConfig } from 'components/Web3Provider'
import store from 'state'
import { calculateGasMarginBigInt } from 'utils'
import { createAccessListIfEnabled } from 'utils/accessList'
import { BlacklistedWalletError, ErrorName, TransactionError } from 'utils/transactionError'
import { Address, Hex, PublicClient } from 'utils/viem'
import { getGatedWalletClient } from 'utils/walletClient'

export interface SendEVMTransactionResult {
  hash: string
}

// encoded from bc_r7yhais5
// https://www.base.dev/apps/6985b21e8dcaa0daf5755f6c/settings/builder-code
const BASE_BUILDER_CODE = '62635f72377968616973350b0080218021802180218021802180218021'

// Pre-send security gate invoked by the gated walletClient on every signing method.
// Fails open on network errors so an unreachable Blackjack service doesn't block the
// user's transaction.
export async function ensureNotBlacklisted(account: string) {
  try {
    const res = await store.dispatch(blackjackApi.endpoints.checkBlackjack.initiate(account))
    if (res?.data?.blacklisted) throw new BlacklistedWalletError()
  } catch (err) {
    if (err instanceof BlacklistedWalletError) throw err
    console.warn('Blackjack check skipped due to network error', err)
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
}): Promise<SendEVMTransactionResult | undefined> {
  if (!account) throw new Error('Invalid transaction')

  const callData = (
    !isSmartConnector && chainId === ChainId.BASE ? `${encodedData}${BASE_BUILDER_CODE}` : encodedData
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

  const requestBase = {
    account: account as Address,
    to: contractAddress as Address,
    data: callData,
    ...(txValue !== undefined ? { value: txValue } : {}),
  }

  const accessList = await createAccessListIfEnabled(publicClient, chainId, {
    from: account,
    to: contractAddress,
    data: callData,
    value: txValue,
  })

  let gasEstimate: bigint
  try {
    // viem's `estimateGas` argument type is a chain-specific union that
    // overflows the TS instantiation depth at the wagmi-resolved publicClient.
    // Runtime contract is the standard `{ to, data, value?, account, accessList? }`.
    gasEstimate = await (publicClient as PublicClient).estimateGas({
      ...requestBase,
      ...(accessList ? { accessList } : {}),
    })
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

  const gasLimit = calculateGasMarginBigInt(gasEstimate, chainId)

  // Pre-fill type and fee fields the way ethers v5 used to. Hardware wallets
  // like SafePal can't decode an eth_sendTransaction payload that's missing
  // `type` / `maxFeePerGas` / `maxPriorityFeePerGas` (error -104 "show tx
  // info failed"). Software wallets (MetaMask, Rabby) auto-fill these so the
  // regression only surfaces on hardware. We deliberately skip `nonce` —
  // hardware wallets should source it themselves to avoid stale reads.
  let preparedFees: { type?: 'eip1559'; maxFeePerGas?: bigint; maxPriorityFeePerGas?: bigint } = {}
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prepared = await (publicClient as any).prepareTransactionRequest({
      ...requestBase,
      gas: gasLimit,
      ...(accessList ? { accessList } : {}),
      // Restrict to the fee/type fields — viem's default parameter set would
      // also touch `nonce` and `chainId`, which we'd rather leave to the
      // wallet.
      parameters: ['fees', 'type'],
    })
    if (prepared?.maxFeePerGas !== undefined && prepared?.maxPriorityFeePerGas !== undefined) {
      preparedFees = {
        type: 'eip1559',
        maxFeePerGas: prepared.maxFeePerGas,
        maxPriorityFeePerGas: prepared.maxPriorityFeePerGas,
      }
    }
  } catch {
    // Best-effort: if fee estimation fails (RPC quirks, legacy chain), fall
    // back to letting the wallet fill fees itself.
  }

  try {
    const hash = await walletClient.sendTransaction({
      ...requestBase,
      gas: gasLimit,
      ...preparedFees,
      ...(accessList ? { accessList, type: 'eip1559' as const } : {}),
    })
    return { hash }
  } catch (error) {
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
