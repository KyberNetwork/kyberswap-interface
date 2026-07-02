import { WalletClient, formatUnits } from 'viem'

import {
  BUNGEE_AFFILIATE_ID,
  CROSS_CHAIN_FEE_RECEIVER,
  ETHER_ADDRESS,
  KYBERSWAP_DOMAIN,
  ZERO_ADDRESS,
} from 'constants/index'
import { MAINNET_NETWORKS } from 'constants/networks'

import { Quote } from '../registry'
import { isWrappedToken } from '../utils'
import {
  BaseSwapAdapter,
  Chain,
  Currency,
  EvmQuoteParams,
  NOT_SUPPORTED_CHAINS_PRICE_SERVICE,
  NormalizedQuote,
  NormalizedTxResponse,
  SwapStatus,
} from './BaseSwapAdapter'

const SOCKET_API_BASE_URL =
  typeof window !== 'undefined' && window.location?.hostname === KYBERSWAP_DOMAIN
    ? 'https://backend.socket.tech' // use whitelisted backend for kyberswap.com
    : 'https://public-backend.socket.tech' // use public backend for local development/testing

/** Reference: https://docs.socket.tech/integrate/migration-guide */
enum SocketStatusCode {
  COMPLETED = 'COMPLETED',
  SUCCESS = 'SUCCESS',
  FULFILLED = 'FULFILLED',
  SETTLED = 'SETTLED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

const getSocketTxRoute = (rawQuote: any) => {
  const routes = [rawQuote?.route, ...(rawQuote?.routes || [])].filter(Boolean)

  return (
    routes.find((item: any) => item.userOp === 'tx' && item.routeTags?.includes('SUGGESTED') && item.txData?.object) ||
    routes.find((item: any) => (!item.userOp || item.userOp === 'tx') && item.txData?.object)
  )
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

  canSupport(_category: string, tokenIn?: Currency, _tokenOut?: Currency): boolean {
    // Bungee only supports EVM tokens, so check if it has chainId
    if (!tokenIn || !('chainId' in tokenIn) || !tokenIn.chainId) return false

    const isWrappedTokenIn = isWrappedToken(tokenIn)

    if (isWrappedTokenIn) {
      console.warn(`Bungee does not support swap from wrapped token: ${tokenIn.symbol || 'unknown'}`)
      return false
    }

    return true
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
      slippage: ((params.slippage * 100) / 10_000).toString(),
      feeBps: params.feeBps.toString(),
      feeTakerAddress: CROSS_CHAIN_FEE_RECEIVER,
      userOps: 'tx',
    }

    // Build the URL with query parameters
    const url = `${SOCKET_API_BASE_URL}/v3/swap/quote`
    const queryParams = new URLSearchParams(quoteParams)
    const fullUrl = `${url}?${queryParams}`

    // Make the request
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        affiliate: BUNGEE_AFFILIATE_ID,
      },
    })

    const data = await response.json()
    const serverReqId = response.headers.get('server-req-id')

    const route = getSocketTxRoute(data?.result)

    if (!data.success || !route?.output?.amount) {
      throw new Error(`Quote error: ${data.statusCode}: ${data.message}. server-req-id: ${serverReqId}`)
    }

    const formattedInputAmount = formatUnits(BigInt(params.amount), params.fromToken.decimals)
    const formattedOutputAmount = formatUnits(BigInt(route.output.amount), params.toToken.decimals)
    const inputUsd = NOT_SUPPORTED_CHAINS_PRICE_SERVICE.includes(params.fromChain)
      ? Number(data.result.input.valueInUsd)
      : params.tokenInUsd * +formattedInputAmount
    const outputUsd = NOT_SUPPORTED_CHAINS_PRICE_SERVICE.includes(params.toChain)
      ? Number(route.output.valueInUsd)
      : params.tokenOutUsd * +formattedOutputAmount

    return {
      quoteParams: params,
      outputAmount: BigInt(route.output.amount),
      formattedOutputAmount,
      inputUsd,
      outputUsd,
      priceImpact: !inputUsd || !outputUsd ? NaN : ((inputUsd - outputUsd) * 100) / inputUsd,
      rate: +formattedOutputAmount / +formattedInputAmount,
      gasFeeUsd: Number(route.gasFee?.feeInUsd || 0),
      timeEstimate: route.estimatedTime || 0,
      contractAddress: route.approval?.spenderAddress || ZERO_ADDRESS,
      rawQuote: {
        ...data.result,
        route,
      },
      protocolFee: 0,
      platformFeePercent: (params.feeBps * 100) / 10000,
    }
  }

  async executeSwap({ quote }: Quote, walletClient: WalletClient): Promise<NormalizedTxResponse> {
    const route = getSocketTxRoute(quote.rawQuote)
    const txData = route?.txData?.object

    if (!txData?.to || !txData?.data || !route?.quoteId) {
      throw new Error('Missing Bungee transaction data')
    }

    const params = {
      id: route.quoteId,
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
      to: txData.to,
      value: BigInt(txData.value || '0'),
      data: txData.data,
      chain: undefined,
      account,
    })

    return {
      ...params,
      sourceTxHash: hash,
      amountInUsd: quote.inputUsd,
      amountOutUsd: quote.outputUsd,
      platformFeePercent: quote.platformFeePercent,
      recipient: quote.quoteParams.recipient,
    }
  }

  async getTransactionStatus(params: NormalizedTxResponse): Promise<SwapStatus> {
    const response = await fetch(`${SOCKET_API_BASE_URL}/v3/swap/status?quoteId=${params.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        affiliate: BUNGEE_AFFILIATE_ID,
      },
    })
    const data = await response.json()

    if (!data.success) {
      throw new Error(`Status error: ${data.error?.message || 'Unknown error'}`)
    }
    const res = data.result

    // Extract actual output amount from destination data if available
    const actualAmountOut = res?.destination?.output?.[0]?.amount
    const statusCode = String(res?.statusCode || res?.status || '').toUpperCase() as SocketStatusCode

    return {
      txHash: res?.destination?.txHash || res?.origin?.txHash || '',
      status:
        statusCode === SocketStatusCode.REFUNDED
          ? 'Refunded'
          : [SocketStatusCode.EXPIRED, SocketStatusCode.CANCELLED, SocketStatusCode.FAILED].includes(statusCode)
          ? 'Failed'
          : [
              SocketStatusCode.COMPLETED,
              SocketStatusCode.SUCCESS,
              SocketStatusCode.FULFILLED,
              SocketStatusCode.SETTLED,
            ].includes(statusCode)
          ? 'Success'
          : 'Processing',
      amountOut: actualAmountOut ? String(actualAmountOut) : undefined,
    }
  }
}
