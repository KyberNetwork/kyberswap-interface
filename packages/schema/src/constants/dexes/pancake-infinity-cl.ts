import pancakeLogo from '@/assets/dexes/pancake.png';
import { ChainId } from '@/schema/chain';

export default {
  icon: pancakeLogo,
  name: 'Pancake ∞ CL',
  nftManagerContract: {
    [ChainId.Bsc]: '0x55f4c8abA71A1e923edC303eb4fEfF14608cC226',
    [ChainId.Base]: '0x55f4c8abA71A1e923edC303eb4fEfF14608cC226',
    [ChainId.Robinhood]: '0xeaEA9253A0b75B936a965DbD35B2a3F01831DE74',
  },
};
