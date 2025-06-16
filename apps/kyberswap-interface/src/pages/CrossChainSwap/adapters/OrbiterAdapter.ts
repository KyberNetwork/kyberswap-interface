import { Currency } from '@kyberswap/ks-sdk-core'
import {
  BaseSwapAdapter,
  Chain,
  NormalizedQuote,
  NormalizedTxResponse,
  SwapStatus,
  EvmQuoteParams,
  NOT_SUPPORTED_CHAINS_PRICE_SERVICE,
} from './BaseSwapAdapter'
import { WalletClient, formatUnits } from 'viem'
import { CROSS_CHAIN_FEE_RECEIVER, ZERO_ADDRESS } from 'constants/index'
import { Quote } from '../registry'
import { MAINNET_NETWORKS } from 'constants/networks'
import { getPublicClient } from '@wagmi/core'
import { wagmiConfig } from 'components/Web3Provider'

interface Step {
  action: string
  tx: {
    data: string
    to: string
    value: string
  }
}

export class OrbiterAdapter extends BaseSwapAdapter {
  constructor() {
    super()
  }

  getName(): string {
    return 'Orbiter'
  }
  getIcon(): string {
    return 'https://www.orbiter.finance/favicon.ico'
  }
  getSupportedChains(): Chain[] {
    return [...MAINNET_NETWORKS]
  }

  getSupportedTokens(_sourceChain: Chain, _destChain: Chain): Currency[] {
    return []
  }

  async getQuote(params: EvmQuoteParams): Promise<NormalizedQuote> {
    const body = {
      sourceChainId: params.fromChain.toString(),
      destChainId: params.toChain.toString(),
      sourceToken: params.fromToken.isNative ? ZERO_ADDRESS : params.fromToken.address,
      destToken: params.toToken.isNative ? ZERO_ADDRESS : params.toToken.address,
      amount: params.amount.toString(),
      userAddress: params.sender,
      targetRecipient: params.recipient,
      slippage: (params.slippage * 100) / 10_000,
      feeConfig: {
        feeRecipient: CROSS_CHAIN_FEE_RECEIVER,
        feePercent: (params.feeBps / 10000).toString(),
      },
    }
    const res = await fetch(`https://api.orbiter.finance/sdk/swap/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
      .then(res => res.json())
      .then(res => res.result)

    const formattedOutputAmount = formatUnits(BigInt(res.details?.destTokenAmount || '0'), params.toToken.decimals)
    const formattedInputAmount = formatUnits(BigInt(params.amount), params.fromToken.decimals)

    const inputUsd = NOT_SUPPORTED_CHAINS_PRICE_SERVICE.includes(params.fromChain)
      ? Number(res.details?.sourceAmountUSD || 0)
      : params.tokenInUsd * +formattedInputAmount
    const outputUsd = NOT_SUPPORTED_CHAINS_PRICE_SERVICE.includes(params.toChain)
      ? Number(res.details?.destAmountUSD || 0)
      : params.tokenOutUsd * +formattedOutputAmount

    const haveApproval = res.steps.some((step: Step) => step.action === 'approve')
    const approvalContract = res.steps.find((step: Step) => step.action === 'swap' || step.action === 'bridge')

    return {
      quoteParams: params,
      outputAmount: BigInt(res.details?.destTokenAmount || '0'),
      formattedOutputAmount,
      inputUsd,
      outputUsd,
      priceImpact: !inputUsd || !outputUsd ? NaN : ((inputUsd - outputUsd) * 100) / inputUsd,
      //rate: Number(resp.details?.rate || 0),
      rate: +formattedOutputAmount / +formattedInputAmount,
      gasFeeUsd: 0,
      timeEstimate: 10,
      contractAddress: haveApproval ? approvalContract?.tx.to || ZERO_ADDRESS : ZERO_ADDRESS,
      rawQuote: res,
      protocolFee: 0,
      platformFeePercent: (params.feeBps * 100) / 10000,
    }
  }

  async executeSwap({ quote }: Quote, walletClient: WalletClient): Promise<NormalizedTxResponse> {
    const steps = quote.rawQuote.steps.filter((st: Step) => st.action !== 'approve') // already approve before

    const account = walletClient.account?.address
    if (!account) throw new Error('WalletClient account is not defined')
    const txs = await Promise.all(
      steps.map(async (step: Step) => {
        const tx = await walletClient.sendTransaction({
          chain: undefined,
          account,
          to: step.tx.to as `0x${string}`,
          value: BigInt(step.tx.value),
          data: step.tx.data as `0x${string}`,
        })
        return tx
      }),
    )

    if (!txs || txs.length === 0) throw new Error('No transactions found after executing swap steps')

    return {
      sender: quote.quoteParams.sender,
      sourceTxHash: txs[txs.length - 1],
      adapter: this.getName(),
      id: txs[txs.length - 1],
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

    const res = await fetch(`https://api.orbiter.finance/transaction/${p.id}`).then(r => r.json())
    return {
      txHash: res.result.targetId || '',
      // this is from orbiter source code, their docs dont have info for this
      // https://github.com/Orbiter-Finance/OrbiterFE-V2/blob/2b35399aad581e666c45a829e0151485f4007c93/src/views/statistics/LatestTransactions.vue#L115
      status: res.result.opStatus !== 98 && res.result.opStatus !== 99 ? 'Processing' : 'Success',
    }
  }
}
