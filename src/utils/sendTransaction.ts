import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { sendAndConfirmTransaction } from '@namgold/dmm-solana-sdk'
import { ChainId, Token, WETH } from '@namgold/ks-sdk-core'
import { AnchorProvider, Program } from '@project-serum/anchor'
import { captureException } from '@sentry/react'
import { SignerWalletAdapter } from '@solana/wallet-adapter-base'
import { PublicKey, Transaction, sendAndConfirmRawTransaction } from '@solana/web3.js'
import { ethers } from 'ethers'

import { SolanaAggregatorPrograms } from 'constants/idl/solana_aggregator_programs'
import connection from 'state/connection/connection'
// import connection from 'state/connection/connection'
import { calculateGasMargin } from 'utils'

import { Aggregator } from './aggregator'
import {
  createAtaInstruction,
  createSolanaSwapTransaction,
  createUnwrapSOLInstruction,
  createWrapSOLInstruction,
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
  handler?: (hash: string, firstTxHash: string) => void,
): Promise<string[] | undefined> {
  if (!trade.encodedSwapTx) return
  const accountPK = new PublicKey(account)
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()

  const txs: Transaction[] = []

  const setupTx =
    trade.encodedCreateOrderTx ||
    new Transaction({
      blockhash,
      lastValidBlockHeight,
      feePayer: accountPK,
    })
  setupTx.recentBlockhash = blockhash
  setupTx.lastValidBlockHeight = lastValidBlockHeight
  setupTx.feePayer = accountPK

  if (trade.inputAmount.currency.isNative) {
    const wrapIxs = await createWrapSOLInstruction(accountPK, trade.inputAmount)
    if (wrapIxs) setupTx.add(...wrapIxs)
  }

  await Promise.all(
    Object.entries(trade.tokens).map(async ([tokenAddress, token]) => {
      if (!token) return
      if (tokenAddress === WETH[ChainId.SOLANA].address) return
      const createAtaIxs = await createAtaInstruction(
        accountPK,
        new Token(ChainId.SOLANA, tokenAddress, token?.decimals || 0),
      )
      setupTx.add(createAtaIxs)
    }),
  )

  if (setupTx.instructions.length) {
    txs.push(setupTx)
  }

  const swapTx = trade.encodedSwapTx
  swapTx.recentBlockhash = blockhash
  swapTx.lastValidBlockHeight = lastValidBlockHeight
  swapTx.feePayer = accountPK
  await swapTx.partialSign(trade.programState)
  txs.push(swapTx)

  const cleanUpTx = new Transaction({
    blockhash,
    lastValidBlockHeight,
    feePayer: accountPK,
  })

  if (trade.outputAmount.currency.isNative) {
    const closeWSOLIxs = await createUnwrapSOLInstruction(accountPK, trade.outputAmount)
    if (closeWSOLIxs) cleanUpTx.add(closeWSOLIxs)
    txs.push(cleanUpTx)
  }

  try {
    const signedTxs: Transaction[] = await (solanaWallet as SignerWalletAdapter).signAllTransactions(txs)
    const txHashs: string[] = []
    for (let i = 0; i < signedTxs.length; i++) {
      const hash = await sendAndConfirmRawTransaction(connection, signedTxs[i].serialize())
      handler?.(hash, hash)
      txHashs.push(hash)
    }
    return txHashs
  } catch (e) {
    console.error(e)
    throw new Error('Swap error', { cause: e })
  }
}
// export async function sendSolanaTransactionWithFEEncode(
//   account: string,
//   program: Program<SolanaAggregatorPrograms>,
//   programAccount: string,
//   provider: AnchorProvider,
//   trade: Aggregator,
//   value: BigNumber,
//   handler?: (response: TransactionResponse) => void,
// ): Promise<string | undefined> {
//   if (!account) return

//   let tx: Transaction | undefined
//   try {
//     tx = await createSolanaSwapTransaction(new PublicKey(account), program, programAccount, trade, value)
//   } catch (e) {
//     console.error(e)
//     throw new Error('Create transaction failed', { cause: e })
//   }
//   try {
//     const response = await sendAndConfirmTransaction(provider, tx)
//     return response
//   } catch (e) {
//     console.error(e)
//     throw new Error('Swap error', { cause: e })
//   }
// }
