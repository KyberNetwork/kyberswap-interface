import { arbitrum, base, blast, linea, mainnet, optimism, polygon, scroll, zksync } from 'viem/chains'
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
import { Quote } from '../registry'

import { ethers } from 'ethers'
import { CROSS_CHAIN_FEE_RECEIVER } from 'constants/index'

// Define the ABI of the functions
const transferFunction = 'function transfer(address to, uint256 amount)'

// Create Interface instances
const erc20Interface = new ethers.utils.Interface([transferFunction])

export class AcrossAdapter extends BaseSwapAdapter {
  private acrossClient: AcrossClient

  constructor() {
    super()
    this.acrossClient = createAcrossClient({
      integratorId: `0x008a`,
      chains: [mainnet, arbitrum, optimism, linea, polygon, zksync, base, scroll, blast],
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
    ]
  }

  getSupportedTokens(_sourceChain: Chain, _destChain: Chain): Currency[] {
    return []
  }

  async getQuote(params: EvmQuoteParams): Promise<NormalizedQuote> {
    try {
      const resp = await this.acrossClient.getQuote({
        route: {
          originChainId: +params.fromChain,
          destinationChainId: +params.toChain,
          inputToken: params.fromToken.wrapped.address as `0x${string}`,
          outputToken: params.toToken.wrapped.address as `0x${string}`,
          isNative: params.fromToken.isNative,
        },
        inputAmount: params.amount,
        // TODO
        recipient: '0x924a9f036260DdD5808007E1AA95f08eD08aA569',
        crossChainMessage: {
          actions: [
            {
              target: params.toToken.wrapped.address as `0x${string}`,
              callData: erc20Interface.encodeFunctionData('transfer', [CROSS_CHAIN_FEE_RECEIVER, 0n]) as `0x${string}`,
              value: '0',
              update: updatedAmount => ({
                callData: erc20Interface.encodeFunctionData('transfer', [
                  CROSS_CHAIN_FEE_RECEIVER,
                  (updatedAmount * BigInt(params.feeBps)) / 10_000n,
                ]) as `0x${string}`,
              }),
            },
          ],
          fallbackRecipient: params.recipient as `0x${string}`,
        },
      })
      const tokenInUsd = params.tokenInUsd
      const tokenOutUsd = params.tokenOutUsd
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

        // TODO: handle fee
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
