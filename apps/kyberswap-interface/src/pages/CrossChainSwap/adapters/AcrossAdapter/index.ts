import { AcrossClient, createAcrossClient } from '@across-protocol/app-sdk'
import { ChainId, Currency, Token } from '@kyberswap/ks-sdk-core'
import { WalletAdapterProps } from '@solana/wallet-adapter-base'
import { Connection } from '@solana/web3.js'
import axios from 'axios'
import { type Address, WalletClient, formatUnits } from 'viem'
import {
  arbitrum,
  base,
  blast,
  bsc,
  linea,
  mainnet,
  monad,
  optimism,
  plasma,
  polygon,
  scroll,
  unichain,
  zksync,
} from 'viem/chains'

import { CROSS_CHAIN_FEE_RECEIVER, ZERO_ADDRESS } from 'constants/index'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { getAcrossDepositStatus } from 'pages/CrossChainSwap/adapters/AcrossAdapter/api'
import {
  AcrossSuggestedFeesQuote,
  AcrossSwapQuote,
  AcrossWalletClient,
} from 'pages/CrossChainSwap/adapters/AcrossAdapter/types'
import { getAcrossFillTxHash, mapAcrossDepositStatus } from 'pages/CrossChainSwap/adapters/AcrossAdapter/utils'
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
} from 'pages/CrossChainSwap/adapters/BaseSwapAdapter'
import type { SolanaToken } from 'pages/CrossChainSwap/hooks/useSolanaTokens'
import { Quote } from 'pages/CrossChainSwap/registry'
import { isNativeToken, isWrappedToken } from 'pages/CrossChainSwap/utils'
import { isEvmChain } from 'utils'

const API_URL = 'https://app.across.to/api/suggested-fees'

const getAcrossTokenAddress = (token: Currency): Address =>
  (token.isNative ? ZERO_ADDRESS : token.wrapped.address) as Address

export class AcrossAdapter extends BaseSwapAdapter {
  private acrossClient: AcrossClient

  constructor() {
    super()
    this.acrossClient = createAcrossClient({
      integratorId: `0x008a`,
      chains: [mainnet, arbitrum, bsc, optimism, linea, polygon, zksync, base, scroll, blast, unichain, plasma, monad],
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
        ChainId.MONAD,
      ].reduce((acc, cur) => {
        return { ...acc, [cur]: NETWORKS_INFO[cur].defaultRpcUrl }
      }, {}),
    })
  }

  getName(): string {
    return 'Across'
  }
  getIcon(): string {
    return 'https://storage.googleapis.com/ks-setting-1d682dca/49319cc3-81fd-4d70-9870-c99e8b67ba221778733646226.png'
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
      ChainId.MONAD,
      // NonEvmChain.Solana,
    ]
  }

  getSupportedTokens(_sourceChain: Chain, _destChain: Chain): Currency[] {
    return []
  }

  async getQuote(params: QuoteParams): Promise<NormalizedQuote> {
    try {
      const isFromSol = params.fromChain === NonEvmChain.Solana
      let rawQuote: AcrossSuggestedFeesQuote | AcrossSwapQuote
      let outputAmount: bigint
      let contractAddress: string
      let timeEstimate: number
      let gasFeeUsd = 0

      if (isFromSol && isEvmChain(params.toChain)) {
        const fromToken = params.fromToken as SolanaToken
        const toToken = params.toToken as Token
        const reqParams = new URLSearchParams({
          inputToken: fromToken.id,
          outputToken: toToken.wrapped.address,
          destinationChainId: params.toChain.toString(),
          originChainId: '34268394551451',
          amount: params.amount,
          skipAmountLimit: 'true',
          allowUnmatchedDecimals: 'true',
        })

        const { data } = await axios.get<AcrossSuggestedFeesQuote>(API_URL, { params: reqParams })
        rawQuote = data
        outputAmount = BigInt(data.outputAmount)
        contractAddress = ZERO_ADDRESS
        timeEstimate = data.estimatedFillTimeSec
      } else {
        const quoteParams = params as EvmQuoteParams
        const swapQuote = await this.acrossClient.getSwapQuote({
          route: {
            originChainId: +params.fromChain,
            destinationChainId: +params.toChain,
            inputToken: getAcrossTokenAddress(quoteParams.fromToken),
            outputToken: getAcrossTokenAddress(quoteParams.toToken),
          },
          amount: params.amount,
          appFee: params.feeBps / 10_000,
          appFeeRecipient: CROSS_CHAIN_FEE_RECEIVER,
          slippage: params.slippage / 10_000, // https://docs.across.to/reference/api-reference#get-swap-approval
          depositor: params.sender,
        })

        rawQuote = swapQuote
        outputAmount = BigInt(swapQuote.expectedOutputAmount)
        contractAddress = swapQuote.checks.allowance.spender
        timeEstimate = swapQuote.expectedFillTime
        gasFeeUsd = Number(swapQuote.fees.originGas.amountUsd || 0)
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

      const formattedOutputAmount = formatUnits(outputAmount, params.toToken.decimals)
      const formattedInputAmount = formatUnits(BigInt(params.amount), params.fromToken.decimals)

      const inputUsd = tokenInUsd * +formattedInputAmount
      const outputUsd = tokenOutUsd * +formattedOutputAmount

      return {
        quoteParams: params,
        outputAmount,
        formattedOutputAmount,
        inputUsd,
        outputUsd,
        rate: +formattedOutputAmount / +formattedInputAmount,
        timeEstimate,
        priceImpact: !inputUsd || !outputUsd ? NaN : ((inputUsd - outputUsd) * 100) / inputUsd,
        gasFeeUsd,
        contractAddress,
        rawQuote,

        protocolFee: 0,
        platformFeePercent: (params.feeBps * 100) / 10_000,
      }
    } catch (error) {
      console.log('Across getQuote error', error)
      throw error
    }
  }

  async executeSwap(
    quote: Quote,
    walletClient: WalletClient,
    _nearWalletClient?: unknown,
    _sendBtcFn?: (params: { recipient: string; amount: string | number }) => Promise<string>,
    _sendTransaction?: WalletAdapterProps['sendTransaction'],
    _connection?: Connection,
  ): Promise<NormalizedTxResponse> {
    const normalizedQuote = quote.quote
    const quoteParams = normalizedQuote.quoteParams

    // For EVM chains, use the original implementation
    return new Promise<NormalizedTxResponse>((resolve, reject) => {
      this.acrossClient
        .executeSwapQuote({
          walletClient: walletClient as AcrossWalletClient,
          swapQuote: normalizedQuote.rawQuote as AcrossSwapQuote,
          onProgress: progress => {
            if (progress.step === 'swap' && 'txHash' in progress) {
              resolve({
                sender: quoteParams.sender,
                sourceTxHash: progress.txHash,
                adapter: this.getName(),
                id: progress.txHash,
                sourceChain: quoteParams.fromChain,
                targetChain: quoteParams.toChain,
                inputAmount: quoteParams.amount,
                outputAmount: normalizedQuote.outputAmount.toString(),
                sourceToken: quoteParams.fromToken,
                targetToken: quoteParams.toToken,
                timestamp: new Date().getTime(),
                amountInUsd: normalizedQuote.inputUsd,
                amountOutUsd: normalizedQuote.outputUsd,
                platformFeePercent: normalizedQuote.platformFeePercent,
                recipient: quoteParams.recipient,
              })
            }
          },
        })
        .catch(reject)
    })
  }
  async getTransactionStatus(params: NormalizedTxResponse): Promise<SwapStatus> {
    try {
      const res = await getAcrossDepositStatus(params.sourceTxHash)

      return {
        txHash: getAcrossFillTxHash(res),
        status: mapAcrossDepositStatus(res),
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
