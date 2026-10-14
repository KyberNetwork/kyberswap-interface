import { WalletClient, formatUnits } from 'viem'

import SocketLogo from 'assets/svg/socket_logo.svg'
import { ETHER_ADDRESS, ZERO_ADDRESS } from 'constants/index'
import { MAINNET_NETWORKS } from 'constants/networks'
import {
  BaseSwapAdapter,
  BitcoinToken,
  Chain,
  Currency,
  EvmQuoteParams,
  NOT_SUPPORTED_CHAINS_PRICE_SERVICE,
  NonEvmChain,
  NormalizedQuote,
  NormalizedTxResponse,
  SwapStatus,
} from 'pages/CrossChainSwap/adapters/BaseSwapAdapter'
import { getBungeeQuote, getBungeeStatus } from 'pages/CrossChainSwap/adapters/BungeeAdapter/api'
import { type SocketQuoteParams, type SocketQuoteResult } from 'pages/CrossChainSwap/adapters/BungeeAdapter/types'
import { getSocketTxRoute, normalizeSocketStatus } from 'pages/CrossChainSwap/adapters/BungeeAdapter/utils'
import { Quote } from 'pages/CrossChainSwap/registry'
import { CROSS_CHAIN_FEE_RECEIVER, isWrappedToken } from 'pages/CrossChainSwap/utils'

export class BungeeAdapter extends BaseSwapAdapter {
  constructor() {
    super()
  }

  getName(): string {
    return 'Socket'
  }
  getIcon(): string {
    return SocketLogo
  }
  getAliases() {
    return [
      // Bungee is now part of Socket, so we can use Socket's name and icon
      { name: 'Bungee', icon: 'https://www.bungee.exchange/favicon.ico' },
    ]
  }

  canSupport(_category: string, tokenIn?: Currency, tokenOut?: Currency): boolean {
    if (tokenIn === BitcoinToken) {
      return !!tokenOut && 'chainId' in tokenOut && MAINNET_NETWORKS.includes(tokenOut.chainId)
    }

    // Other source tokens must be on EVM chains.
    if (!tokenIn || !('chainId' in tokenIn) || !tokenIn.chainId) return false

    const isWrappedTokenIn = isWrappedToken(tokenIn)

    if (isWrappedTokenIn) {
      console.warn(`Bungee does not support swap from wrapped token: ${tokenIn.symbol || 'unknown'}`)
      return false
    }

    return true
  }

  getSupportedChains(): Chain[] {
    return [...MAINNET_NETWORKS, NonEvmChain.Bitcoin]
  }

  getSupportedTokens(_sourceChain: Chain, _destChain: Chain): Currency[] {
    return []
  }

  async getQuote(params: EvmQuoteParams): Promise<NormalizedQuote> {
    if (params.fromChain === NonEvmChain.Bitcoin || params.toChain === NonEvmChain.Bitcoin) {
      throw new Error('Use the aggregator stream API for Socket Bitcoin quotes')
    }

    const quoteParams: SocketQuoteParams = {
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

    const response = await getBungeeQuote(quoteParams)

    const data = response.data
    const serverReqId = response.headers['server-req-id']
    const quoteResult = data.result

    const route = getSocketTxRoute(quoteResult)

    if (!data.success || !quoteResult || !route?.output?.amount) {
      throw new Error(`Quote error: ${data.statusCode}: ${data.message}. server-req-id: ${serverReqId}`)
    }

    const formattedInputAmount = formatUnits(BigInt(params.amount), params.fromToken.decimals)
    const formattedOutputAmount = formatUnits(BigInt(route.output.amount), params.toToken.decimals)
    const inputUsd = NOT_SUPPORTED_CHAINS_PRICE_SERVICE.includes(params.fromChain)
      ? Number(quoteResult.input?.valueInUsd)
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
        ...quoteResult,
        route,
      },
      protocolFee: 0,
      platformFeePercent: (params.feeBps * 100) / 10000,
    }
  }

  async executeSwap(
    { quote }: Quote,
    walletClient: WalletClient | undefined,
    _nearWallet?: unknown,
    sendBtcFn?: (params: { recipient: string; amount: string | number }) => Promise<string>,
  ): Promise<NormalizedTxResponse> {
    const route = getSocketTxRoute(quote.rawQuote as SocketQuoteResult)
    const txData = route?.txData

    if (!txData?.object || !route?.quoteId) {
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

    let hash: string
    if (quote.quoteParams.fromChain === NonEvmChain.Bitcoin) {
      if (txData.kind !== 'btc_deposit') throw new Error('Missing Socket Bitcoin deposit data')
      const { depositAddress, amount, chainId } = txData.object
      if (
        chainId !== 8253038 ||
        !depositAddress ||
        !amount ||
        !/^\d+$/.test(amount) ||
        BigInt(amount) <= 0n ||
        BigInt(amount) !== BigInt(quote.quoteParams.amount)
      ) {
        throw new Error('Invalid Socket Bitcoin deposit data')
      }
      if (!sendBtcFn) throw new Error('Bitcoin wallet is not connected')

      // Socket returns the deposit amount in satoshis, as expected by the Bitcoin wallet.
      hash = await sendBtcFn({ recipient: depositAddress, amount })
    } else {
      if (txData.kind && txData.kind !== 'evm_tx') throw new Error('Unsupported Socket transaction type')
      const { to, data, value } = txData.object
      if (!to || !data) throw new Error('Missing Bungee transaction data')
      const account = walletClient?.account?.address
      if (!walletClient || !account) throw new Error('WalletClient account is not defined')
      hash = await walletClient.sendTransaction({
        to,
        value: BigInt(value || '0'),
        data,
        chain: undefined,
        account,
      })
    }

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
    const response = await getBungeeStatus({ quoteId: params.id })
    const data = response.data

    if (!data.success || !data.result) {
      throw new Error(`Status error: ${data.message || 'Unknown error'}`)
    }

    return normalizeSocketStatus(data.result)
  }
}
