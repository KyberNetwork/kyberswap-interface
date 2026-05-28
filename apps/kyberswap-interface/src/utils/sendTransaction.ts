import { ChainId } from '@kyberswap/ks-sdk-core'
// eslint-disable-next-line no-restricted-imports
import { getAccount, getPublicClient } from '@wagmi/core'
import blackjackApi from 'services/blackjack'

import { CONNECTION, wagmiConfig } from 'components/Web3Provider'
import store from 'state'
import { calculateGasMarginBigInt } from 'utils'
import { createAccessListIfEnabled } from 'utils/accessList'
import { BlacklistedWalletError, ErrorName, TransactionError } from 'utils/transactionError'
import { Address, Hex, PublicClient } from 'utils/viem'
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

  const requestBase = {
    account: account as Address,
    to: contractAddress as Address,
    data: callData,
    ...(txValue !== undefined ? { value: txValue } : {}),
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
  try {
    const fees = await (publicClient as PublicClient).estimateFeesPerGas()
    if (fees?.maxFeePerGas !== undefined && fees?.maxPriorityFeePerGas !== undefined) {
      txParams.type = '0x2'
      txParams.maxFeePerGas = `0x${fees.maxFeePerGas.toString(16)}`
      txParams.maxPriorityFeePerGas = `0x${fees.maxPriorityFeePerGas.toString(16)}`
    }
  } catch {
    // Legacy / non-EIP-1559 chain or RPC quirk — leave fees to the wallet.
  }

  try {
    const hash = (await walletClient.request({
      method: 'eth_sendTransaction',
      params: [txParams] as never,
    })) as `0x${string}`
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
