import squadswapLogo from '@/assets/dexes/squadswap.png';
import { ChainId } from '@/schema/chain';

export default {
  icon: squadswapLogo,
  name: 'Squad Swap V3',
  nftManagerContract: {
    [ChainId.Bsc]: '0x501535ef0B92eE1df5C12f47720f1E479b1Db7b4',
  },
};
