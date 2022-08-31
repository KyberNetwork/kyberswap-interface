import { ChainId } from '@namgold/ks-sdk-core'

import Solana from 'assets/networks/solana-network.svg'
import { SolanaNetworkInfo } from 'constants/networks/type'

const EMPTY = ''

const solanaInfo: SolanaNetworkInfo = {
  chainId: ChainId.SOLANA,
  route: 'solana',
  name: 'Solana',
  icon: Solana,
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
    pool: 'EKdy97aMrjjxtq4CJh9vN24WuHVsuLz4qtDjyYqttviN',
    factory: 'CwzigBwGVn25LdyLsqzSX3iwhPwQXoxYcXxSM4sjWoBU',
    router: '6VdLuZvVxdgFYQiCQ1VDBBdE27RahXzv2wCxwG4FAzAn',
  },
  coingeckoNetworkId: 'solana',
  coingeckoNativeTokenId: 'solana',
  deBankSlug: 'solana',
  tokenListUrl:
    'https://raw.githubusercontent.com/namgold/dmm-solana-interface-concept/master/src/constants/tokenlists/solana.testnet.tokenlist.json',
}

export default solanaInfo
