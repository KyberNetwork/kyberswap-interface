import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { SignerPaymaster } from '@holdstation/paymaster-helper'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { ethers } from 'ethers'

import { calculateGasMargin } from 'utils'

import { ErrorName, TransactionError } from './sentry'

const projectName = 'KyberSwap'
const partnerCode = ethers.utils.formatBytes32String(projectName)

const CUSTOM_PAYMASTER_ADDRESS = '0x069246dFEcb95A6409180b52C071003537B23c27'

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
  chainId?: ChainId
  paymentToken?: string
}): Promise<TransactionResponse | undefined> {
  if (!account || !library) throw new Error('Invalid transaction')

  const estimateGasOption = {
    from: account,
    to: contractAddress,
    data: encodedData,
    value,
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
    from: account,
    to: contractAddress,
    data: encodedData,
    gasLimit,
    ...(value.eq('0') ? {} : { value }),
  }

  try {
    const response = await (paymentToken
      ? paymasterExecute(paymentToken, sendTransactionOption, gasLimit.toNumber())
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
