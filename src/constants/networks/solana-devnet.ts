import { ChainId } from '@kyberswap/ks-sdk-core'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { PublicKey } from '@solana/web3.js'

import Solana from 'assets/networks/solana-network.svg'
import { SolanaNetworkInfo } from 'constants/networks/type'

export const SelectedNetwork = WalletAdapterNetwork.Mainnet

const NOT_SUPPORT = null
const solanaInfo: SolanaNetworkInfo = {
  chainId: ChainId.SOLANA_DEVNET,
  route: 'solana',
  ksSettingRoute: 'solana',
  priceRoute: 'solana',
  aggregatorRoute: 'solana',
  name: 'Solana Devnet',
  icon: Solana,
  iconSelected: Solana,
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
    // Fee for Solana: 5000 lamport * signature = 5000 * 10^-9 SOL * signature
    // Rent fee for set up account: 0.00203928 SOL
    // We might need setup up to 3 accounts or even more for openbook
    // => use 0.01
    // above values might change
    minForGas: 10 ** 7,
  },
  aggregatorProgramAddress: 'GmgkeeJtcjHgeiSDdT5gxznUDr5ygq9jo8tmA4ny7ziv',
  limitOrder: NOT_SUPPORT,
  coingeckoNetworkId: 'solana',
  coingeckoNativeTokenId: 'solana',
  defaultRpcUrl: 'https://api.devnet.solana.com',
  openBookAddress: new PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX'),
  dexToCompare: 'OrcaV2',
  geckoTermialId: 'solana',
}

export default solanaInfo
