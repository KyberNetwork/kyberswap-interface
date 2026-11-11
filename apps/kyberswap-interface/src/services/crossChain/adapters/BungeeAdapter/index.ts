import { BaseSwapAdapter } from 'services/crossChain/adapters/BaseSwapAdapter'
import { getBungeeStatus } from 'services/crossChain/adapters/BungeeAdapter/api'
import {
  getSocketTxRoute,
  normalizeSocketStatus,
  parseSocketQuote,
} from 'services/crossChain/adapters/BungeeAdapter/utils'
import { isSourceTransactionReverted } from 'services/crossChain/adapters/sourceTransaction'
import { Quote } from 'services/crossChain/registry'
import { isWrappedToken } from 'services/crossChain/utils'
import { WalletClient } from 'viem'

import SocketLogo from 'assets/svg/socket_logo.svg'
import { MAINNET_NETWORKS } from 'constants/networks'
import { BitcoinToken, Currency, NonEvmChain, NormalizedTxResponse, SwapStatus } from 'types/crossChain'

export class BungeeAdapter extends BaseSwapAdapter {
  getName(): string {
    return 'Socket'
  }
  getIcon(): string {
    return SocketLogo
  }
  getAliases() {
    return [
      // Older quotes/history may identify this provider as Bungee.
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

  async executeSwap(
    { quote }: Quote,
    walletClient: WalletClient | undefined,
    _nearWallet?: unknown,
    sendBtcFn?: (params: { recipient: string; amount: string | number }) => Promise<string>,
  ): Promise<NormalizedTxResponse> {
    const route = getSocketTxRoute(parseSocketQuote(quote.rawQuote))
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
    if (await isSourceTransactionReverted(params)) return { txHash: '', status: 'Failed' }

    const response = await getBungeeStatus({ quoteId: params.id })
    const data = response.data

    if (!data.success || !data.result) {
      throw new Error(`Status error: ${data.message || 'Unknown error'}`)
    }

    return normalizeSocketStatus(data.result)
  }
}
