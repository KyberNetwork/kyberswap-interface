import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { getPublicClient } from '@wagmi/core'
import { WalletClient, formatUnits } from 'viem'

import { wagmiConfig } from 'components/Web3Provider'
import { CROSS_CHAIN_FEE_RECEIVER, ZERO_ADDRESS } from 'constants/index'

import { Quote } from '../registry'
import {
  Currency as AdapterCurrency,
  BaseSwapAdapter,
  Chain,
  EvmQuoteParams,
  NonEvmChain,
  NormalizedQuote,
  NormalizedTxResponse,
  SwapStatus,
} from './BaseSwapAdapter'

const SYMBIOSIS_API = 'https://api.symbiosis.finance/crosschain/v2'
const KYBERSWAP_PARTNER_ID = 'kyberswap'

export class SymbiosisAdapter extends BaseSwapAdapter {
  constructor() {
    super()
  }

  getName(): string {
    return 'Symbiosis'
  }
  getIcon(): string {
    return 'https://app.symbiosis.finance/images/favicon-32x32.png'
  }

  canSupport(category: string, tokenIn?: AdapterCurrency, tokenOut?: AdapterCurrency): boolean {
    const isBitcoinPair = tokenIn?.symbol === 'BTC' || tokenOut?.symbol === 'BTC'
    if (isBitcoinPair) return true

    // Symbiosis should only be used for stablePair category
    if (category !== 'stablePair') {
      console.warn(`Symbiosis does not support category: ${category}`)
      return false
    }

    return true
  }

  getSupportedChains(): Chain[] {
    return [
      NonEvmChain.Bitcoin,
      ChainId.MAINNET,
      ChainId.BSCMAINNET,
      ChainId.MATIC,
      ChainId.AVAXMAINNET,
      ChainId.ZKSYNC,
      ChainId.ARBITRUM,
      ChainId.OPTIMISM,
      ChainId.LINEA,
      ChainId.MANTLE,
      ChainId.BASE,
      ChainId.SCROLL,
      ChainId.BLAST,
      ChainId.SONIC,
      ChainId.BERA,
    ]
  }

  getSupportedTokens(_sourceChain: Chain, _destChain: Chain): Currency[] {
    return []
  }

  async getQuote(params: EvmQuoteParams): Promise<NormalizedQuote> {
    const body = {
      tokenAmountIn: {
        address: params.fromToken.isNative ? '' : params.fromToken.address,
        amount: params.amount,
        chainId: params.fromChain,
        decimals: params.fromToken.decimals,
      },
      tokenOut: {
        chainId: params.toChain,
        address: params.toToken.isNative ? '' : params.toToken.address,
        symbol: params.toToken.symbol,
        decimals: params.toToken.decimals,
      },
      from: params.sender,
      to: params.recipient,
      slippage: params.slippage,
      partnerAddress: CROSS_CHAIN_FEE_RECEIVER,
    }

    const res = await fetch(`${SYMBIOSIS_API}/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Partner-Id': KYBERSWAP_PARTNER_ID,
      },
      body: JSON.stringify(body),
    }).then(r => r.json())

    if (!res.tx) throw new Error('No route found')

    const formattedOutputAmount = formatUnits(BigInt(res.tokenAmountOut.amount), params.toToken.decimals)
    const formattedInputAmount = formatUnits(BigInt(params.amount), params.fromToken.decimals)

    const tokenInUsd = params.tokenInUsd
    const tokenOutUsd = params.tokenOutUsd

    const inputUsd = tokenInUsd * +formattedInputAmount
    const outputUsd = tokenOutUsd * +formattedOutputAmount

    // Calculate protocol fee from the fees array
    const protocolFee = (res.fees || []).reduce(
      (
        total: number,
        fee: {
          value: { amount: string; decimals: number; priceUsd: number }
        },
      ) => {
        const { amount, decimals, priceUsd } = fee.value
        const feeAmount = Number(amount) / Math.pow(10, decimals)
        const feeUsd = feeAmount * priceUsd
        return total + feeUsd
      },
      0,
    )

    return {
      quoteParams: params,
      outputAmount: BigInt(res.tokenAmountOut.amount),
      formattedOutputAmount,
      inputUsd,
      outputUsd,
      priceImpact: !inputUsd || !outputUsd ? NaN : ((inputUsd - outputUsd) * 100) / inputUsd,
      rate: +formattedOutputAmount / +formattedInputAmount,
      gasFeeUsd: 0,
      timeEstimate: res.estimatedTime,
      contractAddress: res.approveTo || ZERO_ADDRESS,
      rawQuote: res,
      protocolFee,
      platformFeePercent: (params.feeBps * 100) / 10_000,
    }
  }

  async executeSwap(
    { quote }: Quote,
    walletClient: WalletClient,
    _nearWallet?: unknown,
    sendBtcFn?: (params: { recipient: string; amount: string | number }) => Promise<string>,
  ): Promise<NormalizedTxResponse> {
    if (quote.quoteParams.fromChain === NonEvmChain.Bitcoin) {
      const depositAddress = quote.rawQuote?.tx?.depositAddress
      if (!depositAddress) throw new Error('Symbiosis deposit address not found')
      if (!sendBtcFn) throw new Error('Bitcoin wallet is not connected')

      const tx = await sendBtcFn({
        recipient: depositAddress,
        amount: quote.quoteParams.amount,
      })

      return {
        sender: quote.quoteParams.sender,
        id: tx,
        sourceTxHash: tx,
        adapter: this.getName(),
        sourceChain: quote.quoteParams.fromChain,
        targetChain: quote.quoteParams.toChain,
        inputAmount: quote.quoteParams.amount,
        outputAmount: quote.outputAmount.toString(),
        sourceToken: quote.quoteParams.fromToken,
        targetToken: quote.quoteParams.toToken,
        timestamp: new Date().getTime(),
        amountInUsd: quote.inputUsd,
        amountOutUsd: quote.outputUsd,
        platformFeePercent: quote.platformFeePercent,
        recipient: quote.quoteParams.recipient,
      }
    }

    const account = walletClient.account?.address
    if (!account) throw new Error('WalletClient account is not defined')

    const tx = await walletClient.sendTransaction({
      chain: undefined,
      account,
      to: quote.rawQuote.tx.to,
      value: BigInt(quote.rawQuote.tx.value),
      data: quote.rawQuote.tx.data,
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
      amountInUsd: quote.inputUsd,
      amountOutUsd: quote.outputUsd,
      platformFeePercent: quote.platformFeePercent,
      recipient: quote.quoteParams.recipient,
    }
  }

  async getTransactionStatus(p: NormalizedTxResponse): Promise<SwapStatus> {
    const sourceChain = p.sourceChain === NonEvmChain.Bitcoin ? '3652501241' : p.sourceChain
    const res = await fetch(`${SYMBIOSIS_API}/tx/${sourceChain}/${p.sourceTxHash}`).then(r => r.json())

    // Extract actual output amount from tx.tokenAmount if available
    const actualAmountOut = res?.tx?.tokenAmount?.amount
    const statusCode = res?.status?.code

    if (statusCode === -1 && typeof p.sourceChain === 'number' && p.sourceTxHash.startsWith('0x')) {
      const publicClient = getPublicClient(wagmiConfig, {
        chainId: p.sourceChain as number,
      })
      const receipt = await publicClient?.getTransactionReceipt({
        hash: p.sourceTxHash as `0x${string}`,
      })
      if (receipt?.status === 'reverted') {
        return {
          txHash: '',
          status: 'Failed',
        }
      }
    }

    return {
      txHash: res?.tx?.hash || '',
      status: statusCode === 0 ? 'Success' : statusCode === 3 ? 'Failed' : 'Processing',
      amountOut: actualAmountOut ? String(actualAmountOut) : undefined,
    }
  }
}
