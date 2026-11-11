import { AcrossClient, createAcrossClient } from '@across-protocol/app-sdk'
import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { WalletAdapterProps } from '@solana/wallet-adapter-base'
import { Connection } from '@solana/web3.js'
import { getAcrossDepositStatus } from 'services/crossChain/adapters/AcrossAdapter/api'
import { AcrossWalletClient } from 'services/crossChain/adapters/AcrossAdapter/types'
import { getAcrossFillTxHash, mapAcrossDepositStatus } from 'services/crossChain/adapters/AcrossAdapter/utils'
import { BaseSwapAdapter } from 'services/crossChain/adapters/BaseSwapAdapter'
import { parseAcrossQuote } from 'services/crossChain/quote/rawQuote'
import { Quote } from 'services/crossChain/registry'
import { isNativeToken, isWrappedToken } from 'services/crossChain/utils'
import { WalletClient } from 'viem'
import {
  arbitrum,
  base,
  blast,
  bsc,
  linea,
  mainnet,
  monad,
  optimism,
  plasma,
  polygon,
  scroll,
  unichain,
  zksync,
} from 'viem/chains'

import { arc, robinhood } from 'components/Web3Provider/config'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { NormalizedTxResponse, SwapStatus } from 'types/crossChain'

export class AcrossAdapter extends BaseSwapAdapter {
  private acrossClient: AcrossClient

  constructor() {
    super()
    this.acrossClient = createAcrossClient({
      integratorId: `0x008a`,
      chains: [
        mainnet,
        arbitrum,
        bsc,
        optimism,
        linea,
        polygon,
        zksync,
        base,
        scroll,
        blast,
        unichain,
        plasma,
        monad,
        robinhood,
        arc,
      ],
      rpcUrls: [
        ChainId.MAINNET,
        ChainId.ARBITRUM,
        ChainId.BSCMAINNET,
        ChainId.OPTIMISM,
        ChainId.LINEA,
        ChainId.MATIC,
        ChainId.ZKSYNC,
        ChainId.BASE,
        ChainId.SCROLL,
        ChainId.BLAST,
        ChainId.UNICHAIN,
        ChainId.MONAD,
        ChainId.ROBINHOOD,
        ChainId.ARC,
      ].reduce((acc, cur) => {
        return { ...acc, [cur]: NETWORKS_INFO[cur].defaultRpcUrl }
      }, {}),
    })
  }

  getName(): string {
    return 'Across'
  }
  getIcon(): string {
    return 'https://storage.googleapis.com/ks-setting-1d682dca/49319cc3-81fd-4d70-9870-c99e8b67ba221778733646226.png'
  }

  canSupport(category: string, tokenIn?: Currency, tokenOut?: Currency): boolean {
    if (!tokenIn || !tokenOut) {
      return false
    }

    if (category === 'stablePair') {
      return true
    }

    const isTokenInNativeOrWrapped = isNativeToken(tokenIn) || isWrappedToken(tokenIn)
    const isTokenOutNativeOrWrapped = isNativeToken(tokenOut) || isWrappedToken(tokenOut)

    if (isTokenInNativeOrWrapped && isTokenOutNativeOrWrapped) {
      return true
    }

    console.warn(`Across does not support swap from ${tokenIn.symbol || 'unknown'} to ${tokenOut.symbol || 'unknown'}`)

    return false
  }

  async executeSwap(
    quote: Quote,
    walletClient: WalletClient,
    _nearWalletClient?: unknown,
    _sendBtcFn?: (params: { recipient: string; amount: string | number }) => Promise<string>,
    _sendTransaction?: WalletAdapterProps['sendTransaction'],
    _connection?: Connection,
  ): Promise<NormalizedTxResponse> {
    const normalizedQuote = quote.quote
    const quoteParams = normalizedQuote.quoteParams

    // Resolve on the source swap hash; destination settlement is tracked separately.
    return new Promise<NormalizedTxResponse>((resolve, reject) => {
      this.acrossClient
        .executeSwapQuote({
          walletClient: walletClient as AcrossWalletClient,
          swapQuote: parseAcrossQuote(normalizedQuote.rawQuote),
          onProgress: progress => {
            if (progress.step === 'swap' && 'txHash' in progress) {
              resolve({
                sender: quoteParams.sender,
                sourceTxHash: progress.txHash,
                adapter: this.getName(),
                id: progress.txHash,
                sourceChain: quoteParams.fromChain,
                targetChain: quoteParams.toChain,
                inputAmount: quoteParams.amount,
                outputAmount: normalizedQuote.outputAmount.toString(),
                sourceToken: quoteParams.fromToken,
                targetToken: quoteParams.toToken,
                timestamp: new Date().getTime(),
                amountInUsd: normalizedQuote.inputUsd,
                amountOutUsd: normalizedQuote.outputUsd,
                platformFeePercent: normalizedQuote.platformFeePercent,
                recipient: quoteParams.recipient,
              })
            }
          },
        })
        .catch(reject)
    })
  }
  async getTransactionStatus(params: NormalizedTxResponse): Promise<SwapStatus> {
    try {
      const res = await getAcrossDepositStatus(params.sourceTxHash)

      return {
        txHash: getAcrossFillTxHash(res),
        status: mapAcrossDepositStatus(res, { txTimestamp: params.timestamp }),
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
