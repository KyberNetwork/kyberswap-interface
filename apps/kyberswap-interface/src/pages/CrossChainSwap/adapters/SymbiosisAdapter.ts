import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { getPublicClient } from '@wagmi/core'
import axios from 'axios'
import { WalletClient, formatUnits } from 'viem'

import { wagmiConfig } from 'components/Web3Provider'
import { ZERO_ADDRESS } from 'constants/index'
import {
  Currency as AdapterCurrency,
  BaseSwapAdapter,
  Chain,
  NonEvmChain,
  NormalizedQuote,
  NormalizedTxResponse,
  QuoteParams,
  SwapStatus,
} from 'pages/CrossChainSwap/adapters/BaseSwapAdapter'
import { CROSS_CHAIN_FEE_RECEIVER } from 'pages/CrossChainSwap/constants'
import { Quote } from 'pages/CrossChainSwap/registry'

const symbiosisClient = axios.create({
  baseURL: 'https://api.symbiosis.finance/crosschain/v2',
  headers: {
    'Content-Type': 'application/json',
    'X-Partner-Id': 'kyberswap',
  },
})

const SYMBIOSIS_NON_EVM_CHAIN_IDS: Partial<Record<NonEvmChain, number>> = {
  [NonEvmChain.Bitcoin]: 3652501241,
}

type SymbiosisTokenAmount = {
  address: string
  chainId: number
  decimals: number
  symbol?: string
  amount?: string
  priceUsd?: number
}

type SymbiosisSwapRequest = {
  tokenAmountIn: SymbiosisTokenAmount & { amount: string }
  tokenOut: SymbiosisTokenAmount
  from: string
  to: string
  slippage: number
  partnerAddress?: string
  refundAddress?: string
}

type SymbiosisEvmTx = {
  chainId?: number
  to: string
  data: string
  value?: string
}

type SymbiosisDepositTx = {
  depositAddress: string
  expiresAt: string
}

type SymbiosisSwapResponse = {
  tx?: SymbiosisEvmTx | SymbiosisDepositTx | Record<string, unknown>
  fees?: Array<{
    provider?: string
    value: SymbiosisTokenAmount & { amount: string }
    description?: string
  }>
  tokenAmountOut?: SymbiosisTokenAmount & { amount: string }
  estimatedTime?: number
  approveTo?: string
  type?: string
  kind?: string
}

enum SymbiosisTxStatusCode {
  NotFound = -1,
  Success = 0,
  Pending = 1,
  Stuck = 2,
  Reverted = 3,
}

type SymbiosisTxStatusResponse = {
  status?: {
    code?: SymbiosisTxStatusCode
    text?: string
  }
  tx?: {
    hash?: string
    chainId?: number
    tokenAmount?: SymbiosisTokenAmount & { amount: string }
  }
}

const getChainId = (chain: Chain): number => {
  if (typeof chain === 'number') return chain

  const chainId = SYMBIOSIS_NON_EVM_CHAIN_IDS[chain]
  if (!chainId) throw new Error(`Symbiosis does not support chain: ${chain}`)
  return chainId
}

const getTokenAddress = (token: AdapterCurrency) => {
  if (token.symbol === 'BTC') return ''
  if ('isNative' in token && token.isNative) return ''
  return 'address' in token ? token.address : ''
}

const getSwapBody = (quoteParams: QuoteParams): SymbiosisSwapRequest => ({
  tokenAmountIn: {
    address: getTokenAddress(quoteParams.fromToken),
    amount: quoteParams.amount,
    chainId: getChainId(quoteParams.fromChain),
    decimals: quoteParams.fromToken.decimals,
  },
  tokenOut: {
    chainId: getChainId(quoteParams.toChain),
    address: getTokenAddress(quoteParams.toToken),
    symbol: quoteParams.toToken.symbol,
    decimals: quoteParams.toToken.decimals,
  },
  from: quoteParams.sender,
  to: quoteParams.recipient,
  slippage: quoteParams.slippage,
  partnerAddress: CROSS_CHAIN_FEE_RECEIVER,
  ...(quoteParams.fromChain === NonEvmChain.Bitcoin ? { refundAddress: quoteParams.sender } : {}),
})

/**
 * Symbiosis API references:
 * - GitBook: https://docs.symbiosis.finance/developer-tools/symbiosis-api
 * - Swagger: https://api.symbiosis.finance/crosschain/docs/#/
 *
 * API /v2/quote is quotation-only and does not generate a BTC deposit address.
 * API /v2/swap returns executable tx data and generates BTC deposit addresses, but is rate-limited to 1 request/second.
 */
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
    if (tokenIn?.symbol === 'BTC' || tokenOut?.symbol === 'BTC') return true

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
      ChainId.ROBINHOOD,
    ]
  }

  getSupportedTokens(_sourceChain: Chain, _destChain: Chain): Currency[] {
    return []
  }

  async getQuote(params: QuoteParams): Promise<NormalizedQuote> {
    const { data: quoteData } = await symbiosisClient.post<SymbiosisSwapResponse>('/quote', getSwapBody(params))

    if (!quoteData.tokenAmountOut?.amount) throw new Error('No route found')

    const formattedOutputAmount = formatUnits(BigInt(quoteData.tokenAmountOut.amount), params.toToken.decimals)
    const formattedInputAmount = formatUnits(BigInt(params.amount), params.fromToken.decimals)

    const inputUsd = params.tokenInUsd * +formattedInputAmount
    const outputUsd = params.tokenOutUsd * +formattedOutputAmount

    // Calculate protocol fee from the fees array
    const protocolFee = (quoteData.fees || []).reduce<number>((total, fee) => {
      const { amount, decimals, priceUsd = 0 } = fee.value
      return total + (Number(amount) / Math.pow(10, decimals)) * priceUsd
    }, 0)

    return {
      quoteParams: params,
      outputAmount: BigInt(quoteData.tokenAmountOut.amount),
      formattedOutputAmount,
      inputUsd,
      outputUsd,
      priceImpact: !inputUsd || !outputUsd ? NaN : ((inputUsd - outputUsd) * 100) / inputUsd,
      rate: +formattedOutputAmount / +formattedInputAmount,
      gasFeeUsd: 0,
      timeEstimate: quoteData.estimatedTime || 0,
      contractAddress: quoteData.approveTo || ZERO_ADDRESS,
      rawQuote: quoteData,
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
    const isFromBitcoin = quote.quoteParams.fromChain === NonEvmChain.Bitcoin

    if (isFromBitcoin) {
      if (!sendBtcFn) throw new Error('Bitcoin wallet is not connected')

      const { data: swapData } = await symbiosisClient.post<SymbiosisSwapResponse>(
        '/swap',
        getSwapBody(quote.quoteParams),
      )
      const depositAddress = (swapData.tx as SymbiosisDepositTx | undefined)?.depositAddress
      if (!depositAddress) throw new Error('Symbiosis deposit address not found')

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

    const { data: swapData } = await symbiosisClient.post<SymbiosisSwapResponse>(
      '/swap',
      getSwapBody(quote.quoteParams),
    )
    const swapTx = swapData.tx as SymbiosisEvmTx | undefined
    if (!swapTx?.to || !swapTx.data) throw new Error('Symbiosis transaction data not found')

    const txHash = await walletClient.sendTransaction({
      chain: undefined,
      account,
      to: swapTx.to as `0x${string}`,
      value: BigInt(swapTx.value || '0'),
      data: swapTx.data as `0x${string}`,
    })
    return {
      sender: quote.quoteParams.sender,
      id: txHash, // specific id for each provider
      sourceTxHash: txHash,
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
    const { data: txData } = await symbiosisClient.get<SymbiosisTxStatusResponse>(
      `/tx/${getChainId(p.sourceChain)}/${p.sourceTxHash}`,
    )

    const statusCode = txData?.status?.code

    if (
      statusCode === SymbiosisTxStatusCode.NotFound &&
      typeof p.sourceChain === 'number' &&
      p.sourceTxHash.startsWith('0x')
    ) {
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
      txHash: txData?.tx?.hash || '',
      status:
        statusCode === SymbiosisTxStatusCode.Success
          ? 'Success'
          : statusCode === SymbiosisTxStatusCode.Reverted
          ? 'Failed'
          : 'Processing',
      amountOut: txData?.tx?.tokenAmount?.amount ? String(txData.tx.tokenAmount.amount) : undefined,
    }
  }
}
