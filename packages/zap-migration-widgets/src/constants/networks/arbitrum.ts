import { ChainId } from '@/schema';

export default {
  chainId: ChainId.Arbitrum,
  name: 'Arbitrum',
  nativeLogo:
    'https://storage.googleapis.com/ks-setting-1d682dca/8fca1ea5-2637-48bc-bb08-c734065442fe1693634037115.png',
  logo: 'https://raw.githubusercontent.com/KyberNetwork/kyberswap-interface/main/apps/kyberswap-interface/src/assets/networks/arbitrum.svg',
  scanLink: 'https://arbiscan.io',
  multiCall: '0xcA11bde05977b3631167028862bE2a173976CA11',
  defaultRpc: 'https://arbitrum.kyberengineering.io',
  wrappedToken: {
    name: 'WETH',
    address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    symbol: 'WETH',
    decimals: 18,
  },
  zapPath: 'arbitrum',
};
