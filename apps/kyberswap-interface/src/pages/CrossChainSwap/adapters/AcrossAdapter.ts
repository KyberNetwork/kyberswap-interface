import { arbitrum, mainnet, optimism } from 'viem/chains'
import {
  BaseSwapAdapter,
  Chain,
  NormalizedQuote,
  NormalizedTxResponse,
  SwapStatus,
  EvmQuoteParams,
} from './BaseSwapAdapter'
import { createAcrossClient, AcrossClient } from '@across-protocol/app-sdk'
import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
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
    return [
      ChainId.MAINNET,
      ChainId.ARBITRUM,
      ChainId.OPTIMISM,
      ChainId.LINEA,
      ChainId.MATIC,
      ChainId.ZKSYNC,
      ChainId.BASE,
      ChainId.SCROLL,
      ChainId.BLAST,
    ]
  }

  getSupportedTokens(_sourceChain: Chain, _destChain: Chain): Currency[] {
    return []
  }

  async getQuote(params: EvmQuoteParams): Promise<NormalizedQuote> {
    const resp = await this.acrossClient.getQuote({
      route: {
        originChainId: +params.fromChain,
        destinationChainId: +params.toChain,
        inputToken: params.fromToken.wrapped.address as `0x${string}`,
        outputToken: params.toToken.wrapped.address as `0x${string}`,
        isNative: params.fromToken.isNative,
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
        [params.fromChain]: [params.fromToken.wrapped.address],
        [params.toChain]: [params.toToken.wrapped.address],
      }),
    }).then(r => r.json())
    const tokenInUsd = r?.data?.[params.fromChain]?.[params.fromToken.wrapped.address]?.PriceBuy || 0
    const tokenOutUsd = r?.data?.[params.toChain]?.[params.toToken.wrapped.address]?.PriceBuy || 0
    const formattedOutputAmount = formatUnits(BigInt(resp.deposit.outputAmount), params.toToken.decimals)
    const formattedInputAmount = formatUnits(BigInt(params.amount), params.fromToken.decimals)
    const inputUsd = tokenInUsd * +formattedInputAmount
    const outputUsd = tokenOutUsd * +formattedOutputAmount

    return {
      quoteParams: params,
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
                sourceChain: quote.quote.quoteParams.fromChain,
                targetChain: quote.quote.quoteParams.toChain,
                inputAmount: quote.quote.quoteParams.amount,
                outputAmount: quote.quote.outputAmount.toString(),
                sourceToken: quote.quote.quoteParams.fromToken,
                targetToken: quote.quote.quoteParams.toToken,
                timestamp: new Date().getTime(),
              })
            }
          },
        })
        .catch(reject)
    })
  }
  async getTransactionStatus(params: NormalizedTxResponse): Promise<SwapStatus> {
    const res = await this.acrossClient.getDeposit({
      findBy: {
        originChainId: +params.sourceChain,
        destinationChainId: +params.targetChain,
        depositTxHash: params.sourceTxHash as `0x${string}`,
      },
    })

    return {
      txHash: res.fillTxHash || '',
      status: res.status || 'pending',
    }
  }
}
