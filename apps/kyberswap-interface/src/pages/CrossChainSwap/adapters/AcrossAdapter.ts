import { AcrossClient, createAcrossClient } from '@across-protocol/app-sdk'
import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { WalletClient, formatUnits } from 'viem'
import { arbitrum, base, blast, linea, mainnet, optimism, polygon, scroll, unichain, zksync } from 'viem/chains'

import { CROSS_CHAIN_FEE_RECEIVER, ZERO_ADDRESS } from 'constants/index'

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

export class AcrossAdapter extends BaseSwapAdapter {
  private acrossClient: AcrossClient

  constructor() {
    super()
    this.acrossClient = createAcrossClient({
      integratorId: `0x008a`,
      chains: [mainnet, arbitrum, optimism, linea, polygon, zksync, base, scroll, blast, unichain],
      rpcUrls: {
        [ChainId.BASE]: 'https://base.drpc.org',
      },
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
      ChainId.UNICHAIN,
      ChainId.BSCMAINNET,
    ]
  }

  getSupportedTokens(_sourceChain: Chain, _destChain: Chain): Currency[] {
    return []
  }

  async getQuote(params: EvmQuoteParams): Promise<NormalizedQuote> {
    try {
      const res = await this.acrossClient.getSwapQuote({
        route: {
          originChainId: +params.fromChain,
          destinationChainId: +params.toChain,
          inputToken: (params.fromToken.isNative ? ZERO_ADDRESS : params.fromToken.wrapped.address) as `0x${string}`,
          outputToken: (params.toToken.isNative ? ZERO_ADDRESS : params.toToken.wrapped.address) as `0x${string}`,
        },
        amount: params.amount,
        appFee: params.feeBps / 10_000,
        appFeeRecipient: CROSS_CHAIN_FEE_RECEIVER,
        slippage: (params.slippage * 100) / 10_000,
        depositor: params.sender,
      })

      // console.log(res)
      // const resp = await this.acrossClient.getQuote({
      //   route: {
      //     originChainId: +params.fromChain,
      //     destinationChainId: +params.toChain,
      //     inputToken: params.fromToken.wrapped.address as `0x${string}`,
      //     outputToken: params.toToken.wrapped.address as `0x${string}`,
      //     isNative: params.fromToken.isNative,
      //   },
      //   inputAmount: params.amount,
      //   recipient: multicalHandlerContract[params.toChain],
      //   crossChainMessage: {
      //     actions: [
      //       {
      //         target: params.toToken.wrapped.address as `0x${string}`,
      //         callData: erc20Interface.encodeFunctionData('transfer', [CROSS_CHAIN_FEE_RECEIVER, 0n]) as `0x${string}`,
      //         value: '0',
      //         update: updatedAmount => ({
      //           callData: erc20Interface.encodeFunctionData('transfer', [
      //             CROSS_CHAIN_FEE_RECEIVER,
      //             (updatedAmount * BigInt(params.feeBps)) / 10_000n,
      //           ]) as `0x${string}`,
      //         }),
      //       },
      //     ],
      //     fallbackRecipient: params.recipient as `0x${string}`,
      //   },
      // })

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

      const formattedOutputAmount = formatUnits(BigInt(res.expectedOutputAmount), params.toToken.decimals)
      const formattedInputAmount = formatUnits(BigInt(params.amount), params.fromToken.decimals)

      const inputUsd = tokenInUsd * +formattedInputAmount
      const outputUsd = tokenOutUsd * +formattedOutputAmount

      return {
        quoteParams: params,
        outputAmount: BigInt(res.expectedOutputAmount),
        formattedOutputAmount,
        inputUsd: tokenInUsd * +formatUnits(BigInt(params.amount), params.fromToken.decimals),
        outputUsd: tokenOutUsd * +formattedOutputAmount,
        rate: +formattedOutputAmount / +formattedInputAmount,
        timeEstimate: res.expectedFillTime,
        priceImpact: !inputUsd || !outputUsd ? NaN : ((inputUsd - outputUsd) * 100) / inputUsd,
        // TODO: what is gas fee for across
        gasFeeUsd: 0,
        contractAddress: res.checks.allowance.spender,
        rawQuote: res,

        protocolFee: 0,
        platformFeePercent: (params.feeBps * 100) / 10_000,
      }
    } catch (e) {
      console.log('Across getQuote error', e)
      throw e
    }
  }

  async executeSwap(quote: Quote, walletClient: WalletClient): Promise<NormalizedTxResponse> {
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
        status: res.status === 'filled' ? 'Success' : 'Processing',
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
