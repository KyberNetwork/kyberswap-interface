import thrusterLogo from '@/assets/dexes/thruster.png';
import { ChainId } from '@/schema/chain';

export default {
  icon: thrusterLogo,
  name: 'Thruster V3',
  nftManagerContract: {
    [ChainId.Blast]: '0x434575EaEa081b735C985FA9bf63CD7b87e227F9',
  },
};
