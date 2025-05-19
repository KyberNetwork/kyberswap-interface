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
import { CROSS_CHAIN_FEE_RECEIVER, ZERO_ADDRESS } from 'constants/index'
import { Quote } from '../registry'
import { TOKEN_API_URL } from 'constants/env'
import { NativeCurrencies } from 'constants/tokens'

const DEBRIDGE_API = 'https://dln.debridge.finance/v1.0/dln/order'

export class DeBridgeAdapter extends BaseSwapAdapter {
  constructor() {
    super()
  }

  getName(): string {
    return 'deBridge'
  }
  getIcon(): string {
    return 'https://app.debridge.finance/assets/images/meta-deswap/favicon-32x32.png'
  }
  getSupportedChains(): Chain[] {
    return [
      ChainId.MAINNET,
      ChainId.BSCMAINNET,
      ChainId.MATIC,
      ChainId.AVAXMAINNET,
      ChainId.ARBITRUM,
      ChainId.OPTIMISM,
      ChainId.LINEA,
      ChainId.BASE,
      ChainId.MANTLE,
      ChainId.BERA,
      ChainId.SONIC,
    ]
  }

  getSupportedTokens(_sourceChain: Chain, _destChain: Chain): Currency[] {
    return []
  }

  async getQuote(params: EvmQuoteParams): Promise<NormalizedQuote> {
    let p: Record<string, string | boolean | number> = {
      srcChainId: params.fromChain,
      srcChainTokenIn: params.fromToken.isNative ? ZERO_ADDRESS : params.fromToken.address,
      srcChainTokenInAmount: params.amount,

      dstChainId: params.toChain,
      dstChainTokenOut: params.toToken.isNative ? ZERO_ADDRESS : params.toToken.address,
      dstChainTokenOutAmount: 'auto',

      enableEstimate: false,
      prependOperatingExpenses: false,

      // TODO: ask product to generate affiliate
      affiliate: 31956,
      affiliateFeePercent: (params.feeBps * 100) / 10_000,
      affiliateFeeRecipient: CROSS_CHAIN_FEE_RECEIVER,
    }

    let path = 'quote'
    if (params.recipient && params.sender && params.sender !== ZERO_ADDRESS) {
      path = 'create-tx'
      p = {
        ...p,
        srcChainOrderAuthorityAddress: params.sender,
        dstChainOrderAuthorityAddress: params.sender,
        dstChainTokenOutRecipient: params.recipient,
      }
    }

    // Convert the parameters object to URL query string
    const queryParams = new URLSearchParams()
    for (const [key, value] of Object.entries(p)) {
      queryParams.append(key, String(value))
    }

    const r = await fetch(`${DEBRIDGE_API}/${path}?${queryParams.toString()}`).then(res => res.json())
    if (!r.estimation) {
      throw new Error('No route found')
    }

    //const inputUsd = r.estimation.srcChainTokenIn.approximateUsdValue
    //const outputUsd = r.estimation.dstChainTokenOut.recommendedApproximateUsdValue

    const formattedInputAmount = formatUnits(BigInt(params.amount), params.fromToken.decimals)
    const formattedOutputAmount = formatUnits(
      BigInt(r.estimation.dstChainTokenOut.recommendedAmount),
      params.toToken.decimals,
    )

    const inputUsd = params.tokenInUsd * +formattedInputAmount
    const outputUsd = params.tokenOutUsd * +formattedOutputAmount

    // const affiliateFee = r.estimation.costsDetails.find(
    //   (item: { payload: { feeAmount: string; feeBps: string }; tokenIn: string; type: string }) =>
    //     item.type === 'AffiliateFee',
    // )
    //
    // let platformFee = 0
    // const { srcChainTokenIn, srcChainTokenOut } = r.estimation
    // if (affiliateFee?.tokenIn === srcChainTokenIn?.address) {
    //   platformFee =
    //     (Number(((BigInt(affiliateFee.payload.feeAmount) * 1000n) / BigInt(srcChainTokenIn.amount)).toString()) *
    //       srcChainTokenIn.approximateUsdValue) /
    //     1000
    // } else if (affiliateFee?.tokenIn === srcChainTokenOut?.address) {
    //   platformFee =
    //     (Number(((BigInt(affiliateFee.payload.feeAmount) * 1000n) / BigInt(srcChainTokenOut.amount)).toString()) *
    //       srcChainTokenOut.approximateUsdValue) /
    //     1000
    // }

    const fixFee = r.fixFee

    const wrappedAddress = NativeCurrencies[params.fromChain as ChainId].wrapped.address
    const nativePrice = await fetch(`${TOKEN_API_URL}/v1/public/tokens/prices`, {
      method: 'POST',
      body: JSON.stringify({
        [params.fromChain]: [wrappedAddress],
      }),
    })
      .then(res => res.json())
      .then(res => {
        return res?.data?.[params.fromChain]?.[wrappedAddress]?.PriceBuy || 0
      })

    const protocolFee =
      Number(nativePrice) * (Number(fixFee) / 10 ** NativeCurrencies[params.fromChain as ChainId].decimals)

    return {
      quoteParams: params,
      outputAmount: BigInt(r.estimation.dstChainTokenOut.recommendedAmount),

      formattedOutputAmount,

      inputUsd,
      outputUsd,

      priceImpact: (Math.abs(outputUsd - inputUsd) * 100) / inputUsd,
      rate: +formattedOutputAmount / +formattedInputAmount,

      gasFeeUsd: 0,
      timeEstimate: r.order.approximateFulfillmentDelay,
      contractAddress: r.tx.allowanceTarget || r.tx.to,
      rawQuote: r,

      protocolFee,
      platformFeePercent: (params.feeBps * 100) / 10_000,
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
      id: quote.rawQuote.orderId, // specific id for each provider
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
    const r = await fetch(`${DEBRIDGE_API}/${p.id}/status`).then(res => res.json())
    return {
      status: r.status === 'Fulfilled' ? 'Success' : 'Processing',
      txHash: p.id,
    }
  }
}
