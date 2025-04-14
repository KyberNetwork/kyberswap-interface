import { ChainId } from '@kyberswap/ks-sdk-core'
import {
  BaseSwapAdapter,
  Chain,
  Token,
  QuoteParams,
  NormalizedQuote,
  NormalizedTxResponse,
  SwapStatus,
} from './BaseSwapAdapter'
import { MAINNET_RELAY_API, getClient, createClient } from '@reservoir0x/relay-sdk'
import { WalletClient, formatUnits } from 'viem'
import { ZERO_ADDRESS } from 'constants/index'
import { Quote } from '../registry'

export class RelayAdapter extends BaseSwapAdapter {
  constructor() {
    super()
    createClient({
      baseApiUrl: MAINNET_RELAY_API,
      source: 'kyberswap',
    })
  }

  getName(): string {
    return 'Relay'
  }
  getIcon(): string {
    return 'https://relay.link/favicon.ico'
  }
  getSupportedChains(): Chain[] {
    // TODO: handle supported chains
    return [ChainId.MAINNET, ChainId.ARBITRUM, ChainId.OPTIMISM]
  }

  getSupportedTokens(_sourceChain: Chain, _destChain: Chain): Token[] {
    return []
  }

  async getQuote(params: QuoteParams): Promise<NormalizedQuote> {
    const resp = await getClient().actions.getQuote({
      chainId: +params.fromChain,
      toChainId: +params.toChain,
      currency: params.fromToken.address,
      toCurrency: params.toToken.address,
      amount: params.amount,
      tradeType: 'EXACT_INPUT',
      wallet: params.walletClient,
      // options: {
      //   appFees: [
      //     {
      //       // TODO: add app fee
      //       recipient: '0xDcFCD5dD752492b95ac8C1964C83F992e7e39FA9',
      //       fee: '100',
      //     },
      //   ],
      // },
    })
    return {
      outputAmount: BigInt(resp.details?.currencyOut?.amount || '0'),
      formattedOutputAmount: formatUnits(BigInt(resp.details?.currencyOut?.amount || '0'), params.toToken.decimals),
      inputUsd: Number(resp.details?.currencyIn?.amountUsd || 0),
      outputUsd: Number(resp.details?.currencyOut?.amountUsd || 0),
      priceImpact: Number(resp.details?.totalImpact?.percent || 0),
      rate: Number(resp.details?.rate || 0),
      gasFeeUsd: Number(resp.fees?.gas?.amountUsd || 0),
      timeEstimate: resp.details?.timeEstimate || 0,
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
                })
              }
            }
          },
        })
        .catch(reject) // Make sure errors from execute are also caught
    })
  }

  getTransactionStatus(p: NormalizedTxResponse): Promise<SwapStatus> {
    console.log(p)
    return Promise.resolve({})
  }
}
