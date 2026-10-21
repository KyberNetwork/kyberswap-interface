import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { ChainName, type SolanaTransactionSigner, swapFromSolana } from '@mayanfinance/swap-sdk'
import { WalletAdapterProps } from '@solana/wallet-adapter-base'
import { Connection } from '@solana/web3.js'
import { getPublicClient } from '@wagmi/core'
import { WalletClient, parseUnits } from 'viem'
import { z } from 'zod'

import { wagmiConfig } from 'components/Web3Provider'
import {
  BaseSwapAdapter,
  Chain,
  EvmQuoteParams,
  NonEvmChain,
  NormalizedQuote,
  NormalizedTxResponse,
  SwapStatus,
} from 'pages/CrossChainSwap/adapters/BaseSwapAdapter'
import { buildEvmTransaction } from 'pages/CrossChainSwap/adapters/MayanAdapter/streamExecution'
import { evmTransactionSchema, parseMayanQuote } from 'pages/CrossChainSwap/quote/rawQuote'
import { Quote } from 'pages/CrossChainSwap/registry'
import { CROSS_CHAIN_FEE_RECEIVER, CROSS_CHAIN_FEE_RECEIVER_SOLANA } from 'pages/CrossChainSwap/utils'

const CROSS_CHAIN_FEE_RECEIVER_SUI = 'intentionally-empty-for-now'

const streamedTransactionSchema = evmTransactionSchema.extend({ chainId: z.number().optional() })

const mappingChain: Record<string, ChainName> = {
  [ChainId.MAINNET]: 'ethereum',
  [ChainId.BSCMAINNET]: 'bsc',
  [ChainId.MATIC]: 'polygon',
  [ChainId.AVAXMAINNET]: 'avalanche',
  [ChainId.ARBITRUM]: 'arbitrum',
  [ChainId.OPTIMISM]: 'optimism',
  [ChainId.BASE]: 'base',
  [ChainId.LINEA]: 'linea',
  [NonEvmChain.Solana]: 'solana',
}

function hasSolanaSigner(x: unknown): x is { signTransaction: SolanaTransactionSigner } {
  return typeof x === 'object' && x !== null && typeof (x as any).signTransaction === 'function'
}

export class MayanAdapter extends BaseSwapAdapter {
  constructor() {
    super()
  }

  getName(): string {
    return 'Mayan'
  }
  getIcon(): string {
    return 'https://swap.mayan.finance/favicon.ico'
  }
  getSupportedChains(): Chain[] {
    return [...Object.keys(mappingChain).map(Number), NonEvmChain.Solana]
  }

  getSupportedTokens(_sourceChain: Chain, _destChain: Chain): Currency[] {
    return []
  }

  async getQuote(_params: EvmQuoteParams): Promise<NormalizedQuote> {
    throw new Error('Mayan quotes must come from the aggregator stream')
  }

  async executeSwap(
    { quote }: Quote,
    walletClient: WalletClient,
    _nearWalletClient?: any,
    _sendBtcFn?: (params: { recipient: string; amount: string | number }) => Promise<string>,
    _sendTransaction?: WalletAdapterProps['sendTransaction'],
    connection?: Connection,
  ): Promise<NormalizedTxResponse> {
    if (quote.quoteParams.fromChain === NonEvmChain.Solana) {
      const rawQuote = parseMayanQuote(quote.rawQuote)
      if (!connection) throw new Error('Connection is not defined for Solana swap')

      if (!hasSolanaSigner(walletClient)) throw new Error('Wallet does not support signTransaction')
      const { signTransaction } = walletClient

      // Direct bridge input is built locally by the SDK using the aggregator quote.
      // When source-swap instructions are missing, retain the original SDK/API build path.
      // Call once: this function also signs/submits, so retrying it could duplicate a swap.
      const swapRes = await swapFromSolana(
        rawQuote,
        quote.quoteParams.sender,
        quote.quoteParams.recipient,
        {
          evm: CROSS_CHAIN_FEE_RECEIVER,
          solana: CROSS_CHAIN_FEE_RECEIVER_SOLANA,
          sui: CROSS_CHAIN_FEE_RECEIVER_SUI,
        },
        signTransaction,
        connection,
        [],
        { skipPreflight: true },
      )
      if (!swapRes.signature) {
        throw new Error('Failed to send transaction to Solana')
      }

      const signature = swapRes.signature

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
    if (typeof quote.quoteParams.fromChain !== 'number') throw new Error('Unsupported Mayan source chain')

    const rawQuote = quote.rawQuote
    const streamedTx = rawQuote && typeof rawQuote === 'object' && 'tx' in rawQuote ? rawQuote.tx : undefined
    // Use a complete aggregator transaction when supplied, as with Symbiosis.
    // Otherwise compose the source swap from stream data and build only the bridge locally.
    const res =
      streamedTx != null
        ? streamedTransactionSchema.parse(streamedTx)
        : await buildEvmTransaction(
            parseMayanQuote(rawQuote),
            account,
            quote.quoteParams.recipient,
            {
              evm: CROSS_CHAIN_FEE_RECEIVER,
              solana: CROSS_CHAIN_FEE_RECEIVER_SOLANA,
              sui: CROSS_CHAIN_FEE_RECEIVER_SUI,
            },
            quote.quoteParams.fromChain,
          )

    if (res.chainId !== undefined && Number(res.chainId) !== quote.quoteParams.fromChain) {
      throw new Error('Mayan transaction chain does not match the quote. Please refresh the quote.')
    }

    if (res.to && res.value != null && res.data) {
      const tx = await walletClient.sendTransaction({
        chain: undefined,
        account,
        to: res.to as `0x${string}`,
        value: BigInt(res.value),
        data: res.data as `0x${string}`,
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
        amountInUsd: quote.inputUsd,
        amountOutUsd: quote.outputUsd,
        platformFeePercent: quote.platformFeePercent,
        recipient: quote.quoteParams.recipient,
      }
    }

    throw new Error('Can not get Mayan data to swap')
  }

  async getTransactionStatus(p: NormalizedTxResponse): Promise<SwapStatus> {
    const res = await fetch(`https://explorer-api.mayan.finance/v3/swap/trx/${p.id}`).then(r => r.json())

    // Convert formatted toAmount back to raw amount using target token decimals
    // Mayan returns human-readable amounts like "0.020115767"
    let actualAmountOut: string | undefined
    if (res.toAmount) {
      try {
        actualAmountOut = parseUnits(res.toAmount, p.targetToken.decimals).toString()
      } catch {
        // If conversion fails, leave as undefined
      }
    }

    if (res.statusCode === 404) {
      const publicClient = getPublicClient(wagmiConfig, {
        chainId: p.sourceChain as number,
      })
      const receipt = await publicClient?.getTransactionReceipt({
        hash: p.sourceTxHash as `0x${string}`,
      })
      if (receipt?.status === 'reverted') {
        return {
          txHash: '',
          status: 'Failed',
        }
      }
    }

    return {
      txHash: res.fulfillTxHash || '',
      status:
        res.clientStatus === 'COMPLETED' || res.status === 'ORDER_SETTLED' || res.status === 'ORDER_UNLOCKED'
          ? 'Success'
          : res.status === 'ORDER_REFUNDED'
          ? 'Refunded'
          : res.status === 'ORDER_CANCELED'
          ? 'Failed'
          : 'Processing',
      amountOut: actualAmountOut,
    }
  }
}
