import { ChainId } from '@namgold/ks-sdk-core'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { Connection, clusterApiUrl } from '@solana/web3.js'

import SolanaDark from 'assets/networks/solana-network-dark.svg'
import Solana from 'assets/networks/solana-network.svg'
import { SOLANA_NETWORK } from 'constants/env'
import { SolanaNetworkInfo } from 'constants/networks/type'

const SupportedSolanaNetworks = [
  // WalletAdapterNetwork.Mainnet, //enable when filled solanaInfo configs
  WalletAdapterNetwork.Testnet,
  // WalletAdapterNetwork.Devnet, //enable when filled solanaInfo configs
] as const
type SupportedSolanaNetwork = typeof SupportedSolanaNetworks[number]

export const SelectedNetwork = SupportedSolanaNetworks.includes(SOLANA_NETWORK as any)
  ? (SOLANA_NETWORK as SupportedSolanaNetwork)
  : SupportedSolanaNetworks[0]

const endpoint = clusterApiUrl(SelectedNetwork)
const connection = new Connection(endpoint, { commitment: 'confirmed' })

const EMPTY = ''
const NOT_SUPPORT = null
const solanaInfo: { [key in SupportedSolanaNetwork]: SolanaNetworkInfo } = {
  [WalletAdapterNetwork.Testnet]: {
    chainId: ChainId.SOLANA,
    route: 'solana',
    name: 'Solana',
    icon: Solana,
    iconSelected: SolanaDark,
    iconDark: NOT_SUPPORT,
    iconDarkSelected: NOT_SUPPORT,
    etherscanUrl: 'https://solscan.io',
    etherscanName: 'Solana scan',
    bridgeURL: EMPTY,
    nativeToken: {
      symbol: 'SOL',
      decimal: 9,
      logo: Solana,
      name: 'SOL',
    },
    routerUri: EMPTY,
    classic: {
      factory: 'CwzigBwGVn25LdyLsqzSX3iwhPwQXoxYcXxSM4sjWoBU',
      pool: 'EKdy97aMrjjxtq4CJh9vN24WuHVsuLz4qtDjyYqttviN',
      router: '6VdLuZvVxdgFYQiCQ1VDBBdE27RahXzv2wCxwG4FAzAn',
    },
    coingeckoNetworkId: 'solana',
    coingeckoNativeTokenId: 'solana',
    deBankSlug: 'solana',
    tokenListUrl:
      'https://raw.githubusercontent.com/namgold/dmm-solana-interface-concept/master/src/constants/tokenlists/solana.testnet.tokenlist.json',
    connection,
    trueSightId: NOT_SUPPORT,
  },
}

export default solanaInfo[SelectedNetwork]
