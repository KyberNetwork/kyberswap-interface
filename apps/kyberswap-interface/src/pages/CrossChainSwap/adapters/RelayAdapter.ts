import { Currency } from '@kyberswap/ks-sdk-core'
import {
  BaseSwapAdapter,
  Chain,
  NormalizedQuote,
  NormalizedTxResponse,
  SwapStatus,
  NOT_SUPPORTED_CHAINS_PRICE_SERVICE,
  NonEvmChain,
  QuoteParams,
} from './BaseSwapAdapter'
import {
  MAINNET_RELAY_API,
  getClient,
  createClient,
  convertViemChainToRelayChain,
  RelayChain,
} from '@reservoir0x/relay-sdk'
import { WalletClient, formatUnits } from 'viem'
import { CROSS_CHAIN_FEE_RECEIVER, ZERO_ADDRESS } from 'constants/index'
import { Quote } from '../registry'
import { MAINNET_NETWORKS } from 'constants/networks'
import {
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
} from 'viem/chains'
import { hyperevm } from 'components/Web3Provider'
import { SolanaToken } from 'state/crossChainSwap'

const SolanaChainId = 792703809

const solanaChain = {
  id: SolanaChainId,
  name: 'Solana',
  displayName: 'Solana',
  vmType: 'svm' as const,
  // httpRpcUrl?: string;
  // wsRpcUrl?: string;
  // explorerUrl?: string;
  // explorerQueryParams?: {
  //     [key: string]: unknown;
  // } | null;
  // explorerPaths?: {
  //     transaction?: string;
  // } | null;
  // icon?: {
  //     dark?: string;
  //     light?: string;
  //     squaredDark?: string;
  //     squaredLight?: string;
  // };
  // currency?: {
  //     id?: string;
  //     symbol?: string;
  //     name?: string;
  //     address?: string;
  //     decimals?: number;
  //     supportsBridging?: boolean;
  // };
  // depositEnabled?: boolean;
  // blockProductionLagging?: boolean;
  // erc20Currencies?: RelayAPIChain['erc20Currencies'];
  // featuredTokens?: RelayAPIChain['featuredTokens'];
  // tags?: RelayAPIChain['tags'];
  // iconUrl?: string | null;
  // logoUrl?: string | null;
  // brandColor?: string | null;
  // vmType?: ChainVM;
  // viemChain?: Chain;
  // baseChainId?: number | null;
} as RelayChain

export class RelayAdapter extends BaseSwapAdapter {
  constructor() {
    super()
    createClient({
      baseApiUrl: MAINNET_RELAY_API,
      source: 'kyberswap',
      chains: [
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
        hyperevm,
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
  getSupportedChains(): Chain[] {
    return [NonEvmChain.Solana, ...MAINNET_NETWORKS]
  }

  getSupportedTokens(_sourceChain: Chain, _destChain: Chain): Currency[] {
    return []
  }

  async getQuote(params: QuoteParams): Promise<NormalizedQuote> {
    const evmFromToken = params.fromToken as Currency
    const evmToToken = params.toToken as Currency
    const currency =
      params.fromChain === 'solana'
        ? (params.fromToken as SolanaToken).id
        : evmFromToken.isNative
        ? ZERO_ADDRESS
        : evmFromToken.wrapped.address

    const toCurrency =
      params.toChain === 'solana'
        ? (params.toToken as SolanaToken).id
        : evmToToken.isNative
        ? ZERO_ADDRESS
        : evmToToken.wrapped.address

    const resp = await getClient().actions.getQuote({
      chainId: params.fromChain === 'solana' ? SolanaChainId : +params.fromChain,
      toChainId: params.toChain === 'solana' ? SolanaChainId : +params.toChain,
      currency,
      toCurrency,
      amount: params.amount,
      tradeType: 'EXACT_INPUT',
      wallet: params.walletClient,
      recipient: params.recipient === ZERO_ADDRESS ? undefined : params.recipient,
      options: {
        appFees: [
          {
            recipient: CROSS_CHAIN_FEE_RECEIVER,
            fee: params.feeBps.toString(),
          },
        ],
      },
    })

    const formattedOutputAmount = formatUnits(BigInt(resp.details?.currencyOut?.amount || '0'), params.toToken.decimals)
    const formattedInputAmount = formatUnits(BigInt(params.amount), params.fromToken.decimals)
    const inputUsd = NOT_SUPPORTED_CHAINS_PRICE_SERVICE.includes(params.fromChain)
      ? Number(resp.details?.currencyIn?.amountUsd || 0)
      : params.tokenInUsd * +formattedInputAmount
    const outputUsd = NOT_SUPPORTED_CHAINS_PRICE_SERVICE.includes(params.toChain)
      ? Number(resp.details?.currencyOut?.amountUsd || 0)
      : params.tokenOutUsd * +formattedOutputAmount

    return {
      quoteParams: params,
      outputAmount: BigInt(resp.details?.currencyOut?.amount || '0'),
      formattedOutputAmount,
      inputUsd,
      outputUsd,
      priceImpact: !inputUsd || !outputUsd ? NaN : ((inputUsd - outputUsd) * 100) / inputUsd,
      //rate: Number(resp.details?.rate || 0),
      rate: +formattedOutputAmount / +formattedInputAmount,
      gasFeeUsd: Number(resp.fees?.gas?.amountUsd || 0),
      timeEstimate: resp.details?.timeEstimate || 0,
      // Relay dont need to approve, we send token to contract directly
      contractAddress: ZERO_ADDRESS,
      rawQuote: resp,
      protocolFee: 0,
      platformFeePercent: (params.feeBps * 100) / 10000,
    }
  }

  async executeSwap(quote: Quote, walletClient: WalletClient): Promise<NormalizedTxResponse> {
    return new Promise<NormalizedTxResponse>((resolve, reject) => {
      getClient()
        .actions.execute({
          quote: quote.quote.rawQuote,
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
                })
              }
            }
          },
        })
        .catch(reject) // Make sure errors from execute are also caught
    })
  }

  async getTransactionStatus(p: NormalizedTxResponse): Promise<SwapStatus> {
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
