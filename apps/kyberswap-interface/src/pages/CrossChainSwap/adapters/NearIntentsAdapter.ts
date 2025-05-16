import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { useWalletSelector } from '@near-wallet-selector/react-hook'
import {
  BaseSwapAdapter,
  Chain,
  NormalizedQuote,
  NormalizedTxResponse,
  SwapStatus,
  NonEvmChain,
  NearQuoteParams,
} from './BaseSwapAdapter'
import { WalletClient, formatUnits } from 'viem'
import { CROSS_CHAIN_FEE_RECEIVER, ZERO_ADDRESS } from 'constants/index'
import { Quote } from '../registry'
import { OneClickService, OpenAPI, QuoteRequest } from '@defuse-protocol/one-click-sdk-typescript'

export const MappingChainIdToBlockChain: Record<string, string> = {
  [NonEvmChain.Bitcoin]: 'btc',
  [ChainId.MAINNET]: 'eth',
  [ChainId.ARBITRUM]: 'arb',
  [ChainId.BSCMAINNET]: 'bsc',
  [ChainId.BERA]: 'bera',
  [ChainId.MATIC]: 'pol',
  [ChainId.BASE]: 'base',
}

const erc20Abi = [
  {
    inputs: [
      { type: 'address', name: 'recipient' },
      { type: 'uint256', name: 'amount' },
    ],
    name: 'transfer',
    outputs: [{ type: 'bool', name: '' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

export class NearIntentsAdapter extends BaseSwapAdapter {
  constructor() {
    super()
    // Initialize the API client
    OpenAPI.BASE = 'https://1click.chaindefuser.com'
  }

  getName(): string {
    return 'Near Intents'
  }
  getIcon(): string {
    return 'https://storage.googleapis.com/ks-setting-1d682dca/000c677f-2ebc-44cc-8d76-e4c6d07627631744962669170.png'
  }
  getSupportedChains(): Chain[] {
    return [NonEvmChain.Bitcoin, NonEvmChain.Near, ...Object.keys(MappingChainIdToBlockChain).map(Number)]
  }

  getSupportedTokens(_sourceChain: Chain, _destChain: Chain): Currency[] {
    return []
  }

  async getQuote(params: NearQuoteParams): Promise<NormalizedQuote> {
    const deadline = new Date()
    deadline.setSeconds(deadline.getSeconds() + 60 * 20)

    const fromAssetId =
      'assetId' in params.fromToken
        ? params.fromToken.assetId === 'near'
          ? 'nep141:wrap.near'
          : params.fromToken.assetId
        : params.nearTokens.find(token => {
            const blockchain = MappingChainIdToBlockChain[params.fromChain as ChainId]
            return (
              token.blockchain === blockchain &&
              ((params.fromToken as any).isNative
                ? token.symbol.toLowerCase() === params.fromToken.symbol?.toLowerCase() &&
                  token.assetId.includes('omft')
                : token.contractAddress?.toLowerCase() === (params.fromToken as any).wrapped?.address.toLowerCase())
            )
          })?.assetId

    const toAssetId =
      'assetId' in params.toToken
        ? params.toToken.assetId === 'near'
          ? 'nep141:wrap.near'
          : params.toToken.assetId
        : params.nearTokens.find(token => {
            const blockchain = MappingChainIdToBlockChain[params.toChain as ChainId]
            return (
              token.blockchain === blockchain &&
              ((params.toToken as any).isNative
                ? token.symbol.toLowerCase() === params.toToken.symbol?.toLowerCase() && token.assetId.includes('omft')
                : token.contractAddress?.toLowerCase() === (params.toToken as any).wrapped?.address.toLowerCase())
            )
          })?.assetId

    if (!fromAssetId || !toAssetId) {
      throw new Error('not supported tokens')
    }

    // Create a quote request
    const quoteRequest: QuoteRequest = {
      dry: false,
      deadline: deadline.toISOString(),
      slippageTolerance: params.slippage,
      swapType: QuoteRequest.swapType.EXACT_INPUT,

      originAsset: fromAssetId,
      depositType: QuoteRequest.depositType.ORIGIN_CHAIN,

      destinationAsset: toAssetId,
      amount: params.amount,

      refundTo: params.sender,
      refundType: QuoteRequest.refundType.ORIGIN_CHAIN,

      recipient: params.recipient,
      recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
      appFees: [
        {
          recipient: CROSS_CHAIN_FEE_RECEIVER.toLowerCase(),
          fee: params.feeBps,
        },
      ],
    }

    const quote = await OneClickService.getQuote(quoteRequest)
    const formattedInputAmount = formatUnits(BigInt(params.amount), params.fromToken.decimals)
    const formattedOutputAmount = formatUnits(BigInt(quote.quote.amountOut), params.toToken.decimals)
    const inputUsd = +quote.quote.amountInUsd
    const outputUsd = +quote.quote.amountOutUsd

    return {
      quoteParams: params,
      outputAmount: BigInt(quote.quote.amountOut),
      formattedOutputAmount,
      inputUsd: +quote.quote.amountInUsd,
      outputUsd: +quote.quote.amountOutUsd,
      priceImpact: (Math.abs(outputUsd - inputUsd) * 100) / inputUsd,
      rate: +formattedOutputAmount / +formattedInputAmount,
      gasFeeUsd: 0,
      timeEstimate: quote.quote.timeEstimate || 0,
      // Near intent dont need to approve, we send token to contract directly
      contractAddress: ZERO_ADDRESS,
      rawQuote: quote,
      protocolFee: 0,
      platformFeePercent: (params.feeBps * 100) / 10_000,
    }
  }

  async executeSwap(
    { quote }: Quote,
    walletClient: WalletClient,
    nearWallet?: ReturnType<typeof useWalletSelector>,
    sendBtcFn?: (params: { recipient: string; amount: string | number }) => Promise<string>,
  ): Promise<NormalizedTxResponse> {
    const params = {
      id: quote.rawQuote.quote.depositAddress, // specific id for each provider
      adapter: this.getName(),
      sourceChain: quote.quoteParams.fromChain,
      targetChain: quote.quoteParams.toChain,
      inputAmount: quote.quoteParams.amount,
      outputAmount: quote.outputAmount.toString(),
      sourceToken: quote.quoteParams.fromToken,
      targetToken: quote.quoteParams.toToken,
      timestamp: new Date().getTime(),
    }

    if (quote.quoteParams.fromChain === NonEvmChain.Bitcoin) {
      return new Promise<NormalizedTxResponse>(async (resolve, reject) => {
        if (!sendBtcFn) {
          reject('Not connected')
          return
        }

        try {
          const tx = await sendBtcFn({
            recipient: quote.rawQuote.quote.depositAddress,
            amount: quote.quoteParams.amount,
          })
          await OneClickService.submitDepositTx({
            txHash: tx,
            depositAddress: quote.rawQuote.quote.depositAddress,
          }).catch(e => {
            console.log('NearIntents submitDepositTx failed', e)
          })
          resolve({
            ...params,
            sourceTxHash: tx,
          })
        } catch (e) {
          console.log(e)
          reject(e)
          return
        }
      })
    }

    if (quote.quoteParams.fromChain === NonEvmChain.Near) {
      return new Promise<NormalizedTxResponse>(async (resolve, reject) => {
        if (!nearWallet || !nearWallet.signedAccountId) {
          reject('Not connected')
          return
        }
        const isNative = (quote.quoteParams.fromToken as any).assetId === 'near'

        const transactions: any = []
        if (!isNative)
          transactions.push({
            signerId: nearWallet.signedAccountId,
            receiverId: (quote.quoteParams.fromToken as any).contractAddress,
            actions: [
              {
                type: 'FunctionCall',
                params: {
                  methodName: 'storage_deposit',
                  args: { account_id: quote.rawQuote.quote.depositAddress, registration_only: true },
                  gas: '30000000000000',
                  deposit: '1250000000000000000000', // 0.00125 NEAR
                },
              },
            ],
          })

        transactions.push({
          signerId: nearWallet.signedAccountId,
          receiverId: isNative
            ? quote.rawQuote.quote.depositAddress
            : (quote.quoteParams.fromToken as any).contractAddress,
          actions: [
            isNative
              ? {
                  type: 'Transfer',
                  params: {
                    deposit: quote.quoteParams.amount,
                  },
                }
              : {
                  type: 'FunctionCall',
                  params: {
                    methodName: 'ft_transfer',
                    args: {
                      receiver_id: quote.rawQuote.quote.depositAddress,
                      amount: quote.quoteParams.amount,
                    },
                    gas: '30000000000000',
                    deposit: '1',
                  },
                },
          ],
        })

        await nearWallet
          .signAndSendTransactions({
            transactions,
          })
          .catch(e => {
            console.log('NearIntents signAndSendTransactions failed', e)
            reject(e)
          })

        resolve({
          ...params,
          sourceTxHash: quote.rawQuote.quote.depositAddress,
        })
      })
    }

    return new Promise<NormalizedTxResponse>(async (resolve, reject) => {
      try {
        if (!walletClient || !walletClient.account) reject('Not connected')
        if (quote.quoteParams.sender === ZERO_ADDRESS || quote.quoteParams.recipient === ZERO_ADDRESS)
          reject('Near Intent refundTo or recipient is ZERO ADDRESS')

        const account = walletClient.account?.address as `0x${string}`

        const fromToken = quote.quoteParams.fromToken

        const hash = await ((fromToken as any).isNative
          ? walletClient.sendTransaction({
              to: quote.rawQuote.quote.depositAddress,
              value: BigInt(quote.quoteParams.amount),
              chain: undefined,
              account,
            })
          : walletClient.writeContract({
              address: ('contractAddress' in fromToken
                ? fromToken.contractAddress
                : (fromToken as any).wrapped.address) as `0x${string}`,
              abi: erc20Abi,
              functionName: 'transfer',
              args: [quote.rawQuote.quote.depositAddress, quote.quoteParams.amount],
              chain: undefined,
              account,
            }))
        await OneClickService.submitDepositTx({
          txHash: hash,
          depositAddress: quote.rawQuote.quote.depositAddress,
        }).catch(e => {
          console.log('NearIntents submitDepositTx failed', e)
        })

        resolve({
          ...params,
          sourceTxHash: hash,
        })
      } catch (e) {
        reject(e)
      }
    })
  }

  async getTransactionStatus(p: NormalizedTxResponse): Promise<SwapStatus> {
    const res = await OneClickService.getExecutionStatus(p.id)

    return {
      txHash: res.swapDetails?.destinationChainTxHashes[0]?.hash || '',
      status:
        res.status === 'SUCCESS'
          ? 'Success'
          : res.status === 'FAILED'
          ? 'Failed'
          : res.status === 'REFUNDED'
          ? 'Refunded'
          : 'Processing',
    }
  }
}
