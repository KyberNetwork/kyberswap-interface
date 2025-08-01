import blastswapLogo from '@/assets/dexes/blastswap.png';
import { ChainId } from '@/schema/chain';

export default {
  icon: blastswapLogo,
  name: 'BlastSwap',
  nftManagerContract: {
    [ChainId.Blast]: '0x7553b306773EFa59E6f9676aFE049D2D2AbdfDd6',
  },
};
