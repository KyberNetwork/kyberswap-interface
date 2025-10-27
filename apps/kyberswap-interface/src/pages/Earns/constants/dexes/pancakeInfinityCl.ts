import { ChainId } from '@kyberswap/ks-sdk-core'

import pancakeLogo from 'assets/dexes/pancake.svg'
import PancakeInfinityClNftManagerABI from 'constants/abis/earn/pancakeInfinityClNftManagerContract.json'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'

export default {
  name: 'Pancake ∞ CL',
  logo: pancakeLogo,
  nftManagerContract: {
    [ChainId.BSCMAINNET]: '0x55f4c8abA71A1e923edC303eb4fEfF14608cC226',
  },
  nftManagerContractAbi: PancakeInfinityClNftManagerABI,
  unwrapWNativeTokenFuncName: null,
  siteUrl: 'https://pancakeswap.finance/liquidity/position/infinityCl/$positionId',
  collectFeeSupported: true,
  isForkFrom: CoreProtocol.UniswapV4,
  showVersion: true,
  farmingSupported: false,
}
