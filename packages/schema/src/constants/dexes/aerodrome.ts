import aerodromeLogo from '@/assets/dexes/aerodrome.svg?url';
import { ChainId } from '@/schema/chain';

export default {
  icon: aerodromeLogo,
  name: 'Aerodrome CL',
  nftManagerContract: {
    [ChainId.Base]: '0x827922686190790b37229fd06084350E74485b72',
  },
};
