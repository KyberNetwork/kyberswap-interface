import { TransactionResponse } from '@ethersproject/providers'
import { SignerPaymaster } from '@holdstation/paymaster-helper'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { getPublicClient } from '@wagmi/core'
import { ethers } from 'ethers'
import blackjackApi from 'services/blackjack'

import { wagmiConfig } from 'components/Web3Provider'
import { NETWORKS_INFO } from 'constants/networks'
import store from 'state'
import { calculateGasMargin, calculateGasMarginBigInt } from 'utils'

import { hashToTxResponse } from './migration'
import { BlacklistedWalletError, ErrorName, TransactionError } from './transactionError'
import { Address, Hex, stringToHex } from './viem'
import { getGatedWalletClient } from './walletClient'

const projectName = 'KyberSwap'
const partnerCode = stringToHex(projectName, { size: 32 })

const CUSTOM_PAYMASTER_ADDRESS = '0x069246dFEcb95A6409180b52C071003537B23c27'

// encoded from bc_r7yhais5
// https://www.base.dev/apps/6985b21e8dcaa0daf5755f6c/settings/builder-code
const BASE_BUILDER_CODE = '62635f72377968616973350b0080218021802180218021802180218021'

export const paymasterExecute = (
  paymentToken: string,
  populateTransaction: ethers.PopulatedTransaction,
  gasLimit: number,
) => {
  return SignerPaymaster.paymasterExecute({
    network: 'mainnet',
    populateTransaction,
    paymentToken,
    innerInput: partnerCode,
    paymasterAddress: CUSTOM_PAYMASTER_ADDRESS,
    defaultGasLimit: gasLimit,
  })
}

// Pre-send security gate. Mirrors the same check the legacy `useWeb3React` Proxy did on
// every `.send('eth_sendTransaction'|signing-method', ...)` call. Fails open on network
// errors so an unreachable Blackjack service doesn't block the user's transaction.
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
  library,
  contractAddress,
  encodedData,
  value,
  errorInfo,
  isSmartConnector,
  chainId,
  paymentToken,
  paymasterGasMultiplier,
}: {
  account: string
  library: ethers.providers.Web3Provider | undefined
  contractAddress: string
  encodedData: string
  value: bigint
  errorInfo: {
    name: ErrorName
    wallet: string | undefined
  }
  isSmartConnector: boolean
  chainId?: ChainId
  paymentToken?: string
  // Multiplier applied to the raw gas estimate for the paymaster path; replaces
  // calculateGasMargin when provided. Used by approval flows that historically bumped
  // gas by 2x to avoid failures (see Slack thread referenced in useApproveCallback).
  paymasterGasMultiplier?: number
}): Promise<TransactionResponse | undefined> {
  if (!account || !library) throw new Error('Invalid transaction')

  let effectiveChainId = chainId
  try {
    if (!effectiveChainId) {
      const network = await library.getNetwork()
      effectiveChainId = network.chainId as ChainId
    }
  } catch {}

  const callData = (
    !isSmartConnector && effectiveChainId === ChainId.BASE ? `${encodedData}${BASE_BUILDER_CODE}` : encodedData
  ) as Hex

  const txValue = value && value !== 0n ? value : undefined

  // Paymaster path: the `@holdstation/paymaster-helper` SDK is typed against ethers, so
  // keep the legacy ethers Signer flow for this branch. The non-paymaster branch below
  // uses viem walletClient (gated via `getGatedWalletClient`), so the Blackjack check
  // there runs at the EIP-1193 boundary. This branch bypasses viem entirely, so call
  // the gate inline.
  if (paymentToken) {
    await ensureNotBlacklisted(account)
    const baseTx = {
      from: account,
      to: contractAddress,
      data: callData,
      ...(txValue !== undefined ? { value: `0x${txValue.toString(16)}` } : {}),
    }
    const estimateGasOption = baseTx
    let gasEstimate: ethers.BigNumber | undefined
    try {
      gasEstimate = await library.getSigner().estimateGas(estimateGasOption)
      if (!gasEstimate) throw new Error('gasEstimate is nullish value')
    } catch (error) {
      throw new TransactionError(
        errorInfo.name,
        'estimateGas',
        error?.message,
        estimateGasOption,
        { cause: error },
        errorInfo.wallet,
      )
    }
    const effectiveGasLimit =
      paymasterGasMultiplier !== undefined
        ? gasEstimate.mul(paymasterGasMultiplier)
        : calculateGasMargin(gasEstimate, chainId)
    try {
      return await paymasterExecute(
        paymentToken,
        {
          ...estimateGasOption,
          gasLimit: effectiveGasLimit,
          value: txValue !== undefined ? ethers.BigNumber.from(txValue) : undefined,
        },
        effectiveGasLimit.toNumber(),
      )
    } catch (error) {
      const txHash = (error as any)?.transactionHash as string | undefined
      if (txHash) return { hash: txHash } as TransactionResponse
      throw new TransactionError(
        errorInfo.name,
        'sendTransaction',
        error?.message,
        { ...estimateGasOption, gasLimit: effectiveGasLimit },
        { cause: error },
        errorInfo.wallet,
      )
    }
  }

  // Non-paymaster path: viem walletClient + publicClient via wagmi. The wallet client
  // is gated — its `request()` runs `ensureNotBlacklisted` for any signing method, so
  // we don't need a separate inline check here.
  const publicClient = getPublicClient(wagmiConfig, { chainId: effectiveChainId as number })
  const walletClient = await getGatedWalletClient({ chainId: effectiveChainId as number })
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
  if (effectiveChainId && NETWORKS_INFO[effectiveChainId]?.accessListEnabled) {
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
    gasEstimate = (await (publicClient as any).estimateGas({
      ...requestBase,
      ...(accessList ? { accessList } : {}),
    })) as bigint
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

  const gasLimit = calculateGasMarginBigInt(gasEstimate, effectiveChainId)

  try {
    // viem's `sendTransaction` argument type is a chain-specific union large enough to
    // overflow the TS instantiation depth limit at this call site. The runtime contract is
    // simple — `{ to, data, value?, gas?, accessList?, account }` — so call through `any`.
    const hash = (await (walletClient as any).sendTransaction({
      ...requestBase,
      gas: gasLimit,
      ...(accessList ? { accessList } : {}),
    })) as Hex
    return hashToTxResponse(hash, publicClient as any)
  } catch (error) {
    const txHash = (error as any)?.transactionHash as string | undefined
    if (txHash) return { hash: txHash } as TransactionResponse
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
