import { Currency } from '@kyberswap/ks-sdk-core'
import {
  BaseSwapAdapter,
  Chain,
  NormalizedQuote,
  NormalizedTxResponse,
  SwapStatus,
  EvmQuoteParams,
} from './BaseSwapAdapter'
import { WalletClient, formatUnits } from 'viem'
import { ETHER_ADDRESS, ZERO_ADDRESS } from 'constants/index'
import { Quote } from '../registry'
import { MAINNET_NETWORKS } from 'constants/networks'

import { getStatus, createConfig, getQuote } from '@lifi/sdk'

export class LifiAdapter extends BaseSwapAdapter {
  constructor() {
    super()
    createConfig({
      integrator: 'KyberSwap',
    })
  }

  getName(): string {
    return 'LIFI'
  }
  getIcon(): string {
    return 'https://storage.googleapis.com/ks-setting-1d682dca/aed3a971-48be-4c3c-9597-5ab78073fbf11745552578218.png'
  }
  getSupportedChains(): Chain[] {
    return [...MAINNET_NETWORKS]
  }

  getSupportedTokens(_sourceChain: Chain, _destChain: Chain): Currency[] {
    return []
  }

  async getQuote(params: EvmQuoteParams): Promise<NormalizedQuote> {
    //const routesRequest: RoutesRequest = {
    //  fromChainId: +params.fromChain, // Arbitrum
    //  toChainId: +params.toChain, // Optimism
    //  fromTokenAddress: params.fromToken.isNative ? ZERO_ADDRESS : params.fromToken.wrapped.address,
    //  toTokenAddress: params.toToken.isNative ? ZERO_ADDRESS : params.toToken.wrapped.address,
    //  fromAmount: params.amount,
    //}
    //
    //const result = await getRoutes(routesRequest)
    //
    //const routes = result.routes
    const r = await getQuote({
      fromChain: +params.fromChain, // Arbitrum
      fromToken: params.fromToken.isNative ? ZERO_ADDRESS : params.fromToken.wrapped.address,
      fromAmount: params.amount,
      fromAddress: params.sender || ETHER_ADDRESS,

      toChain: +params.toChain, // Optimism
      toToken: params.toToken.isNative ? ZERO_ADDRESS : params.toToken.wrapped.address,
      toAddress: params.recipient,
    })

    const inputUsd = Number(r.estimate.fromAmountUSD || '0')
    const outputUsd = Number(r.estimate.toAmountUSD || '0')
    const formattedOutputAmount = formatUnits(BigInt(r.estimate.toAmount), params.toToken.decimals)

    const formattedInputAmount = formatUnits(BigInt(params.amount), params.fromToken.decimals)

    return {
      quoteParams: params,
      outputAmount: BigInt(r.estimate.toAmount),
      formattedOutputAmount: formatUnits(BigInt(r.estimate.toAmount), params.toToken.decimals),
      inputUsd,
      outputUsd,

      priceImpact: Math.abs(outputUsd - inputUsd) / inputUsd,
      rate: +formattedOutputAmount / +formattedInputAmount,

      gasFeeUsd: 0,

      timeEstimate: r.estimate.executionDuration,
      contractAddress: r.transactionRequest?.to || r.estimate.approvalAddress,
      rawQuote: r,
    }
  }

  async executeSwap({ quote }: Quote, walletClient: WalletClient): Promise<NormalizedTxResponse> {
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
      fromChain: +p.sourceChain,
      toChain: +p.targetChain,
      txHash: p.sourceTxHash,
    })

    return {
      txHash: (res as any)?.receiving?.txHash || '',
      status: res.status === 'DONE' ? 'filled' : 'pending',
    }
  }
}
