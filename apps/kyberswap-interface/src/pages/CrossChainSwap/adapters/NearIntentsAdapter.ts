import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import {
  BaseSwapAdapter,
  Chain,
  NormalizedQuote,
  NormalizedTxResponse,
  SwapStatus,
  NonEvmChain,
  NearQuoteParams,
} from './BaseSwapAdapter'
import { MAINNET_RELAY_API, getClient, createClient } from '@reservoir0x/relay-sdk'
import { WalletClient, formatUnits } from 'viem'
import { ZERO_ADDRESS } from 'constants/index'
import { Quote } from '../registry'
import { OneClickService, OpenAPI, QuoteRequest } from '@defuse-protocol/one-click-sdk-typescript'

export const MappingChainIdToBlockChain = {
  [ChainId.ARBITRUM]: 'arb',
  [ChainId.MAINNET]: 'eth',
}

export class NearIntentsAdapter extends BaseSwapAdapter {
  constructor() {
    super()
    // Initialize the API client
    OpenAPI.BASE = 'https://1click.chaindefuser.com'
  }

  getName(): string {
    return 'Near Intents'
  }
  getIcon(): string {
    return 'https://storage.googleapis.com/ks-setting-1d682dca/000c677f-2ebc-44cc-8d76-e4c6d07627631744962669170.png'
  }
  getSupportedChains(): Chain[] {
    // TODO: handle supported chains
    return [ChainId.MAINNET, ChainId.ARBITRUM, ChainId.OPTIMISM, NonEvmChain.Near]
  }

  getSupportedTokens(_sourceChain: Chain, _destChain: Chain): Currency[] {
    return []
  }

  async getQuote(params: NearQuoteParams): Promise<NormalizedQuote> {
    console.log(params)
    // Create a quote request
    const quoteRequest: QuoteRequest = {
      //dry: true,
      slippageTolerance: params.slippage,
      swapType: QuoteRequest.swapType.EXACT_INPUT,

      originAsset: 'nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near',
      depositType: QuoteRequest.depositType.ORIGIN_CHAIN,

      destinationAsset: 'nep141:sol-5ce3bf3a31af18be40ba30f721101b4341690186.omft.near',
      amount: params.amount,

      refundTo: '0x2527D02599Ba641c19FEa793cD0F167589a0f10D',
      refundType: QuoteRequest.refundType.ORIGIN_CHAIN,
      recipient: '13QkxhNMrTPxoCkRdYdJ65tFuwXPhL5gLS2Z5Nr6gjRK',
      recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
    }

    return {
      quoteParams: params,
      outputAmount: BigInt('0'),
      formattedOutputAmount: formatUnits(BigInt('0'), params.toToken.decimals),
      inputUsd: 0,
      outputUsd: 0,
      priceImpact: 0,
      rate: 0,
      gasFeeUsd: 0,
      timeEstimate: 0,
      // Relay dont need to approve, we send token to contract directly
      contractAddress: ZERO_ADDRESS,
      rawQuote: null,
    }
  }

  async executeSwap(quote: Quote, walletClient: WalletClient): Promise<NormalizedTxResponse> {
    return new Promise<NormalizedTxResponse>((resolve, reject) => {
      getClient()
        .actions.execute({
          quote: quote.quote.rawQuote,
          wallet: walletClient,
          onProgress: ({ currentStep }) => {
            if (currentStep?.id === 'deposit' && currentStep.requestId && currentStep.kind === 'transaction') {
              const txHash = currentStep.items?.[0]?.txHashes?.[0].txHash
              if (txHash) {
                resolve({
                  sourceTxHash: txHash,
                  adapter: this.getName(),
                  id: currentStep.requestId,
                  sourceChain: quote.quote.quoteParams.fromChain,
                  targetChain: quote.quote.quoteParams.toChain,
                  inputAmount: quote.quote.quoteParams.amount,
                  outputAmount: quote.quote.outputAmount.toString(),
                  sourceToken: quote.quote.quoteParams.fromToken,
                  targetToken: quote.quote.quoteParams.toToken,
                  timestamp: new Date().getTime(),
                })
              }
            }
          },
        })
        .catch(reject) // Make sure errors from execute are also caught
    })
  }

  async getTransactionStatus(p: NormalizedTxResponse): Promise<SwapStatus> {
    const res = await fetch(`https://api.relay.link/intents/status/v2?requestId=${p.id}`).then(r => r.json())

    return {
      txHash: res.txHashes?.[0] || '',
      status: res.status === 'success' ? 'filled' : res.status || 'pending',
    }
  }
}
