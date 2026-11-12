import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { WalletAdapterProps } from '@solana/wallet-adapter-base'
import { Connection, Transaction, VersionedTransaction } from '@solana/web3.js'
import { BaseSwapAdapter } from 'services/crossChain/adapters/BaseSwapAdapter'
import { isSourceTransactionReverted } from 'services/crossChain/adapters/sourceTransaction'
import { debridgeQuoteSchema, evmTransactionSchema } from 'services/crossChain/quote/rawQuote'
import { Quote } from 'services/crossChain/registry'
import { WalletClient } from 'viem'

import { NormalizedTxResponse, SwapStatus } from 'types/crossChain'

const DEBRIDGE_STATS_API = 'https://stats-api.dln.trade/api'

export class DeBridgeAdapter extends BaseSwapAdapter {
  getName(): string {
    return 'deBridge'
  }
  getIcon(): string {
    return 'https://app.debridge.finance/assets/images/meta-deswap/favicon-32x32.png'
  }
  async executeSwap(
    { quote }: Quote,
    walletClient: WalletClient,
    _nearWallet?: ReturnType<typeof useWalletSelector>,
    _sendBtcFn?: (params: { recipient: string; amount: string | number }) => Promise<string>,
    sendSolanaFn?: WalletAdapterProps['sendTransaction'],
    solanaConnection?: Connection,
    onSourceTransaction?: (
      sourceTxHash: string,
      tracking?: Pick<NormalizedTxResponse, 'id' | 'depositAddress'>,
    ) => void,
  ): Promise<NormalizedTxResponse> {
    const rawQuote = debridgeQuoteSchema.parse(quote.rawQuote)

    if (quote.quoteParams.fromChain === 'solana') {
      if (!solanaConnection || !sendSolanaFn) throw new Error('Connection is not defined for Solana swap')
      const txBuffer = Buffer.from(rawQuote.tx.data.slice(2), 'hex')

      // deBridge may return either Solana transaction format.
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

      const signature = await sendSolanaFn(transaction, solanaConnection)
      onSourceTransaction?.(signature, { id: rawQuote.orderId })
      const waitForConfirmation = async (txId: string) => {
        try {
          const latestBlockhash = await solanaConnection.getLatestBlockhash()

          // Wait for confirmation with timeout
          const confirmation = await Promise.race([
            solanaConnection.confirmTransaction(
              {
                signature: txId,
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
          const txStatus = await solanaConnection.getSignatureStatus(txId)
          if (txStatus?.value?.confirmationStatus !== 'confirmed') {
            throw new Error(`Transaction was not confirmed: ${confirmError.message}`)
          }
        }
      }

      await waitForConfirmation(signature)

      return {
        sender: quote.quoteParams.sender,
        id: rawQuote.orderId,
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

    const transaction = evmTransactionSchema.parse(rawQuote.tx)
    const tx = await walletClient.sendTransaction({
      chain: undefined,
      account,
      to: transaction.to,
      value: BigInt(transaction.value),
      data: transaction.data,
    })
    return {
      sender: quote.quoteParams.sender,
      id: rawQuote.orderId,
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
    if (await isSourceTransactionReverted(p)) return { txHash: '', status: 'Failed' }

    const r = await fetch(`${DEBRIDGE_STATS_API}/Orders/${p.id}`).then(res => res.json())

    const actualAmountOut = r?.takeOfferWithMetadata?.amount?.stringValue

    return {
      status:
        r.state === 'Fulfilled' || r.state === 'SentUnlock' || r.state === 'ClaimedUnlock'
          ? 'Success'
          : r.state === 'OrderCancelled'
          ? 'Failed'
          : 'Processing',
      txHash: p.id,
      amountOut: actualAmountOut ? String(actualAmountOut) : undefined,
    }
  }
}
