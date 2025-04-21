import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import {
  BaseSwapAdapter,
  Chain,
  NormalizedQuote,
  NormalizedTxResponse,
  SwapStatus,
  EvmQuoteParams,
} from './BaseSwapAdapter'
import { getClient } from '@reservoir0x/relay-sdk'
import { WalletClient, formatUnits } from 'viem'
import { ETHER_ADDRESS, ZERO_ADDRESS } from 'constants/index'
import { Quote } from '../registry'

const XY_FINANCE_API = 'https://aggregator-api.xy.finance/v1/'

export class XYFinanceAdapter extends BaseSwapAdapter {
  constructor() {
    super()
  }

  getName(): string {
    return 'XYFinance'
  }
  getIcon(): string {
    return 'https://xy.finance/img/favicon.ico'
  }
  getSupportedChains(): Chain[] {
    // TODO: handle supported chains
    return [ChainId.MAINNET, ChainId.ARBITRUM, ChainId.OPTIMISM]
  }

  getSupportedTokens(_sourceChain: Chain, _destChain: Chain): Currency[] {
    return []
  }

  async getQuote(params: EvmQuoteParams): Promise<NormalizedQuote> {
    const p = {
      srcChainId: params.fromChain,
      srcQuoteTokenAddress: params.fromToken.isNative ? ETHER_ADDRESS : params.fromToken.address,
      srcQuoteTokenAmount: params.amount,
      dstChainId: params.toChain,
      dstQuoteTokenAddress: params.toToken.isNative ? ETHER_ADDRESS : params.toToken.address,
      slippage: params.slippage,

      // TODO: add fee
      // affiliate: '',
      // Commission rate of affiliate, denominator is 1000000. Affiliate must be provided when passing commissionRate.
      // commissionRate
    }
    // Convert the parameters object to URL query string
    const queryParams = new URLSearchParams()
    for (const [key, value] of Object.entries(p)) {
      queryParams.append(key, String(value))
    }
    const resp = await fetch(`${XY_FINANCE_API}/quote?${queryParams.toString()}`)
    console.log('xy finance quote', resp)

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
      rawQuote: resp,
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
