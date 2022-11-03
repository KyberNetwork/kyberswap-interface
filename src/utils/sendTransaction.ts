import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { ChainId, Token, WETH } from '@namgold/ks-sdk-core'
import { captureException } from '@sentry/react'
import { SignerWalletAdapter } from '@solana/wallet-adapter-base'
import { PublicKey, Transaction, sendAndConfirmRawTransaction } from '@solana/web3.js'
import { ethers } from 'ethers'

import connection from 'state/connection/connection'
import { TRANSACTION_TYPE } from 'state/transactions/type'
// import connection from 'state/connection/connection'
import { calculateGasMargin } from 'utils'

import { Aggregator } from './aggregator'
import {
  checkAndCreateWrapSOLInstructions,
  createAtaInstruction,
  createUnwrapSOLInstruction,
} from './solanaInstructions'

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

export async function sendSolanaTransactionWithBEEncode(
  account: string,
  trade: Aggregator,
  solanaWallet: SignerWalletAdapter,
  handler: (hash: string, firstTxHash: string) => void,
  handleCustomTypeResponse: (type: TRANSACTION_TYPE, hash: string, firstTxHash: string) => void,
): Promise<string[] | undefined> {
  if (!trade.encodedSwapTx) return
  const accountPK = new PublicKey(account)
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()

  const txs: Transaction[] = []

  let setupTx: Transaction | null = null
  const prepareSetupTx =
    trade.encodedCreateOrderTx ||
    new Transaction({
      blockhash,
      lastValidBlockHeight,
      feePayer: accountPK,
    })
  prepareSetupTx.recentBlockhash = blockhash
  prepareSetupTx.lastValidBlockHeight = lastValidBlockHeight
  prepareSetupTx.feePayer = accountPK

  if (trade.inputAmount.currency.isNative) {
    const wrapIxs = await checkAndCreateWrapSOLInstructions(accountPK, trade.inputAmount)
    if (wrapIxs) prepareSetupTx.add(...wrapIxs)
  }

  await Promise.all(
    Object.entries(trade.tokens).map(async ([tokenAddress, token]) => {
      if (!token) return
      if (tokenAddress === WETH[ChainId.SOLANA].address) return
      const createAtaIxs = await createAtaInstruction(
        accountPK,
        new Token(ChainId.SOLANA, tokenAddress, token?.decimals || 0),
      )
      if (createAtaIxs) prepareSetupTx.add(createAtaIxs)
    }),
  )

  if (prepareSetupTx.instructions.length) {
    setupTx = prepareSetupTx
    txs.push(setupTx)
  }

  const swapTx = trade.encodedSwapTx
  swapTx.recentBlockhash = blockhash
  swapTx.lastValidBlockHeight = lastValidBlockHeight
  swapTx.feePayer = accountPK
  await swapTx.partialSign(trade.programState)
  txs.push(swapTx)

  let cleanUpTx: Transaction | null = null

  if (trade.outputAmount.currency.isNative) {
    cleanUpTx = new Transaction({
      blockhash,
      lastValidBlockHeight,
      feePayer: accountPK,
    })
    const closeWSOLIxs = await createUnwrapSOLInstruction(accountPK)
    if (closeWSOLIxs) cleanUpTx.add(closeWSOLIxs)
    txs.push(cleanUpTx)
  }
  const populateTx = (txs: Transaction[]) => {
    const result: {
      signedSetupTx: Transaction | undefined
      signedSwapTx: Transaction | undefined
      signedCleanUpTx: Transaction | undefined
    } = { signedSetupTx: undefined, signedSwapTx: undefined, signedCleanUpTx: undefined }
    let count = 0
    if (setupTx) result.signedSetupTx = txs[count++]
    result.signedSwapTx = txs[count++]
    result.signedCleanUpTx = txs[count++]
    return result
  }

  console.group('Sending transactions:')
  console.info('setup tx:', setupTx ? setupTx.serializeMessage().toString('base64') : null)
  console.info('swap tx:', swapTx ? swapTx.serializeMessage().toString('base64') : null)
  console.info('clean up tx:', cleanUpTx ? cleanUpTx.serializeMessage().toString('base64') : null)
  console.groupEnd()
  let signedTxs: Transaction[]
  try {
    signedTxs = await (solanaWallet as SignerWalletAdapter).signAllTransactions(txs)
  } catch (e) {
    throw new Error('Transaction rejected.')
  }
  const { signedSetupTx, signedSwapTx, signedCleanUpTx } = populateTx(signedTxs)
  const txHashs: string[] = []
  if (signedSetupTx) {
    try {
      const setupHash = await sendAndConfirmRawTransaction(connection, signedSetupTx.serialize())
      txHashs.push(setupHash)
      handleCustomTypeResponse(TRANSACTION_TYPE.SETUP, setupHash, txHashs[0])
    } catch (e) {
      console.error(e)
      throw new Error('Set up error', { cause: e })
    }
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const swapHash = await sendAndConfirmRawTransaction(connection, signedSwapTx!.serialize())
    txHashs.push(swapHash)
    handler(swapHash, txHashs[0])
  } catch (error) {
    console.error({ error })
    if (error?.message?.endsWith('0x1771')) {
      throw new Error('An error occurred. Try refreshing the price rate or increase max slippage', { cause: error })
    }
    throw new Error('Swap error' + (error.message ? ': ' + error.message : ''), { cause: error })
  }

  if (signedCleanUpTx) {
    try {
      const cleanUpHash = await sendAndConfirmRawTransaction(connection, signedCleanUpTx.serialize())
      txHashs.push(cleanUpHash)
      handleCustomTypeResponse(TRANSACTION_TYPE.CLEANUP, cleanUpHash, txHashs[0])
    } catch (e) {
      console.error(e)
      throw new Error('Clean up error', { cause: e })
    }
  }

  return txHashs
}
