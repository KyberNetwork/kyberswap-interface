import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { SignerPaymaster } from '@holdstation/paymaster-helper'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { ethers } from 'ethers'

import { NETWORKS_INFO } from 'constants/networks'
import { calculateGasMargin } from 'utils'

import { ErrorName, TransactionError } from './sentry'

const projectName = 'KyberSwap'
const partnerCode = ethers.utils.formatBytes32String(projectName)

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
    // signer: library.getSigner(),
    paymentToken,
    innerInput: partnerCode,
    paymasterAddress: CUSTOM_PAYMASTER_ADDRESS,
    defaultGasLimit: gasLimit,
  })
}

export async function sendEVMTransaction({
  account,
  library,
  contractAddress,
  encodedData,
  value,
  sentryInfo,
  isSmartConnector,
  chainId,
  paymentToken,
}: {
  account: string
  library: ethers.providers.Web3Provider | undefined
  contractAddress: string
  encodedData: string
  value: BigNumber
  sentryInfo: {
    name: ErrorName
    wallet: string | undefined
  }
  isSmartConnector: boolean
  chainId?: ChainId
  paymentToken?: string
}): Promise<TransactionResponse | undefined> {
  if (!account || !library) throw new Error('Invalid transaction')

  let accessList: any[] | undefined
  let effectiveChainId = chainId
  try {
    if (!effectiveChainId) {
      const network = await library.getNetwork()
      effectiveChainId = network.chainId as ChainId
    }
  } catch {}

  const callData = !isSmartConnector && chainId === ChainId.BASE ? `${encodedData}${BASE_BUILDER_CODE}` : encodedData

  const baseTx = {
    from: account,
    to: contractAddress,
    data: callData,
    ...(value && !value.eq(0) ? { value: ethers.utils.hexlify(value) } : {}),
  }
  if (effectiveChainId && NETWORKS_INFO[effectiveChainId]?.accessListEnabled) {
    try {
      const al = await library.send('eth_createAccessList', [baseTx, 'latest'])
      if (al && Array.isArray(al.accessList)) {
        accessList = al.accessList
      }
    } catch {
      // best-effort; continue without accessList if RPC doesn't support it
      accessList = undefined
    }
  }

  const estimateGasOption = {
    ...baseTx,
    ...(accessList ? { accessList } : {}),
  }

  let gasEstimate: ethers.BigNumber | undefined
  try {
    gasEstimate = await library.getSigner().estimateGas(estimateGasOption)
    if (!gasEstimate) throw new Error('gasEstimate is nullish value')
  } catch (error) {
    throw new TransactionError(
      sentryInfo.name,
      'estimateGas',
      error?.message,
      estimateGasOption,
      { cause: error },
      sentryInfo.wallet,
    )
  }

  const gasLimit = calculateGasMargin(gasEstimate, chainId)
  const sendTransactionOption = {
    ...estimateGasOption,
    gasLimit,
  }

  try {
    const response = await (paymentToken
      ? paymasterExecute(
          paymentToken,
          {
            ...sendTransactionOption,
            value: value ? ethers.BigNumber.from(value) : undefined,
          },
          gasLimit.toNumber(),
        )
      : library.getSigner().sendTransaction(sendTransactionOption))
    return response
  } catch (error) {
    throw new TransactionError(
      sentryInfo.name,
      'sendTransaction',
      error?.message,
      sendTransactionOption,
      { cause: error },
      sentryInfo.wallet,
    )
  }
}
