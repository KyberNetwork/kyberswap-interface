import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import {
  ChainName,
  Quote as MayanQuote,
  type SolanaTransactionSigner,
  addresses,
  fetchQuote,
  getSwapFromEvmTxPayload,
  swapFromSolana,
} from '@mayanfinance/swap-sdk'
import { WalletAdapterProps } from '@solana/wallet-adapter-base'
import { Connection } from '@solana/web3.js'
import { WalletClient, formatUnits, parseUnits } from 'viem'

import {
  CROSS_CHAIN_FEE_RECEIVER,
  CROSS_CHAIN_FEE_RECEIVER_SOLANA,
  CROSS_CHAIN_FEE_RECEIVER_SUI,
  ZERO_ADDRESS,
} from 'constants/index'
import { SolanaToken } from 'state/crossChainSwap'

import { Quote } from '../registry'
import {
  BaseSwapAdapter,
  Chain,
  EvmQuoteParams,
  NonEvmChain,
  NormalizedQuote,
  NormalizedTxResponse,
  SwapStatus,
} from './BaseSwapAdapter'

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

  async getQuote(params: EvmQuoteParams): Promise<NormalizedQuote> {
    const quotes = await fetchQuote({
      amount: +formatUnits(BigInt(params.amount), params.fromToken.decimals),
      fromToken:
        params.fromChain === 'solana'
          ? (params.fromToken as unknown as SolanaToken).id
          : (params.fromToken as any).isNative
          ? ZERO_ADDRESS
          : (params.fromToken as any).wrapped.address,
      toToken:
        params.toChain === 'solana'
          ? (params.toToken as unknown as SolanaToken).id
          : (params.toToken as any).isNative
          ? ZERO_ADDRESS
          : (params.toToken as any).wrapped.address,
      fromChain: mappingChain[params.fromChain],
      toChain: mappingChain[params.toChain],
      slippageBps: params.slippage,
      referrer: CROSS_CHAIN_FEE_RECEIVER_SOLANA, // only for identifying where the quote request originated from
      referrerBps: params.feeBps,
    })
    if (!quotes?.[0]) {
      throw new Error('No quotes found')
    }

    const formattedInputAmount = formatUnits(BigInt(params.amount), params.fromToken.decimals)

    const tokenInUsd = params.tokenInUsd
    const tokenOutUsd = params.tokenOutUsd || (quotes[0] as any).toTokenPrice
    const inputUsd = tokenInUsd * +formattedInputAmount
    const outputUsd = tokenOutUsd * quotes[0].expectedAmountOut

    return {
      quoteParams: params,

      outputAmount: parseUnits(quotes[0].expectedAmountOut.toString(), params.toToken.decimals),

      formattedOutputAmount: quotes[0].expectedAmountOut.toString(),

      inputUsd,
      outputUsd,
      priceImpact: !inputUsd || !outputUsd ? NaN : ((inputUsd - outputUsd) * 100) / inputUsd,
      rate: quotes[0].expectedAmountOut / +formattedInputAmount,
      gasFeeUsd: 0,

      timeEstimate: quotes[0].etaSeconds,
      contractAddress: addresses.MAYAN_FORWARDER_CONTRACT,
      rawQuote: quotes[0],

      protocolFee: 0,
      platformFeePercent: (params.feeBps * 100) / 10_000,
    }
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
      if (!connection) throw new Error('Connection is not defined for Solana swap')

      if (!hasSolanaSigner(walletClient)) throw new Error('Wallet does not support signTransaction')
      const { signTransaction } = walletClient

      const swapRes = await swapFromSolana(
        quote.rawQuote,
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

    const res = getSwapFromEvmTxPayload(
      quote.rawQuote as MayanQuote,
      account,
      quote.quoteParams.recipient,
      {
        evm: CROSS_CHAIN_FEE_RECEIVER,
        solana: CROSS_CHAIN_FEE_RECEIVER_SOLANA,
        sui: CROSS_CHAIN_FEE_RECEIVER_SUI,
      },
      account,
      quote.quoteParams.fromChain,
      null,
      null,
    )

    if (res.to && res.value && res.data) {
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

    return {
      txHash: res.fulfillTxHash || '',
      status:
        res.status === 'ORDER_SETTLED'
          ? 'Success'
          : res.status === 'ORDER_REFUNDED'
          ? 'Refunded'
          : res.status === 'ORDER_CANCELED'
          ? 'Failed'
          : 'Processing',
    }
  }
}
