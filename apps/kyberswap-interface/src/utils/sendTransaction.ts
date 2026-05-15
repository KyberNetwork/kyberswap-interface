import { ChainId } from '@kyberswap/ks-sdk-core'
import { getPublicClient } from '@wagmi/core'
import blackjackApi from 'services/blackjack'

import { wagmiConfig } from 'components/Web3Provider'
import { NETWORKS_INFO } from 'constants/networks'
import store from 'state'
import { calculateGasMarginBigInt } from 'utils'
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

  // Best-effort eth_createAccessList for chains that opt-in. Failure is non-fatal.
  let accessList: { address: Address; storageKeys: Hex[] }[] | undefined
  if (NETWORKS_INFO[chainId]?.accessListEnabled) {
    try {
      const al = (await publicClient.request({
        method: 'eth_createAccessList' as any,
        params: [
          {
            from: account,
            to: contractAddress,
            data: callData,
            ...(txValue !== undefined ? { value: `0x${txValue.toString(16)}` } : {}),
          },
          'latest',
        ] as any,
      })) as { accessList?: { address: Address; storageKeys: Hex[] }[] } | undefined
      if (al?.accessList && Array.isArray(al.accessList)) {
        accessList = al.accessList
      }
    } catch {
      // ignore; chain may not support eth_createAccessList
    }
  }

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

  try {
    const hash = await walletClient.sendTransaction({
      ...requestBase,
      gas: gasLimit,
      ...(accessList ? { accessList } : {}),
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
