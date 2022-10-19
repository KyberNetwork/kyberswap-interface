import { ChainId } from '@namgold/ks-sdk-core'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { Connection, clusterApiUrl } from '@solana/web3.js'

import SolanaDark from 'assets/networks/solana-network-dark.svg'
import Solana from 'assets/networks/solana-network.svg'
import { AGGREGATOR_API, KS_SETTING_API, SOLANA_NETWORK } from 'constants/env'
import { SolanaNetworkInfo } from 'constants/networks/type'

export const SelectedNetwork = WalletAdapterNetwork[SOLANA_NETWORK]

const NOT_SUPPORT = null
const solanaInfo: { [key in WalletAdapterNetwork]: SolanaNetworkInfo } = {
  [WalletAdapterNetwork.Mainnet]: {
    chainId: ChainId.SOLANA,
    route: 'solana',
    ksSettingRoute: 'solana',
    priceRoute: 'solana',
    name: 'Solana',
    icon: Solana,
    iconSelected: SolanaDark,
    iconDark: NOT_SUPPORT,
    iconDarkSelected: NOT_SUPPORT,
    etherscanUrl: 'https://solscan.io',
    etherscanName: 'Solana scan',
    bridgeURL: 'https://www.portalbridge.com/#/transfer',
    nativeToken: {
      symbol: 'SOL',
      decimal: 9,
      logo: Solana,
      name: 'SOL',
    },
    routerUri: `${AGGREGATOR_API}/solana/route`,
    // classic: {
    //   factory: 'CwzigBwGVn25LdyLsqzSX3iwhPwQXoxYcXxSM4sjWoBU',
    //   pool: 'EKdy97aMrjjxtq4CJh9vN24WuHVsuLz4qtDjyYqttviN',
    //   router: '6VdLuZvVxdgFYQiCQ1VDBBdE27RahXzv2wCxwG4FAzAn',
    // },
    coingeckoNetworkId: 'solana',
    coingeckoNativeTokenId: 'solana',
    tokenListUrl: `${KS_SETTING_API}/v1/tokens?chainIds=${ChainId.SOLANA}&isWhitelisted=${true}`,
    connection: new Connection(clusterApiUrl(WalletAdapterNetwork.Mainnet), { commitment: 'confirmed' }),
    trueSightId: NOT_SUPPORT,
  },
  [WalletAdapterNetwork.Testnet]: {
    chainId: ChainId.SOLANA,
    route: 'solana-testnet',
    ksSettingRoute: 'solana',
    priceRoute: 'solana',
    name: 'Solana Testnet',
    icon: Solana,
    iconSelected: SolanaDark,
    iconDark: NOT_SUPPORT,
    iconDarkSelected: NOT_SUPPORT,
    etherscanUrl: 'https://solscan.io',
    etherscanName: 'Solana scan',
    bridgeURL: 'https://www.portalbridge.com/#/transfer',
    nativeToken: {
      symbol: 'SOL',
      decimal: 9,
      logo: Solana,
      name: 'SOL',
    },
    routerUri: 'http://localhost:3004/solana/route',
    // classic: {
    //   factory: 'CwzigBwGVn25LdyLsqzSX3iwhPwQXoxYcXxSM4sjWoBU',
    //   pool: 'EKdy97aMrjjxtq4CJh9vN24WuHVsuLz4qtDjyYqttviN',
    //   router: '6VdLuZvVxdgFYQiCQ1VDBBdE27RahXzv2wCxwG4FAzAn',
    // },
    coingeckoNetworkId: 'solana',
    coingeckoNativeTokenId: 'solana',
    tokenListUrl: `${KS_SETTING_API}/v1/tokens?chainIds=${ChainId.SOLANA}&isWhitelisted=${true}`,
    connection: new Connection(clusterApiUrl(WalletAdapterNetwork.Testnet), { commitment: 'confirmed' }),
    trueSightId: NOT_SUPPORT,
  },
  [WalletAdapterNetwork.Devnet]: {
    chainId: ChainId.SOLANA,
    route: 'solana-devnet',
    ksSettingRoute: 'solana',
    priceRoute: 'solana',
    name: 'Solana Devnet',
    icon: Solana,
    iconSelected: SolanaDark,
    iconDark: NOT_SUPPORT,
    iconDarkSelected: NOT_SUPPORT,
    etherscanUrl: 'https://solscan.io',
    etherscanName: 'Solana scan',
    bridgeURL: 'https://www.portalbridge.com/#/transfer',
    nativeToken: {
      symbol: 'SOL',
      decimal: 9,
      logo: Solana,
      name: 'SOL',
    },
    routerUri: 'http://localhost:3004/solana/route',
    // classic: {
    //   factory: 'CwzigBwGVn25LdyLsqzSX3iwhPwQXoxYcXxSM4sjWoBU',
    //   pool: 'EKdy97aMrjjxtq4CJh9vN24WuHVsuLz4qtDjyYqttviN',
    //   router: '6VdLuZvVxdgFYQiCQ1VDBBdE27RahXzv2wCxwG4FAzAn',
    // },
    coingeckoNetworkId: 'solana',
    coingeckoNativeTokenId: 'solana',
    tokenListUrl: `${KS_SETTING_API}/v1/tokens?chainIds=${ChainId.SOLANA}&isWhitelisted=${true}`,
    connection: new Connection(clusterApiUrl(WalletAdapterNetwork.Devnet), { commitment: 'confirmed' }),
    trueSightId: NOT_SUPPORT,
  },
}

export default solanaInfo[SelectedNetwork]
