import { ChainId } from '@kyberswap/ks-sdk-core'

import pancakeLogo from 'assets/dexes/pancake.svg'
import { PancakeInfinityClNftManagerABI } from 'constants/abis'
import { SmartExitDexType } from 'pages/Earns/components/SmartExit/constants'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'

export default {
  name: 'Pancake ∞ CL',
  logo: pancakeLogo,
  nftManagerContract: {
    [ChainId.BSCMAINNET]: '0x55f4c8abA71A1e923edC303eb4fEfF14608cC226',
    [ChainId.ROBINHOOD]: '0xeaEA9253A0b75B936a965DbD35B2a3F01831DE74',
  },
  nftManagerContractAbi: PancakeInfinityClNftManagerABI,
  unwrapWNativeTokenFuncName: null,
  siteUrl: 'https://pancakeswap.finance/liquidity/position/infinityCl/$positionId',
  collectFeeSupported: true,
  isForkFrom: CoreProtocol.UniswapV4,
  showVersion: true,
  smartExitDexType: SmartExitDexType.DexTypePancakeInfinityCL,
}
