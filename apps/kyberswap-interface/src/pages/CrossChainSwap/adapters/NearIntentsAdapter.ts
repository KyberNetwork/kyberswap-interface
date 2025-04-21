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
import { WalletClient, formatUnits } from 'viem'
import { ZERO_ADDRESS } from 'constants/index'
import { Quote } from '../registry'
import { OneClickService, OpenAPI, QuoteRequest } from '@defuse-protocol/one-click-sdk-typescript'

export const MappingChainIdToBlockChain: Record<number, string> = {
  [ChainId.MAINNET]: 'eth',
  [ChainId.ARBITRUM]: 'arb',
  [ChainId.BSCMAINNET]: 'bsc',
  [ChainId.BERA]: 'bera',
  [ChainId.MATIC]: 'pol',
  [ChainId.BASE]: 'base',
}

const erc20Abi = [
  {
    inputs: [
      { type: 'address', name: 'recipient' },
      { type: 'uint256', name: 'amount' },
    ],
    name: 'transfer',
    outputs: [{ type: 'bool', name: '' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

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
    return [NonEvmChain.Near, ...Object.keys(MappingChainIdToBlockChain).map(Number)]
  }

  getSupportedTokens(_sourceChain: Chain, _destChain: Chain): Currency[] {
    return []
  }

  async getQuote(params: NearQuoteParams): Promise<NormalizedQuote> {
    const deadline = new Date()
    deadline.setSeconds(deadline.getSeconds() + 60 * 20)

    const fromAssetId =
      'assetId' in params.fromToken
        ? params.fromToken.assetId
        : params.nearTokens.find(token => {
            const blockchain = MappingChainIdToBlockChain[params.fromChain as ChainId]
            return (
              token.blockchain === blockchain &&
              ((params.fromToken as any).isNative
                ? token.symbol.toLowerCase() === params.fromToken.symbol?.toLowerCase()
                : token.contractAddress?.toLowerCase() === (params.fromToken as any).wrapped?.address.toLowerCase())
            )
          })?.assetId

    const toAssetId =
      'assetId' in params.fromToken
        ? params.fromToken.assetId
        : params.nearTokens.find(token => {
            const blockchain = MappingChainIdToBlockChain[params.toChain as ChainId]
            return (
              token.blockchain === blockchain &&
              ((params.toToken as any).isNative
                ? token.symbol.toLowerCase() === params.toToken.symbol?.toLowerCase()
                : token.contractAddress?.toLowerCase() === (params.toToken as any).wrapped?.address.toLowerCase())
            )
          })?.assetId

    if (!fromAssetId || !toAssetId) {
      throw new Error('not supported tokens')
    }

    // Create a quote request
    const quoteRequest: QuoteRequest = {
      dry: false,
      deadline: deadline.toISOString(),
      slippageTolerance: params.slippage,
      swapType: QuoteRequest.swapType.EXACT_INPUT,

      originAsset: fromAssetId,
      depositType: QuoteRequest.depositType.ORIGIN_CHAIN,

      destinationAsset: toAssetId,
      amount: params.amount,

      refundTo: params.sender || ZERO_ADDRESS,
      refundType: QuoteRequest.refundType.ORIGIN_CHAIN,

      recipient: params.recipient || ZERO_ADDRESS,
      recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
    }

    const quote = await OneClickService.getQuote(quoteRequest)
    const formattedInputAmount = formatUnits(BigInt(params.amount), params.fromToken.decimals)
    const formattedOutputAmount = formatUnits(BigInt(quote.quote.amountOut), params.toToken.decimals)
    const inputUsd = +quote.quote.amountInUsd
    const outputUsd = +quote.quote.amountOutUsd

    return {
      quoteParams: params,
      outputAmount: BigInt(quote.quote.amountOut),
      formattedOutputAmount,
      inputUsd: +quote.quote.amountInUsd,
      outputUsd: +quote.quote.amountOutUsd,
      priceImpact: (Math.abs(outputUsd - inputUsd) * 100) / inputUsd,
      rate: +formattedOutputAmount / +formattedInputAmount,
      gasFeeUsd: 0,
      timeEstimate: quote.quote.timeEstimate || 0,
      // Near intent dont need to approve, we send token to contract directly
      contractAddress: ZERO_ADDRESS,
      rawQuote: quote,
    }
  }

  async executeSwap(quote: Quote, walletClient: WalletClient): Promise<NormalizedTxResponse> {
    return new Promise<NormalizedTxResponse>(async (resolve, reject) => {
      if (!walletClient || !walletClient.account) reject()
      if (quote.quote.quoteParams.sender === ZERO_ADDRESS || quote.quote.quoteParams.recipient === ZERO_ADDRESS)
        reject('Near Intent refundTo or recipient is ZERO ADDRESS')

      const account = walletClient.account?.address as `0x${string}`

      const fromToken = quote.quote.quoteParams.fromToken

      const hash = await walletClient.writeContract({
        address: ('contractAddress' in fromToken
          ? fromToken.contractAddress
          : fromToken.wrapped.address) as `0x${string}`,
        abi: erc20Abi,
        functionName: 'transfer',
        chain: undefined,
        args: [quote.quote.rawQuote.quote.depositAddress, quote.quote.quoteParams.amount],
        account,
      })
      await OneClickService.submitDepositTx({
        txHash: hash,
        depositAddress: quote.quote.rawQuote.quote.depositAddress,
      })

      resolve({
        id: quote.quote.rawQuote.quote.depositAddress, // specific id for each provider
        sourceTxHash: hash,
        adapter: this.getName(),
        sourceChain: quote.quote.quoteParams.fromChain,
        targetChain: quote.quote.quoteParams.toChain,
        inputAmount: quote.quote.quoteParams.amount,
        outputAmount: quote.quote.outputAmount.toString(),
        sourceToken: quote.quote.quoteParams.fromToken,
        targetToken: quote.quote.quoteParams.toToken,
        timestamp: new Date().getTime(),
      })
    })
  }

  async getTransactionStatus(p: NormalizedTxResponse): Promise<SwapStatus> {
    const res = await OneClickService.getExecutionStatus(p.id)

    return {
      txHash: res.swapDetails?.destinationChainTxHashes[0]?.hash || '',
      // TODO: Handle Refund status
      status: res.status === 'SUCCESS' ? 'filled' : 'pending',
    }
  }
}
