import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import {
  BaseSwapAdapter,
  Chain,
  NormalizedQuote,
  NormalizedTxResponse,
  SwapStatus,
  EvmQuoteParams,
} from './BaseSwapAdapter'
import { WalletClient, formatUnits } from 'viem'
import { Quote } from '../registry'
import { ZERO_ADDRESS } from 'constants/index'

const SYMBIOSIS_API = 'https://api.symbiosis.finance/crosschain/v1'

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
  getSupportedChains(): Chain[] {
    return [
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
    }

    const res = await fetch(`${SYMBIOSIS_API}/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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

    return {
      quoteParams: params,
      outputAmount: BigInt(res.tokenAmountOut.amount),
      formattedOutputAmount,
      inputUsd,
      outputUsd,
      priceImpact: res.priceImpact,
      rate: +formattedOutputAmount / +formattedInputAmount,
      gasFeeUsd: 0,
      timeEstimate: res.estimatedTime,
      contractAddress: res.approveTo || ZERO_ADDRESS,
      rawQuote: res,
    }
  }

  async executeSwap({ quote }: Quote, walletClient: WalletClient): Promise<NormalizedTxResponse> {
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

  async getTransactionStatus(p: NormalizedTxResponse): Promise<SwapStatus> {
    const res = await fetch(`${SYMBIOSIS_API}/tx/${p.sourceChain}/${p.sourceTxHash}`).then(r => r.json())
    return {
      txHash: res?.tx?.hash || '',
      status: res.status.code === 0 ? 'Success' : res.status.code === 3 ? 'Failed' : 'Processing',
    }
  }
}
