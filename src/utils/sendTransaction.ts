import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { t } from '@lingui/macro'
import { captureException } from '@sentry/react'
import { SignerWalletAdapter } from '@solana/wallet-adapter-base'
import { Transaction, VersionedTransaction, sendAndConfirmRawTransaction } from '@solana/web3.js'
import { ethers } from 'ethers'

import connection from 'state/connection/connection'
import { TRANSACTION_TYPE } from 'state/transactions/type'
// import connection from 'state/connection/connection'
import { calculateGasMargin } from 'utils'

import { Aggregator } from './aggregator'

export async function sendEVMTransaction(
  account: string,
  library: ethers.providers.Web3Provider | undefined,
  contractAddress: string,
  encodedData: string,
  value: BigNumber,
  handler?: (response: TransactionResponse) => void,
): Promise<string | undefined> {
  if (!account || !library) return

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
    const e = new Error('Swap failed', { cause: error })
    e.name = 'SwapError'

    const tmp = JSON.stringify(error)
    const tag = tmp.includes('minTotalAmountOut')
      ? 'minTotalAmountOut'
      : tmp.includes('ERR_LIMIT_OUT')
      ? 'ERR_LIMIT_OUT'
      : tmp.toLowerCase().includes('1inch')
      ? 'call1InchFailed'
      : 'other'

    captureException(e, {
      level: 'fatal',
      extra: estimateGasOption,
      tags: {
        type: tag,
      },
    })

    throw new Error('gasEstimate not found: Unexpected error. Please contact support: none of the calls threw an error')
  }

  const sendTransactionOption = {
    from: account,
    to: contractAddress,
    data: encodedData,
    gasLimit: calculateGasMargin(gasEstimate),
    ...(value.eq('0') ? {} : { value }),
  }

  try {
    const response = await library.getSigner().sendTransaction(sendTransactionOption)
    handler?.(response)
    return response.hash
  } catch (error) {
    // if the user rejected the tx, pass this along
    if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
      throw new Error('Transaction rejected.')
    } else {
      const e = new Error('Swap failed', { cause: error })
      e.name = 'SwapError'

      const tmp = JSON.stringify(error)
      const tag = tmp.includes('minTotalAmountOut')
        ? 'minTotalAmountOut'
        : tmp.includes('ERR_LIMIT_OUT')
        ? 'ERR_LIMIT_OUT'
        : tmp.toLowerCase().includes('1inch')
        ? 'call1InchFailed'
        : 'other'

      captureException(e, {
        level: 'error',
        extra: sendTransactionOption,
        tags: {
          type: tag,
        },
      })

      // Otherwise, the error was unexpected, and we need to convey that.
      throw new Error(error)
    }
  }
}

const getInspectTxSolanaUrl = (tx: Transaction | VersionedTransaction | undefined | null) => {
  if (!tx) return ''
  const base64Str = Buffer.concat([
    Buffer.from([0]),
    'serializeMessage' in tx ? tx.serializeMessage() : Buffer.from(tx.serialize()),
  ]).toString('base64')
  return base64Str
  // return 'https://explorer.solana.com/tx/inspector?signatures=%255B%255D&message=' + escape(escape(base64Str))
}

export async function sendSolanaTransactionWithBEEncode(
  trade: Aggregator,
  solanaWallet: SignerWalletAdapter,
  handler: (hash: string, firstTxHash: string) => void,
  handleCustomTypeResponse: (type: TRANSACTION_TYPE, hash: string, firstTxHash: string) => void,
): Promise<string[] | undefined> {
  if (!trade.swapTx) return

  const txs: (Transaction | VersionedTransaction)[] = []

  if (trade.setupTx) {
    txs.push(trade.setupTx)
  }

  txs.push(trade.swapTx)

  if (trade.cleanUpTx) {
    txs.push(trade.cleanUpTx)
  }

  const populateTx = (
    txs: (Transaction | VersionedTransaction)[],
  ): {
    signedSetupTx: Transaction | undefined
    signedSwapTx: VersionedTransaction
    signedCleanUpTx: Transaction | undefined
  } => {
    const result: {
      signedSetupTx: Transaction | undefined
      signedSwapTx: VersionedTransaction | undefined
      signedCleanUpTx: Transaction | undefined
    } = { signedSetupTx: undefined, signedSwapTx: undefined, signedCleanUpTx: undefined }
    let count = 0
    if (trade.setupTx) result.signedSetupTx = txs[count++] as Transaction
    result.signedSwapTx = txs[count++] as VersionedTransaction
    result.signedCleanUpTx = txs[count++] as Transaction
    return result as {
      signedSetupTx: Transaction | undefined
      signedSwapTx: VersionedTransaction
      signedCleanUpTx: Transaction | undefined
    }
  }

  console.group('Sending transactions:')
  trade.setupTx && console.info('setup tx:', getInspectTxSolanaUrl(trade.setupTx))
  console.info('swap tx:', getInspectTxSolanaUrl(trade.swapTx))
  trade.cleanUpTx && console.info('clean up tx:', getInspectTxSolanaUrl(trade.cleanUpTx))
  console.info('inspector: https://explorer.solana.com/tx/inspector')
  console.groupEnd()

  try {
    let signedTxs: (Transaction | VersionedTransaction)[]
    try {
      signedTxs = await (solanaWallet as SignerWalletAdapter).signAllTransactions(txs)
    } catch (e) {
      console.log({ e })
      throw e
    }
    const { signedSetupTx, signedSwapTx, signedCleanUpTx } = populateTx(signedTxs)
    const txHashs: string[] = []
    if (signedSetupTx) {
      try {
        const setupHash = await sendAndConfirmRawTransaction(connection, signedSetupTx.serialize())
        txHashs.push(setupHash)
        handleCustomTypeResponse(TRANSACTION_TYPE.SETUP, setupHash, txHashs[0])
      } catch (error) {
        console.error({ error })
        throw new Error('Set up error' + (error.message ? ': ' + error.message : ''))
      }
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const swapHash = await sendAndConfirmRawTransaction(connection, Buffer.from(signedSwapTx.serialize()))
      txHashs.push(swapHash)
      handler(swapHash, txHashs[0])
    } catch (error) {
      console.error({ error })
      if (error?.message?.endsWith('0x1771')) {
        throw new Error(t`An error occurred. Try refreshing the price rate or increase max slippage`)
      }
      throw error
    }

    if (signedCleanUpTx) {
      try {
        const cleanUpHash = await sendAndConfirmRawTransaction(connection, signedCleanUpTx.serialize())
        txHashs.push(cleanUpHash)
        handleCustomTypeResponse(TRANSACTION_TYPE.CLEANUP, cleanUpHash, txHashs[0])
      } catch (error) {
        console.error({ error })
        throw new Error('Clean up error' + (error.message ? ': ' + error.message : ''))
      }
    }
    return txHashs
  } catch (e) {
    throw e
  }
}
