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
import { CROSS_CHAIN_FEE_RECEIVER, ETHER_ADDRESS } from 'constants/index'
import { Quote } from '../registry'
import { getPublicClient } from '@wagmi/core'
import { wagmiConfig } from 'components/Web3Provider'

const XY_FINANCE_API = 'https://aggregator-api.xy.finance/v1'

export class XYFinanceAdapter extends BaseSwapAdapter {
  constructor() {
    super()
  }

  getName(): string {
    return 'XYFinance'
  }
  getIcon(): string {
    return 'https://xy.finance/img/favicon.ico'
  }
  getSupportedChains(): Chain[] {
    return [
      ChainId.MAINNET,
      ChainId.BSCMAINNET,
      ChainId.MATIC,
      ChainId.FANTOM,
      ChainId.AVAXMAINNET,
      ChainId.ARBITRUM,
      ChainId.OPTIMISM,
      ChainId.ZKSYNC,
      ChainId.LINEA,
      ChainId.BASE,
      ChainId.MANTLE,
      ChainId.SCROLL,
      ChainId.BLAST,
      ChainId.BERA,
      ChainId.SONIC,
      ChainId.UNICHAIN,
    ]
  }

  getSupportedTokens(_sourceChain: Chain, _destChain: Chain): Currency[] {
    return []
  }

  async getQuote(params: EvmQuoteParams): Promise<NormalizedQuote> {
    const p = {
      srcChainId: params.fromChain,
      srcQuoteTokenAddress: params.fromToken.isNative ? ETHER_ADDRESS : params.fromToken.address,
      srcQuoteTokenAmount: params.amount,
      dstChainId: params.toChain,
      dstQuoteTokenAddress: params.toToken.isNative ? ETHER_ADDRESS : params.toToken.address,
      slippage: (params.slippage * 100) / 10_000,
      // bridgeProviders: 'yBridge',

      affiliate: CROSS_CHAIN_FEE_RECEIVER,
      //represents the fee you wish to collect. It is an integer between 0 and 100,000. In this range, 100,000 corresponds to 10%, 10,000 represents 1%, and so on in a similar fashion.
      commissionRate: (params.feeBps / 10_000) * 1_000_000,
    }
    // Convert the parameters object to URL query string
    const queryParams = new URLSearchParams()
    for (const [key, value] of Object.entries(p)) {
      queryParams.append(key, String(value))
    }
    const resp = await fetch(`${XY_FINANCE_API}/quote?${queryParams.toString()}`).then(res => res.json())
    const r = resp?.routes?.sort((a: any, b: any) => {
      return +(BigInt(b.dstQuoteTokenAmount) - BigInt(a.dstQuoteTokenAmount)).toString()
    })?.[0]

    if (!r) {
      throw new Error('No route found')
    }

    const formattedOutputAmount = formatUnits(BigInt(r.dstQuoteTokenAmount), params.toToken.decimals)
    const formattedInputAmount = formatUnits(BigInt(params.amount), params.fromToken.decimals)

    const tokenInUsd = params.tokenInUsd
    const tokenOutUsd = params.tokenOutUsd
    const inputUsd = tokenInUsd * +formattedInputAmount
    const outputUsd = tokenOutUsd * +formattedOutputAmount

    return {
      quoteParams: params,
      outputAmount: BigInt(r.dstQuoteTokenAmount),
      formattedOutputAmount,
      inputUsd,
      outputUsd,
      priceImpact: !inputUsd || !outputUsd ? NaN : ((inputUsd - outputUsd) * 100) / inputUsd,
      rate: +formattedOutputAmount / +formattedInputAmount,
      gasFeeUsd: 0,
      timeEstimate: r.estimatedTransferTime,
      contractAddress: r.contractAddress,
      rawQuote: r,

      protocolFee: 0,
      platformFeePercent: (params.feeBps * 100) / 10_000,
    }
  }

  async executeSwap({ quote }: Quote, walletClient: WalletClient): Promise<NormalizedTxResponse> {
    const account = walletClient.account?.address
    if (!account) throw new Error('WalletClient account is not defined')

    const fromToken = quote.quoteParams.fromToken as Currency
    const toToken = quote.quoteParams.toToken as Currency
    const buildSlippage =
      Math.floor(quote.quoteParams.slippage * 0.9) > 1
        ? Math.floor(quote.quoteParams.slippage * 0.9)
        : quote.quoteParams.slippage

    const p = {
      srcChainId: quote.quoteParams.fromChain,
      srcQuoteTokenAddress: fromToken.isNative ? ETHER_ADDRESS : fromToken.address,
      srcQuoteTokenAmount: quote.quoteParams.amount,
      dstChainId: quote.quoteParams.toChain,
      dstQuoteTokenAddress: toToken.isNative ? ETHER_ADDRESS : toToken.address,
      // slippage: quote.quoteParams.slippage,
      slippage: (buildSlippage * 100) / 10_000,
      receiver: quote.quoteParams.recipient,
      bridgeProvider: quote.rawQuote.bridgeDescription.provider,
      srcBridgeTokenAddress: quote.rawQuote.bridgeDescription.srcBridgeTokenAddress,
      dstBridgeTokenAddress: quote.rawQuote.bridgeDescription.dstBridgeTokenAddress,
      affiliate: CROSS_CHAIN_FEE_RECEIVER,
      //represents the fee you wish to collect. It is an integer between 0 and 100,000. In this range, 100,000 corresponds to 10%, 10,000 represents 1%, and so on in a similar fashion.
      commissionRate: (quote.quoteParams.feeBps / 10_000) * 1_000_000,

      ...(quote.rawQuote.srcSwapDescription ? { srcSwapProvider: quote.rawQuote.srcSwapDescription.provider } : {}),
      ...(quote.rawQuote.dstSwapDescription
        ? {
            dstSwapProvider: quote.rawQuote.dstSwapDescription?.provider,
          }
        : {}),
    }

    // Convert the parameters object to URL query string
    const queryParams = new URLSearchParams()
    for (const [key, value] of Object.entries(p)) {
      queryParams.append(key, String(value))
    }
    const resp = await fetch(`${XY_FINANCE_API}/buildTx?${queryParams.toString()}`).then(res => res.json())

    if (BigInt(resp.route.minReceiveAmount) < BigInt(quote.rawQuote.minReceiveAmount)) {
      throw new Error('Rate has changed')
    }

    if (resp.tx) {
      const tx = await walletClient.sendTransaction({
        chain: undefined,
        account,
        to: resp.tx.to,
        value: resp.tx.value,
        data: resp.tx.data,
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
        sourceToken: fromToken,
        targetToken: toToken,
        timestamp: new Date().getTime(),
      }
    }

    throw new Error('No transaction found')
  }

  async getTransactionStatus(p: NormalizedTxResponse): Promise<SwapStatus> {
    const publicClient = getPublicClient(wagmiConfig, {
      chainId: p.sourceChain as any,
    })
    const receipt = await publicClient?.getTransactionReceipt({
      hash: p.id as `0x${string}`,
    })
    if (receipt.status === 'reverted') {
      return {
        txHash: '',
        status: 'Failed',
      }
    }

    const res = await fetch(`${XY_FINANCE_API}/crossChainStatus?srcChainId=${p.sourceChain}&srcTxHash=${p.id}`).then(
      r => r.json(),
    )

    return {
      txHash: res.tx || '',
      status: res.status === 'Done' ? 'Success' : res.status === 'Refunded' ? 'Refunded' : 'Processing',
    }
  }
}
