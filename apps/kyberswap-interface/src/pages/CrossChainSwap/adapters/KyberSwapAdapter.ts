import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { getPublicClient } from '@wagmi/core'
import routeApi from 'services/route'
import { WalletClient, formatUnits } from 'viem'

import { wagmiConfig } from 'components/Web3Provider'
import { AGGREGATOR_API } from 'constants/env'
import { AGGREGATOR_API_PATHS, ETHER_ADDRESS } from 'constants/index'
import { MAINNET_NETWORKS, NETWORKS_INFO } from 'constants/networks'
import store from 'state'

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

export class KyberSwapAdapter extends BaseSwapAdapter {
  constructor() {
    super()
  }

  getName(): string {
    return 'KyberSwap'
  }
  getIcon(): string {
    return 'https://kyberswap.com/favicon.ico'
  }
  getSupportedChains(): Chain[] {
    return [...MAINNET_NETWORKS].filter(item => !NOT_SUPPORTED_CHAINS_PRICE_SERVICE.includes(item))
  }

  getSupportedTokens(_sourceChain: Chain, _destChain: Chain): Currency[] {
    return []
  }

  async getQuote(params: EvmQuoteParams): Promise<NormalizedQuote> {
    const url = `${AGGREGATOR_API}/${NETWORKS_INFO[params.fromChain as ChainId].aggregatorRoute}${
      AGGREGATOR_API_PATHS.GET_ROUTE
    }`
    const response = await store.dispatch(
      routeApi.endpoints.getRoute.initiate({
        url,
        params: {
          tokenIn: params.fromToken.isNative ? ETHER_ADDRESS : params.fromToken.wrapped.address,
          tokenOut: params.toToken.isNative ? ETHER_ADDRESS : params.toToken.wrapped.address,
          tokenInDecimals: params.fromToken.decimals,
          tokenOutDecimals: params.toToken.decimals,
          amountIn: params.amount,
          gasInclude: 'true',
          chainId: params.fromChain as ChainId,
        },
        authentication: false,
        clientId: 'kyberswap',
      }),
    )

    const routeSummary = response.data?.data?.routeSummary
    if (!routeSummary) throw new Error('No route found')

    const tokenInUsd = params.tokenInUsd
    const tokenOutUsd = params.tokenOutUsd
    const formattedOutputAmount = formatUnits(BigInt(routeSummary.amountOut), params.toToken.decimals)
    const formattedInputAmount = formatUnits(BigInt(params.amount), params.fromToken.decimals)
    const inputUsd = tokenInUsd * +formattedInputAmount
    const outputUsd = tokenOutUsd * +formattedOutputAmount

    return {
      quoteParams: params,
      outputAmount: BigInt(routeSummary?.amountOut),
      formattedOutputAmount,
      inputUsd: tokenInUsd * +formatUnits(BigInt(params.amount), params.fromToken.decimals),
      outputUsd: tokenOutUsd * +formattedOutputAmount,
      rate: +formattedOutputAmount / +formattedInputAmount,
      timeEstimate: 1,
      priceImpact: !inputUsd || !outputUsd ? NaN : ((inputUsd - outputUsd) * 100) / inputUsd,
      // TODO: what is gas fee for across
      gasFeeUsd: 0,
      contractAddress: response.data?.data?.routerAddress || '',
      rawQuote: routeSummary,

      protocolFee: 0,
      platformFeePercent: 0,
    }
  }

  async executeSwap({ quote }: Quote, walletClient: WalletClient): Promise<NormalizedTxResponse> {
    if (!walletClient) throw new Error('Wallet client is not defined')
    const account = walletClient.account?.address
    if (!account) throw new Error('WalletClient account is not defined')

    const url = `${AGGREGATOR_API}/${NETWORKS_INFO[quote.quoteParams.fromChain as ChainId].aggregatorRoute}${
      AGGREGATOR_API_PATHS.BUILD_ROUTE
    }`

    const deadline = new Date()
    deadline.setSeconds(deadline.getSeconds() + 60 * 20)

    const response = await store.dispatch(
      routeApi.endpoints.buildRoute.initiate({
        authentication: false,
        url,
        payload: {
          routeSummary: quote.rawQuote as any,
          deadline: deadline.getTime(),
          sender: quote.quoteParams.sender,
          recipient: quote.quoteParams.recipient,
          skipSimulateTx: true,
          enableGasEstimation: false,
          source: 'kyberswap',
          slippageTolerance: quote.quoteParams.slippage,
        },
      }),
    )

    if ('error' in response) {
      const e = response.error as any
      if (Array.isArray(e?.data?.errorEntities)) {
        throw new Error(e.data.errorEntities.join(' | '))
      }
      throw new Error(e?.data?.errorEntities?.[0] || e.message || e?.data?.message || `Something went wrong`)
    }

    const data = response.data?.data as any

    const txData = {
      data: data.data,
      to: data.routerAddress as `0x${string}`,
      value: (quote.quoteParams.fromToken as any).isNative ? BigInt(quote.quoteParams.amount) : BigInt('0'),
    }

    const tx = await walletClient.sendTransaction({
      ...txData,
      chain: undefined,
      account,
    })

    return {
      sender: quote.quoteParams.sender,
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

  async getTransactionStatus(params: NormalizedTxResponse): Promise<SwapStatus> {
    const publicClient = getPublicClient(wagmiConfig, {
      chainId: params.sourceChain as any,
    })

    const receipt = await publicClient?.getTransactionReceipt({ hash: params.id as `0x${string}` })

    return {
      txHash: params.id,
      status: !receipt.status ? 'Processing' : receipt?.status === 'success' ? 'Success' : 'Failed',
    }
  }
}
