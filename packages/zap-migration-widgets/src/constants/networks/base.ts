import { ChainId } from '@/schema';

export default {
  chainId: ChainId.Base,
  name: 'Base',
  logo: 'https://raw.githubusercontent.com/base-org/brand-kit/001c0e9b40a67799ebe0418671ac4e02a0c683ce/logo/in-product/Base_Network_Logo.svg',
  nativeLogo:
    'https://storage.googleapis.com/ks-setting-1d682dca/8fca1ea5-2637-48bc-bb08-c734065442fe1693634037115.png',
  scanLink: 'https://basescan.org',
  multiCall: '0xcA11bde05977b3631167028862bE2a173976CA11',
  defaultRpc: 'https://base.kyberengineering.io',
  wrappedToken: {
    name: 'ETH',
    address: '0x4200000000000000000000000000000000000006',
    symbol: 'WETH',
    decimals: 18,
  },
  zapPath: 'base',
};
