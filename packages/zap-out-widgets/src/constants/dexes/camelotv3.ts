import camelotLogo from '@/assets/dexes/camelot.svg?url';
import { ChainId } from '@/schema';

export default {
  icon: camelotLogo,
  name: 'Camelot V3',
  nftManagerContract: {
    [ChainId.Arbitrum]: '0x00c7f3082833e796A5b3e4Bd59f6642FF44DCD15',
  },
};
