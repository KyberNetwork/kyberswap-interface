import ethereumLogo from '@/assets/networks/ethereum.png';

export default {
  name: 'Ethereum',
  logo: ethereumLogo,
  nativeLogo:
    'https://storage.googleapis.com/ks-setting-1d682dca/8fca1ea5-2637-48bc-bb08-c734065442fe1693634037115.png',
  scanLink: 'https://etherscan.io',
  multiCall: '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696',
  defaultRpc: 'https://ethereum.kyberengineering.io',
  coingeckoNetworkId: 'ethereum',
  coingeckoNativeTokenId: 'ethereum',
  wrappedToken: {
    name: 'WETH',
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    symbol: 'WETH',
    decimals: 18,
  },
};
