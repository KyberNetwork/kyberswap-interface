import { AcrossClient, createAcrossClient } from '@across-protocol/app-sdk'
import { ChainId, Currency, Token } from '@kyberswap/ks-sdk-core'
import { WalletAdapterProps } from '@solana/wallet-adapter-base'
import { Connection } from '@solana/web3.js'
import { WalletClient, formatUnits } from 'viem'
import {
  arbitrum,
  base,
  blast,
  bsc,
  linea,
  mainnet,
  optimism,
  plasma,
  polygon,
  scroll,
  unichain,
  zksync,
} from 'viem/chains'

import { CROSS_CHAIN_FEE_RECEIVER, ZERO_ADDRESS } from 'constants/index'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { SolanaToken } from 'state/crossChainSwap'
import { isEvmChain } from 'utils'

import { Quote } from '../registry'
import { isNativeToken, isWrappedToken } from '../utils'
import {
  BaseSwapAdapter,
  Chain,
  EvmQuoteParams,
  NOT_SUPPORTED_CHAINS_PRICE_SERVICE,
  NonEvmChain,
  NormalizedQuote,
  NormalizedTxResponse,
  QuoteParams,
  SwapStatus,
} from './BaseSwapAdapter'

const API_URL = 'https://app.across.to/api/suggested-fees'

export class AcrossAdapter extends BaseSwapAdapter {
  private acrossClient: AcrossClient

  constructor() {
    super()
    this.acrossClient = createAcrossClient({
      integratorId: `0x008a`,
      chains: [mainnet, arbitrum, bsc, optimism, linea, polygon, zksync, base, scroll, blast, unichain, plasma],
      rpcUrls: [
        ChainId.MAINNET,
        ChainId.ARBITRUM,
        ChainId.BSCMAINNET,
        ChainId.OPTIMISM,
        ChainId.LINEA,
        ChainId.MATIC,
        ChainId.ZKSYNC,
        ChainId.BASE,
        ChainId.SCROLL,
        ChainId.BLAST,
        ChainId.UNICHAIN,
      ].reduce((acc, cur) => {
        return { ...acc, [cur]: NETWORKS_INFO[cur].defaultRpcUrl }
      }, {}),
    })
  }

  getName(): string {
    return 'Across'
  }
  getIcon(): string {
    return 'https://across.to/favicon.ico'
  }

  canSupport(category: string, tokenIn?: Currency, tokenOut?: Currency): boolean {
    if (!tokenIn || !tokenOut) {
      return false
    }

    if (category === 'stablePair') {
      return true
    }

    const isTokenInNativeOrWrapped = isNativeToken(tokenIn) || isWrappedToken(tokenIn)
    const isTokenOutNativeOrWrapped = isNativeToken(tokenOut) || isWrappedToken(tokenOut)

    if (isTokenInNativeOrWrapped && isTokenOutNativeOrWrapped) {
      return true
    }

    console.warn(`Across does not support swap from ${tokenIn.symbol || 'unknown'} to ${tokenOut.symbol || 'unknown'}`)

    return false
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
      ChainId.UNICHAIN,
      ChainId.BSCMAINNET,
      ChainId.PLASMA,
      // NonEvmChain.Solana,
    ]
  }

  getSupportedTokens(_sourceChain: Chain, _destChain: Chain): Currency[] {
    return []
  }

  async getQuote(params: QuoteParams): Promise<NormalizedQuote> {
    try {
      let res
      const isFromSol = params.fromChain === NonEvmChain.Solana
      if (isFromSol && isEvmChain(params.toChain)) {
        const reqParams = new URLSearchParams({
          inputToken: (params.fromToken as SolanaToken).id,
          outputToken: (params.toToken as Token).wrapped.address,
          destinationChainId: params.toChain.toString(),
          originChainId: '34268394551451',
          amount: params.amount,
          skipAmountLimit: 'true',
          allowUnmatchedDecimals: 'true',
        })

        res = await fetch(`${API_URL}?${reqParams}`).then(res => res.json())
      } else {
        const p = params as EvmQuoteParams
        res = await this.acrossClient.getSwapQuote({
          route: {
            originChainId: +params.fromChain,
            destinationChainId: +params.toChain,
            inputToken: (p.fromToken.isNative ? ZERO_ADDRESS : p.fromToken.wrapped.address) as `0x${string}`,
            outputToken: (p.toToken.isNative ? ZERO_ADDRESS : p.toToken.wrapped.address) as `0x${string}`,
          },
          amount: params.amount,
          appFee: params.feeBps / 10_000,
          appFeeRecipient: CROSS_CHAIN_FEE_RECEIVER,
          slippage: params.slippage / 10_000, // https://docs.across.to/reference/api-reference#get-swap-approval
          depositor: params.sender,
        })
      }

      // across only have bridge then we can treat token in and out price usd are the same in case price service is not supported
      const isSameToken = params.fromToken.symbol === params.toToken.symbol
      const tokenInUsd =
        isSameToken && NOT_SUPPORTED_CHAINS_PRICE_SERVICE.includes(params.fromChain) && params.tokenOutUsd
          ? params.tokenOutUsd
          : params.tokenInUsd
      const tokenOutUsd =
        isSameToken && NOT_SUPPORTED_CHAINS_PRICE_SERVICE.includes(params.toChain) && params.tokenInUsd
          ? params.tokenInUsd
          : params.tokenOutUsd

      const outputAmount = BigInt(isFromSol ? res.outputAmount : res.expectedOutputAmount)
      const formattedOutputAmount = formatUnits(outputAmount, params.toToken.decimals)
      const formattedInputAmount = formatUnits(BigInt(params.amount), params.fromToken.decimals)

      const inputUsd = tokenInUsd * +formattedInputAmount
      const outputUsd = tokenOutUsd * +formattedOutputAmount

      return {
        quoteParams: params,
        outputAmount,
        formattedOutputAmount,
        inputUsd: tokenInUsd * +formatUnits(BigInt(params.amount), params.fromToken.decimals),
        outputUsd: tokenOutUsd * +formattedOutputAmount,
        rate: +formattedOutputAmount / +formattedInputAmount,
        timeEstimate: isFromSol ? res.estimatedFillTimeSec : res.expectedFillTime,
        priceImpact: !inputUsd || !outputUsd ? NaN : ((inputUsd - outputUsd) * 100) / inputUsd,
        // TODO: what is gas fee for across
        gasFeeUsd: 0,
        contractAddress: isFromSol ? ZERO_ADDRESS : res.checks.allowance.spender,
        rawQuote: res,

        protocolFee: 0,
        platformFeePercent: (params.feeBps * 100) / 10_000,
      }
    } catch (e) {
      console.log('Across getQuote error', e)
      throw e
    }
  }

  async executeSwap(
    quote: Quote,
    walletClient: WalletClient,
    _nearWalletClient?: any,
    _sendBtcFn?: (params: { recipient: string; amount: string | number }) => Promise<string>,
    _sendTransaction?: WalletAdapterProps['sendTransaction'],
    _connection?: Connection,
  ): Promise<NormalizedTxResponse> {
    // For EVM chains, use the original implementation
    return new Promise<NormalizedTxResponse>((resolve, reject) => {
      this.acrossClient
        .executeSwapQuote({
          walletClient: walletClient as any,
          swapQuote: quote.quote.rawQuote as any,
          onProgress: progress => {
            if (progress.step === 'swap' && 'txHash' in progress) {
              resolve({
                sender: quote.quote.quoteParams.sender,
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
                amountInUsd: quote.quote.inputUsd,
                amountOutUsd: quote.quote.outputUsd,
                platformFeePercent: quote.quote.platformFeePercent,
                recipient: quote.quote.quoteParams.recipient,
              })
            }
          },
        })
        .catch(reject)
    })
  }
  async getTransactionStatus(params: NormalizedTxResponse): Promise<SwapStatus> {
    try {
      const res = await fetch(`https://app.across.to/api/deposit/status?depositTxHash=${params.sourceTxHash}`).then(
        res => res.json(),
      )
      return {
        txHash: res.fillTx || '',
        status: res.status === 'refunded' ? 'Refunded' : res.status === 'filled' ? 'Success' : 'Processing',
      }
    } catch (error) {
      console.error('Error fetching transaction status:', error)
      return {
        txHash: '',
        status: 'Processing',
      }
    }
  }
}
