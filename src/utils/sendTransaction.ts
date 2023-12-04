import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { ethers } from 'ethers'

import { SUPPORTED_WALLET } from 'constants/wallets'
import { calculateGasMargin } from 'utils'

import { ErrorName, TransactionError } from './sentry'

export async function sendEVMTransaction({
  account,
  library,
  contractAddress,
  encodedData,
  value,
  sentryInfo,
  chainId,
}: {
  account: string
  library: ethers.providers.Web3Provider | undefined
  contractAddress: string
  encodedData: string
  value: BigNumber
  sentryInfo: {
    name: ErrorName
    wallet: SUPPORTED_WALLET | undefined
  }
  chainId?: ChainId
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

  const sendTransactionOption = {
    from: account,
    to: contractAddress,
    data: encodedData,
    gasLimit: calculateGasMargin(gasEstimate, chainId),
    ...(value.eq('0') ? {} : { value }),
  }

  try {
    const response = await library.getSigner().sendTransaction(sendTransactionOption)
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
