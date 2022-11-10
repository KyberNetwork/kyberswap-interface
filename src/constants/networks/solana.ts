import { ChainId } from '@namgold/ks-sdk-core'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'

import SolanaDark from 'assets/networks/solana-network-dark.svg'
import Solana from 'assets/networks/solana-network.svg'
import { AGGREGATOR_API, KS_SETTING_API } from 'constants/env'
import { SolanaNetworkInfo } from 'constants/networks/type'

export const SelectedNetwork = WalletAdapterNetwork.Mainnet

const NOT_SUPPORT = null
const solanaInfo: SolanaNetworkInfo = {
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
    name: 'SOL',
    logo: Solana,
    decimal: 9,
    minForGas: 10 ** 5,
  },
  routerUri: `${AGGREGATOR_API}/solana/route/encode`,
  aggregatorProgramAddress: 'GmgkeeJtcjHgeiSDdT5gxznUDr5ygq9jo8tmA4ny7ziv',
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
  serumPool: new PublicKey('9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin'),
}

export default solanaInfo
