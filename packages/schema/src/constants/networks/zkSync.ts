import zkSyncLogo from '@/assets/networks/zkSync.svg';

export default {
  name: 'ZkSync',
  logo: zkSyncLogo,
  nativeLogo:
    'https://storage.googleapis.com/ks-setting-1d682dca/8fca1ea5-2637-48bc-bb08-c734065442fe1693634037115.png',
  scanLink: 'https://era.zksync.network',
  multiCall: '0xF9cda624FBC7e059355ce98a31693d299FACd963',
  defaultRpc: 'https://mainnet.era.zksync.io',
  coingeckoNetworkId: 'zksync',
  coingeckoNativeTokenId: 'ethereum',
  wrappedToken: {
    name: 'WETH',
    address: '0x5aea5775959fbc2557cc8789bc1bf90a239d9a91',
    symbol: 'WETH',
    decimals: 18,
  },
};
