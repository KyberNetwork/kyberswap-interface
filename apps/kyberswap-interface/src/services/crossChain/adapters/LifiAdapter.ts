import { createConfig, getStatus } from '@lifi/sdk'
import { WalletAdapterProps } from '@solana/wallet-adapter-base'
import { Connection, Transaction, VersionedTransaction } from '@solana/web3.js'
import { BaseSwapAdapter } from 'services/crossChain/adapters/BaseSwapAdapter'
import { evmTransactionSchema, lifiQuoteSchema } from 'services/crossChain/quote/rawQuote'
import { Quote } from 'services/crossChain/registry'
import { WalletClient } from 'viem'

import { NonEvmChain, NormalizedTxResponse, SwapStatus } from 'types/crossChain'

export class LifiAdapter extends BaseSwapAdapter {
  constructor() {
    super()
    createConfig({
      integrator: 'kyberswap',
    })
  }

  getName(): string {
    return 'LIFI'
  }
  getIcon(): string {
    return 'https://storage.googleapis.com/ks-setting-1d682dca/aed3a971-48be-4c3c-9597-5ab78073fbf11745552578218.png'
  }
  async executeSwap(
    { quote }: Quote,
    walletClient: WalletClient,
    _nearWalletClient?: any,
    _sendBtcFn?: (params: { recipient: string; amount: string | number }) => Promise<string>,
    sendTransaction?: WalletAdapterProps['sendTransaction'],
    connection?: Connection,
    onSourceTransaction?: (
      sourceTxHash: string,
      tracking?: Pick<NormalizedTxResponse, 'id' | 'depositAddress'>,
    ) => void,
  ): Promise<NormalizedTxResponse> {
    const rawQuote = lifiQuoteSchema.parse(quote.rawQuote)

    if (quote.quoteParams.fromChain === NonEvmChain.Solana) {
      if (!connection || !sendTransaction) throw new Error('Connection is not defined for Solana swap')
      const txBuffer = Buffer.from(rawQuote.transactionRequest.data, 'base64')

      // LI.FI may return either Solana transaction format.
      let transaction
      try {
        transaction = VersionedTransaction.deserialize(txBuffer as any)
        console.log('Parsed as VersionedTransaction')
      } catch (versionedError) {
        console.log('Failed to parse as VersionedTransaction, trying legacy Transaction')
        try {
          transaction = Transaction.from(txBuffer)
          console.log('Parsed as legacy Transaction')
        } catch (legacyError) {
          throw new Error('Could not parse transaction as either VersionedTransaction or legacy Transaction')
        }
      }

      console.log('Transaction parsed successfully:', transaction)

      const signature = await sendTransaction(transaction, connection)
      onSourceTransaction?.(signature)

      try {
        const latestBlockhash = await connection.getLatestBlockhash()

        // Wait for confirmation with timeout
        const confirmation = await Promise.race([
          connection.confirmTransaction(
            {
              signature,
              blockhash: latestBlockhash.blockhash,
              lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            },
            'confirmed',
          ),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Transaction confirmation timeout')), 60000)),
        ])

        const confirmationResult = confirmation as { value: { err: any } }
        if (confirmationResult.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmationResult.value.err)}`)
        }

        console.log('Transaction confirmed successfully!')
      } catch (confirmError) {
        console.error('Transaction confirmation failed:', confirmError)

        // Check if transaction actually succeeded despite timeout
        const txStatus = await connection.getSignatureStatus(signature)
        if (txStatus?.value?.confirmationStatus !== 'confirmed') {
          throw new Error(`Transaction was not confirmed: ${confirmError.message}`)
        }
      }

      return {
        sender: quote.quoteParams.sender,
        id: signature,
        sourceTxHash: signature,
        adapter: this.getName(),
        sourceChain: quote.quoteParams.fromChain,
        targetChain: quote.quoteParams.toChain,
        inputAmount: quote.quoteParams.amount,
        outputAmount: quote.outputAmount.toString(),
        sourceToken: quote.quoteParams.fromToken,
        targetToken: quote.quoteParams.toToken,
        timestamp: new Date().getTime(),
        amountInUsd: quote.inputUsd,
        amountOutUsd: quote.outputUsd,
        platformFeePercent: quote.platformFeePercent,
        recipient: quote.quoteParams.recipient,
      }
    }

    const account = walletClient.account?.address
    if (!account) throw new Error('WalletClient account is not defined')

    const transaction = evmTransactionSchema.parse(rawQuote.transactionRequest)
    const tx = await walletClient.sendTransaction({
      chain: undefined,
      account,
      to: transaction.to,
      value: BigInt(transaction.value),
      data: transaction.data,
    })

    return {
      sender: quote.quoteParams.sender,
      id: tx,
      sourceTxHash: tx,
      adapter: this.getName(),
      sourceChain: quote.quoteParams.fromChain,
      targetChain: quote.quoteParams.toChain,
      inputAmount: quote.quoteParams.amount,
      outputAmount: quote.outputAmount.toString(),
      sourceToken: quote.quoteParams.fromToken,
      targetToken: quote.quoteParams.toToken,
      timestamp: new Date().getTime(),
      amountInUsd: quote.inputUsd,
      amountOutUsd: quote.outputUsd,
      platformFeePercent: quote.platformFeePercent,
      recipient: quote.quoteParams.recipient,
    }
  }

  async getTransactionStatus(p: NormalizedTxResponse): Promise<SwapStatus> {
    const res = await getStatus({
      fromChain: p.sourceChain === 'solana' ? 'SOL' : +p.sourceChain,
      toChain: p.targetChain === 'solana' ? 'SOL' : +p.targetChain,
      txHash: p.sourceTxHash,
    })

    // Prefer the received value after gas; fall back to amount when value is absent or zero.
    const receivingData = (res as any)?.receiving
    const actualAmountOut =
      receivingData?.value && receivingData.value !== '0' ? receivingData.value : receivingData?.amount

    return {
      txHash: (res as any)?.receiving?.txHash || '',
      status:
        res.substatus === 'REFUNDED'
          ? 'Refunded'
          : res.status === 'DONE'
          ? 'Success'
          : res.status === 'FAILED'
          ? 'Failed'
          : 'Processing',
      amountOut: actualAmountOut ? String(actualAmountOut) : undefined,
    }
  }
}
