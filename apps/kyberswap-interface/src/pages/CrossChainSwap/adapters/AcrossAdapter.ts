import { arbitrum, mainnet, optimism } from 'viem/chains'
import {
  BaseSwapAdapter,
  Chain,
  Token,
  QuoteParams,
  NormalizedQuote,
  NormalizedTxResponse,
  SwapStatus,
} from './BaseSwapAdapter'
import { createAcrossClient, AcrossClient } from '@across-protocol/app-sdk'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { WalletClient, formatUnits } from 'viem'
import { TOKEN_API_URL } from 'constants/env'
import { Quote } from '../registry'

function to2ByteHexFromString(input: string): string {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(input)

  // Take first 2 bytes
  const view = bytes.slice(0, 2)
  return Array.from(view)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
export class AcrossAdapter extends BaseSwapAdapter {
  private acrossClient: AcrossClient

  constructor() {
    super()
    this.acrossClient = createAcrossClient({
      integratorId: `0x${to2ByteHexFromString('kyberswap')}`,
      // TODO: add more chains here
      chains: [mainnet, arbitrum, optimism],
    })
  }

  getName(): string {
    return 'Across'
  }
  getIcon(): string {
    return 'https://across.to/favicon.ico'
  }
  getSupportedChains(): Chain[] {
    // TODO: handle supported chains
    return [ChainId.MAINNET, ChainId.ARBITRUM, ChainId.OPTIMISM]
  }

  getSupportedTokens(_sourceChain: Chain, _destChain: Chain): Token[] {
    return []
  }

  async getQuote(params: QuoteParams): Promise<NormalizedQuote> {
    const resp = await this.acrossClient.getQuote({
      route: {
        originChainId: +params.fromChain,
        destinationChainId: +params.toChain,
        inputToken: params.fromToken.address as `0x${string}`,
        outputToken: params.toToken.address as `0x${string}`,
      },
      inputAmount: params.amount,
    })
    // across api doesnt return usd value -> call onchain price to calculate
    const r: {
      data: {
        [chainId: string]: {
          [address: string]: { PriceBuy: number; PriceSell: number }
        }
      }
    } = await fetch(`${TOKEN_API_URL}/v1/public/tokens/prices`, {
      method: 'POST',
      body: JSON.stringify({
        [params.fromChain]: [params.fromToken.address],
        [params.toChain]: [params.toToken.address],
      }),
    }).then(r => r.json())
    const tokenInUsd = r?.data?.[params.fromChain]?.[params.fromToken.address]?.PriceBuy || 0
    const tokenOutUsd = r?.data?.[params.toChain]?.[params.toToken.address]?.PriceBuy || 0
    const formattedOutputAmount = formatUnits(BigInt(resp.deposit.outputAmount), params.toToken.decimals)
    const formattedInputAmount = formatUnits(BigInt(params.amount), params.fromToken.decimals)
    const inputUsd = tokenInUsd * +formattedInputAmount
    const outputUsd = tokenOutUsd * +formattedOutputAmount

    return {
      outputAmount: BigInt(resp.deposit.outputAmount),
      formattedOutputAmount,
      inputUsd: tokenInUsd * +formatUnits(BigInt(params.amount), params.fromToken.decimals),
      outputUsd: tokenOutUsd * +formattedOutputAmount,
      rate: +formattedOutputAmount / +formattedInputAmount,
      timeEstimate: resp.estimatedFillTimeSec,
      priceImpact: (Math.abs(outputUsd - inputUsd) * 100) / inputUsd,
      // TODO: what is gas fee for across
      gasFeeUsd: 0,
      contractAddress: resp.deposit.spokePoolAddress,
      rawQuote: resp,
    }
  }

  async executeSwap(quote: Quote, walletClient: WalletClient): Promise<NormalizedTxResponse> {
    return new Promise<NormalizedTxResponse>((resolve, reject) => {
      this.acrossClient
        .executeQuote({
          walletClient: walletClient as any,
          deposit: quote.quote.rawQuote.deposit,
          onProgress: progress => {
            if (progress.step === 'deposit' && 'txHash' in progress) {
              resolve({
                sourceTxHash: progress.txHash,
                adapter: this.getName(),
                id: progress.txHash,
              })
            }
          },
        })
        .catch(reject)
    })
  }
  getTransactionStatus(params: NormalizedTxResponse): Promise<SwapStatus> {
    console.log(params)
    return Promise.resolve({})
  }
}
