import { Currency } from '@kyberswap/ks-sdk-core'
import { createConfig, getQuote, getStatus } from '@lifi/sdk'
import { WalletAdapterProps } from '@solana/wallet-adapter-base'
import { Connection, Transaction, VersionedTransaction } from '@solana/web3.js'
import { WalletClient, formatUnits } from 'viem'

import { CROSS_CHAIN_FEE_RECEIVER, ZERO_ADDRESS } from 'constants/index'
import { MAINNET_NETWORKS } from 'constants/networks'
import { SolanaToken } from 'state/crossChainSwap'

import { Quote } from '../registry'
import {
  BaseSwapAdapter,
  Chain,
  NOT_SUPPORTED_CHAINS_PRICE_SERVICE,
  NonEvmChain,
  NormalizedQuote,
  NormalizedTxResponse,
  QuoteParams,
  SwapStatus,
} from './BaseSwapAdapter'

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
  getSupportedChains(): Chain[] {
    return [NonEvmChain.Solana, ...MAINNET_NETWORKS]
  }

  getSupportedTokens(_sourceChain: Chain, _destChain: Chain): Currency[] {
    return []
  }

  async getQuote(params: QuoteParams): Promise<NormalizedQuote> {
    const r = await getQuote({
      fromChain: params.fromChain === 'solana' ? 'SOL' : +params.fromChain, // Arbitrum
      fromToken:
        params.fromChain === 'solana'
          ? (params.fromToken as SolanaToken).id
          : (params.fromToken as any).isNative
          ? ZERO_ADDRESS
          : (params.fromToken as any).wrapped.address,
      fromAmount: params.amount,
      fromAddress: params.sender === ZERO_ADDRESS ? CROSS_CHAIN_FEE_RECEIVER : params.sender,

      toChain: params.toChain === 'solana' ? 'SOL' : +params.toChain,
      toToken:
        params.toChain === 'solana'
          ? (params.toToken as SolanaToken).id
          : (params.toToken as any).isNative
          ? ZERO_ADDRESS
          : (params.toToken as any).wrapped.address,
      toAddress: params.recipient,
      fee: params.feeBps / 10_000,
    })

    //const inputUsd = Number(r.estimate.fromAmountUSD || '0')
    //const outputUsd = Number(r.estimate.toAmountUSD || '0')
    const formattedOutputAmount = formatUnits(BigInt(r.estimate.toAmount), params.toToken.decimals)
    const formattedInputAmount = formatUnits(BigInt(params.amount), params.fromToken.decimals)

    const inputUsd = NOT_SUPPORTED_CHAINS_PRICE_SERVICE.includes(params.fromChain)
      ? Number(r.estimate.fromAmountUSD)
      : params.tokenInUsd * +formattedInputAmount
    const outputUsd = NOT_SUPPORTED_CHAINS_PRICE_SERVICE.includes(params.toChain)
      ? Number(r.estimate.toAmountUSD)
      : params.tokenOutUsd * +formattedOutputAmount

    return {
      quoteParams: params,
      outputAmount: BigInt(r.estimate.toAmount),
      formattedOutputAmount: formatUnits(BigInt(r.estimate.toAmount), params.toToken.decimals),
      inputUsd,
      outputUsd,

      priceImpact: !inputUsd || !outputUsd ? NaN : ((inputUsd - outputUsd) * 100) / inputUsd,
      rate: +formattedOutputAmount / +formattedInputAmount,

      gasFeeUsd: 0,

      timeEstimate: r.estimate.executionDuration,
      contractAddress: r.transactionRequest?.to || r.estimate.approvalAddress,
      rawQuote: r,

      protocolFee: 0,
      platformFeePercent: (params.feeBps * 100) / 10_000,
    }
  }

  async executeSwap(
    { quote }: Quote,
    walletClient: WalletClient,
    _nearWalletClient?: any,
    _sendBtcFn?: (params: { recipient: string; amount: string | number }) => Promise<string>,
    sendTransaction?: WalletAdapterProps['sendTransaction'],
    connection?: Connection,
  ): Promise<NormalizedTxResponse> {
    if (quote.quoteParams.fromChain === NonEvmChain.Solana) {
      if (!connection || !sendTransaction) throw new Error('Connection is not defined for Solana swap')
      const txBuffer = Buffer.from(quote.rawQuote.transactionRequest.data, 'base64')

      // Try to deserialize as VersionedTransaction first
      let transaction
      try {
        transaction = VersionedTransaction.deserialize(txBuffer)
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

      // Send through wallet adapter
      const signature = await sendTransaction(transaction, connection)

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
      }
    }

    const account = walletClient.account?.address
    if (!account) throw new Error('WalletClient account is not defined')
    const tx = await walletClient.sendTransaction({
      chain: undefined,
      account,
      to: quote.rawQuote.transactionRequest.to,
      value: BigInt(quote.rawQuote.transactionRequest.value),
      data: quote.rawQuote.transactionRequest.data,
    })

    return {
      sender: quote.quoteParams.sender,
      id: tx, // specific id for each provider
      sourceTxHash: tx,
      adapter: this.getName(),
      sourceChain: quote.quoteParams.fromChain,
      targetChain: quote.quoteParams.toChain,
      inputAmount: quote.quoteParams.amount,
      outputAmount: quote.outputAmount.toString(),
      sourceToken: quote.quoteParams.fromToken,
      targetToken: quote.quoteParams.toToken,
      timestamp: new Date().getTime(),
    }
  }

  async getTransactionStatus(p: NormalizedTxResponse): Promise<SwapStatus> {
    const res = await getStatus({
      fromChain: p.sourceChain === 'solana' ? 'SOL' : +p.sourceChain,
      toChain: p.targetChain === 'solana' ? 'SOL' : +p.targetChain,
      txHash: p.sourceTxHash,
    })

    return {
      txHash: (res as any)?.receiving?.txHash || '',
      status: res.status === 'DONE' ? 'Success' : res.status === 'FAILED' ? 'Failed' : 'Processing',
    }
  }
}
