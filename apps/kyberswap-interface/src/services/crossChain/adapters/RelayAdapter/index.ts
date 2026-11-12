import {
  AdaptedWallet,
  MAINNET_RELAY_API,
  RelayChain,
  convertViemChainToRelayChain,
  createClient,
  getClient,
} from '@relayprotocol/relay-sdk'
import { BaseSwapAdapter } from 'services/crossChain/adapters/BaseSwapAdapter'
import { isSourceTransactionReverted } from 'services/crossChain/adapters/sourceTransaction'
import { parseRelayQuote } from 'services/crossChain/quote/rawQuote'
import { Quote } from 'services/crossChain/registry'
import { WalletClient } from 'viem'
import {
  abstract,
  arbitrum,
  avalanche,
  base,
  berachain,
  blast,
  bsc,
  fantom,
  hyperEvm,
  linea,
  mainnet,
  mantle,
  monad,
  optimism,
  plasma,
  polygon,
  ronin,
  scroll,
  sonic,
  unichain,
  zksync,
} from 'viem/chains'

import { arc, elysium, robinhood } from 'components/Web3Provider/config'
import { NormalizedTxResponse, SwapStatus } from 'types/crossChain'

const SolanaChainId = 792703809

const solanaChain = {
  id: SolanaChainId,
  name: 'Solana',
  displayName: 'Solana',
  vmType: 'svm' as const,
} as RelayChain

export class RelayAdapter extends BaseSwapAdapter {
  constructor() {
    super()
    createClient({
      baseApiUrl: MAINNET_RELAY_API,
      source: 'kyberswap',
      chains: [
        abstract,
        arbitrum,
        avalanche,
        base,
        berachain,
        blast,
        bsc,
        fantom,
        linea,
        mainnet,
        mantle,
        optimism,
        polygon,
        scroll,
        sonic,
        zksync,
        ronin,
        unichain,
        hyperEvm,
        plasma,
        monad,
        robinhood,
        arc,
        elysium,
      ]
        .map(convertViemChainToRelayChain)
        .concat(solanaChain as any),
    })
  }

  getName(): string {
    return 'Relay'
  }
  getIcon(): string {
    return 'https://storage.googleapis.com/ks-setting-1d682dca/84e906bb-eaeb-45d3-a64c-2aa9c84eb3ea1747759080942.png'
  }
  async executeSwap(quote: Quote, walletClient: WalletClient | AdaptedWallet): Promise<NormalizedTxResponse> {
    // Resolve after the source deposit; Relay's request ID owns destination-status lookup.
    return new Promise<NormalizedTxResponse>((resolve, reject) => {
      getClient()
        .actions.execute({
          quote: parseRelayQuote(quote.quote.rawQuote),
          wallet: walletClient,
          onProgress: ({ currentStep }) => {
            if (currentStep?.id === 'deposit' && currentStep.requestId && currentStep.kind === 'transaction') {
              const txHash = currentStep.items?.[0]?.txHashes?.[0].txHash
              if (txHash) {
                resolve({
                  sender: quote.quote.quoteParams.sender,
                  sourceTxHash: txHash,
                  adapter: this.getName(),
                  id: currentStep.requestId,
                  sourceChain: quote.quote.quoteParams.fromChain,
                  targetChain: quote.quote.quoteParams.toChain,
                  inputAmount: quote.quote.quoteParams.amount,
                  outputAmount: quote.quote.outputAmount.toString(),
                  sourceToken: quote.quote.quoteParams.fromToken,
                  targetToken: quote.quote.quoteParams.toToken,
                  timestamp: new Date().getTime(),
                  amountInUsd: quote.quote.inputUsd,
                  amountOutUsd: quote.quote.outputUsd,
                  platformFeePercent: quote.quote.platformFeePercent,
                  recipient: quote.quote.quoteParams.recipient,
                })
              }
            }
          },
        })
        .catch(reject)
    })
  }

  async getTransactionStatus(p: NormalizedTxResponse): Promise<SwapStatus> {
    if (await isSourceTransactionReverted(p)) return { txHash: '', status: 'Failed' }

    const res = await fetch(`https://api.relay.link/intents/status/v2?requestId=${p.id}`).then(r => r.json())

    return {
      txHash: res.txHashes?.[0] || '',
      status:
        res.status === 'success'
          ? 'Success'
          : res.status === 'refund'
          ? 'Refunded'
          : res.status === 'failure'
          ? 'Failed'
          : 'Processing',
    }
  }
}
