import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { fetchQuote, getSwapFromEvmTxPayload, Quote as MayanQuote, ChainName, addresses } from '@mayanfinance/swap-sdk'
import {
  BaseSwapAdapter,
  Chain,
  NormalizedQuote,
  NormalizedTxResponse,
  SwapStatus,
  EvmQuoteParams,
} from './BaseSwapAdapter'
import { WalletClient, formatUnits, parseUnits } from 'viem'
import { CROSS_CHAIN_FEE_RECEIVER, ZERO_ADDRESS } from 'constants/index'
import { Quote } from '../registry'

const mappingChain: Record<string, ChainName> = {
  [ChainId.MAINNET]: 'ethereum',
  [ChainId.BSCMAINNET]: 'bsc',
  [ChainId.MATIC]: 'polygon',
  [ChainId.AVAXMAINNET]: 'avalanche',
  [ChainId.ARBITRUM]: 'arbitrum',
  [ChainId.OPTIMISM]: 'optimism',
  [ChainId.BASE]: 'base',
  [ChainId.LINEA]: 'linea',
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
    return [...Object.keys(mappingChain).map(Number)]
  }

  getSupportedTokens(_sourceChain: Chain, _destChain: Chain): Currency[] {
    return []
  }

  async getQuote(params: EvmQuoteParams): Promise<NormalizedQuote> {
    const quotes = await fetchQuote({
      amount: +formatUnits(BigInt(params.amount), params.fromToken.decimals),
      fromToken: params.fromToken.isNative ? ZERO_ADDRESS : params.fromToken.wrapped.address,
      toToken: params.toToken.isNative ? ZERO_ADDRESS : params.toToken.wrapped.address,
      fromChain: mappingChain[params.fromChain],
      toChain: mappingChain[params.toChain],
      slippageBps: params.slippage,
      referrer: CROSS_CHAIN_FEE_RECEIVER,
      referrerBps: params.feeBps,
    })
    if (!quotes?.[0]) {
      throw new Error('No quotes found')
    }

    const formattedInputAmount = formatUnits(BigInt(params.amount), params.fromToken.decimals)

    const tokenInUsd = params.tokenInUsd
    const tokenOutUsd = params.tokenOutUsd
    const inputUsd = tokenInUsd * +formattedInputAmount
    const outputUsd = tokenOutUsd * quotes[0].expectedAmountOut

    return {
      quoteParams: params,

      outputAmount: parseUnits(quotes[0].expectedAmountOut.toString(), params.toToken.decimals),

      formattedOutputAmount: quotes[0].expectedAmountOut.toString(),

      inputUsd,
      outputUsd,
      priceImpact: (Math.abs(outputUsd - inputUsd) * 100) / inputUsd,
      rate: quotes[0].expectedAmountOut / +formattedInputAmount,
      gasFeeUsd: 0,

      timeEstimate: quotes[0].etaSeconds,
      contractAddress: addresses.MAYAN_FORWARDER_CONTRACT,
      rawQuote: quotes[0],

      protocolFee: 0,
      platformFeePercent: (params.feeBps * 100) / 10_000,
    }
  }

  async executeSwap({ quote }: Quote, walletClient: WalletClient): Promise<NormalizedTxResponse> {
    const account = walletClient.account?.address
    if (!account) throw new Error('WalletClient account is not defined')

    const res = getSwapFromEvmTxPayload(
      quote.rawQuote as MayanQuote,
      account,
      quote.quoteParams.recipient,
      null,
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

    throw new Error('Can not get Mayan data to swap')
  }

  async getTransactionStatus(p: NormalizedTxResponse): Promise<SwapStatus> {
    const res = await fetch(`https://explorer-api.mayan.finance/v3/swap/trx/${p.id}`).then(r => r.json())

    return {
      txHash: res.fulfillTxHash || '',
      status: res.status === 'ORDER_SETTLED' ? 'Success' : 'Processing',
    }
  }
}
