import axios from 'axios'
import { BaseSwapAdapter, QuoteParams } from 'services/crossChain/adapters/BaseSwapAdapter'
import { isSourceTransactionReverted } from 'services/crossChain/adapters/sourceTransaction'
import { evmTransactionSchema } from 'services/crossChain/quote/rawQuote'
import { Quote } from 'services/crossChain/registry'
import { CROSS_CHAIN_FEE_RECEIVER } from 'services/crossChain/utils'
import { WalletClient } from 'viem'
import { z } from 'zod'

import { Currency as AdapterCurrency, Chain, NonEvmChain, NormalizedTxResponse, SwapStatus } from 'types/crossChain'

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
  tokenAmountOutMin?: SymbiosisTokenAmount & { amount: string }
  estimatedTime?: number
  approveTo?: string
  type?: string
  kind?: string
}

const symbiosisEvmQuoteSchema = z.object({
  tx: evmTransactionSchema.extend({ chainId: z.number().optional() }),
})

const symbiosisDepositQuoteSchema = z.object({
  tx: z.object({ depositAddress: z.string().trim().min(1), expiresAt: z.string().optional() }),
})

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
 * Execution requires /v2/swap transaction data from the stream (a deposit address for BTC).
 */
export class SymbiosisAdapter extends BaseSwapAdapter {
  getName(): string {
    return 'Symbiosis'
  }
  getIcon(): string {
    return 'https://app.symbiosis.finance/images/favicon.svg'
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

  async executeSwap(
    { quote }: Quote,
    walletClient: WalletClient,
    _nearWallet?: unknown,
    sendBtcFn?: (params: { recipient: string; amount: string | number }) => Promise<string>,
  ): Promise<NormalizedTxResponse> {
    const isFromBitcoin = quote.quoteParams.fromChain === NonEvmChain.Bitcoin

    if (isFromBitcoin) {
      if (!sendBtcFn) throw new Error('Bitcoin wallet is not connected')

      // The aggregator normally supplies the deposit address. Build only when it is missing.
      const rawQuote = quote.rawQuote as SymbiosisSwapResponse | undefined
      const depositTx = rawQuote?.tx as SymbiosisDepositTx | undefined
      const swapData = depositTx?.depositAddress ? rawQuote : await this.buildFallbackSwap(quote)
      const result = symbiosisDepositQuoteSchema.safeParse(swapData)
      if (!result.success) throw new Error('Symbiosis deposit address not found. Please refresh the quote.')
      const { depositAddress, expiresAt } = result.data.tx
      if (expiresAt !== undefined && !(Date.parse(expiresAt) > Date.now())) {
        throw new Error('Symbiosis deposit address has expired. Please refresh the quote.')
      }

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

    // Prefer the streamed transaction; /swap is only a fallback for missing execution data.
    const rawQuote = quote.rawQuote as SymbiosisSwapResponse | undefined
    const tx = rawQuote?.tx as SymbiosisEvmTx | undefined
    const swapData = tx?.to && tx.data ? rawQuote : await this.buildFallbackSwap(quote)
    const result = symbiosisEvmQuoteSchema.safeParse(swapData)
    if (!result.success) throw new Error('Symbiosis transaction data not found. Please refresh the quote.')
    const swapTx = result.data.tx
    if (swapTx.chainId !== undefined && swapTx.chainId !== quote.quoteParams.fromChain) {
      throw new Error('Symbiosis transaction chain does not match the quote. Please refresh the quote.')
    }

    const txHash = await walletClient.sendTransaction({
      chain: undefined,
      account,
      to: swapTx.to,
      value: BigInt(swapTx.value),
      data: swapTx.data,
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

  private async buildFallbackSwap(quote: Quote['quote']): Promise<SymbiosisSwapResponse> {
    const { data } = await symbiosisClient.post<SymbiosisSwapResponse>('/swap', getSwapBody(quote.quoteParams))
    // A fresh build must still honor the minimum output the user accepted from the stream.
    if (quote.minimumOutputAmount !== undefined) {
      const minimum = data.tokenAmountOutMin?.amount
      if (!minimum || !/^\d+$/.test(minimum) || BigInt(minimum) < quote.minimumOutputAmount) {
        throw new Error('Symbiosis quote has changed. Please refresh the quote.')
      }
    }
    const { fromChain, fromToken } = quote.quoteParams
    const requiresApproval = typeof fromChain === 'number' && !('isNative' in fromToken && fromToken.isNative)
    if (requiresApproval && data.approveTo && data.approveTo.toLowerCase() !== quote.contractAddress.toLowerCase()) {
      throw new Error('Symbiosis approval address has changed. Please refresh the quote.')
    }
    return data
  }

  async getTransactionStatus(p: NormalizedTxResponse): Promise<SwapStatus> {
    const { data: txData } = await symbiosisClient.get<SymbiosisTxStatusResponse>(
      `/tx/${getChainId(p.sourceChain)}/${p.sourceTxHash}`,
    )

    const statusCode = txData?.status?.code

    if (statusCode === SymbiosisTxStatusCode.NotFound && (await isSourceTransactionReverted(p))) {
      return { txHash: '', status: 'Failed' }
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
