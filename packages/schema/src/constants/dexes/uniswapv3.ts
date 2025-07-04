import uniLogo from '@/assets/dexes/uniswap.png';
import { ChainId } from '@/schema/chain';

export default {
  icon: uniLogo,
  name: 'Uniswap V3',
  nftManagerContract: {
    [ChainId.Ethereum]: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    [ChainId.Bsc]: '0x7b8A01B39D58278b5DE7e48c8449c9f4F5170613',
    [ChainId.PolygonPos]: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    [ChainId.Arbitrum]: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    [ChainId.Avalanche]: '0x655C406EBFa14EE2006250925e54ec43AD184f8B',
    [ChainId.Base]: '0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1',
    [ChainId.Blast]: '0xB218e4f7cF0533d4696fDfC419A0023D33345F28',
    [ChainId.Optimism]: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
  },
};
