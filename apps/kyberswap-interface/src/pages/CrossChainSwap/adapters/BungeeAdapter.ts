import { Currency } from '@kyberswap/ks-sdk-core'
import { WalletClient, formatUnits } from 'viem'

import { CROSS_CHAIN_FEE_RECEIVER, ETHER_ADDRESS } from 'constants/index'
import { MAINNET_NETWORKS } from 'constants/networks'

import { Quote } from '../registry'
import {
  BaseSwapAdapter,
  Chain,
  EvmQuoteParams,
  NOT_SUPPORTED_CHAINS_PRICE_SERVICE,
  NormalizedQuote,
  NormalizedTxResponse,
  SwapStatus,
} from './BaseSwapAdapter'

const BUNGEE_API_BASE_URL = 'https://public-backend.bungee.exchange'
enum RequestStatusEnum {
  PENDING = 0,
  ASSIGNED = 1,
  EXTRACTED = 2,
  FULFILLED = 3,
  SETTLED = 4,
  EXPIRED = 5,
  CANCELLED = 6,
  REFUND_PENDING = 7,
  REFUNDED = 8,
}

export class BungeeAdapter extends BaseSwapAdapter {
  constructor() {
    super()
  }

  getName(): string {
    return 'Bungee'
  }
  getIcon(): string {
    return 'https://www.bungee.exchange/favicon.ico'
  }
  getSupportedChains(): Chain[] {
    return [...MAINNET_NETWORKS]
  }

  getSupportedTokens(_sourceChain: Chain, _destChain: Chain): Currency[] {
    return []
  }

  async getQuote(params: EvmQuoteParams): Promise<NormalizedQuote> {
    const quoteParams = {
      userAddress: params.sender,
      originChainId: params.fromChain.toString(),
      destinationChainId: params.toChain.toString(),
      inputToken: params.fromToken.isNative ? ETHER_ADDRESS : params.fromToken.wrapped.address,
      inputAmount: params.amount,
      receiverAddress: params.recipient,
      outputToken: params.toToken.isNative ? ETHER_ADDRESS : params.toToken.wrapped.address,
      slippage: params.slippage.toString(),
      // delegateAddress: params.sender // optional

      feeBps: params.feeBps.toString(),
      feeTakerAddress: CROSS_CHAIN_FEE_RECEIVER,
      // useInbox: 'true', // using approval flow instead of permit 2
    }
    // Build the URL with query parameters
    const url = `${BUNGEE_API_BASE_URL}/api/v1/bungee/quote`
    const queryParams = new URLSearchParams(quoteParams)
    const fullUrl = `${url}?${queryParams}`

    // Make the request
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    const serverReqId = response.headers.get('server-req-id')

    if (!data.success || !data?.result?.autoRoute) {
      throw new Error(`Quote error: ${data.statusCode}: ${data.message}. server-req-id: ${serverReqId}`)
    }

    const { autoRoute } = data.result

    const formattedInputAmount = formatUnits(BigInt(params.amount), params.fromToken.decimals)
    const formattedOutputAmount = formatUnits(BigInt(autoRoute.output.amount), params.toToken.decimals)
    const inputUsd = NOT_SUPPORTED_CHAINS_PRICE_SERVICE.includes(params.fromChain)
      ? Number(data.result.input.valueInUsd)
      : params.tokenInUsd * +formattedInputAmount
    const outputUsd = NOT_SUPPORTED_CHAINS_PRICE_SERVICE.includes(params.toChain)
      ? Number(autoRoute.output.valueInUsd)
      : params.tokenOutUsd * +formattedOutputAmount

    return {
      quoteParams: params,
      outputAmount: 1n,
      formattedOutputAmount,
      inputUsd,
      outputUsd,
      priceImpact: !inputUsd || !outputUsd ? NaN : ((inputUsd - outputUsd) * 100) / inputUsd,
      rate: +formattedOutputAmount / +formattedInputAmount,
      gasFeeUsd: autoRoute.gasFee.feeInUsd,
      timeEstimate: autoRoute.estimatedTime,
      contractAddress: autoRoute.txData.to,
      rawQuote: data.result,
      protocolFee: 0,
      platformFeePercent: (params.feeBps * 100) / 10000,
    }
  }

  async executeSwap({ quote }: Quote, walletClient: WalletClient): Promise<NormalizedTxResponse> {
    const params = {
      id: quote.rawQuote.autoRoute.requestHash,
      sender: quote.quoteParams.sender,
      adapter: this.getName(),
      sourceChain: quote.quoteParams.fromChain,
      targetChain: quote.quoteParams.toChain,
      inputAmount: quote.quoteParams.amount,
      outputAmount: quote.outputAmount.toString(),
      sourceToken: quote.quoteParams.fromToken,
      targetToken: quote.quoteParams.toToken,
      timestamp: new Date().getTime(),
    }

    const account = walletClient.account?.address
    if (!account) throw new Error('WalletClient account is not defined')
    const hash = await walletClient.sendTransaction({
      to: quote.rawQuote.autoRoute.txData.to,
      value: BigInt(quote.rawQuote.autoRoute.txData.value),
      data: quote.rawQuote.autoRoute.txData.data,
      chain: undefined,
      account,
    })

    return { ...params, sourceTxHash: hash }
  }
  async getTransactionStatus(params: NormalizedTxResponse): Promise<SwapStatus> {
    const response = await fetch(`${BUNGEE_API_BASE_URL}/api/v1/bungee/status?requestHash=${params.id}`)
    const data = await response.json()

    if (!data.success) {
      throw new Error(`Status error: ${data.error?.message || 'Unknown error'}`)
    }
    const res = data.result[0]
    return {
      txHash: res?.destinationData?.txHash || '',
      status:
        res.bungeeStatusCode === RequestStatusEnum.REFUNDED
          ? 'Refunded'
          : [RequestStatusEnum.EXPIRED, RequestStatusEnum.CANCELLED].includes(res.bungeeStatusCode)
          ? 'Failed'
          : res.bungeeStatusCode == RequestStatusEnum.FULFILLED
          ? 'Success'
          : 'Processing',
    }
  }
}
