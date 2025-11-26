import { ChainId } from '@kyberswap/ks-sdk-core'

import quickswapLogo from 'assets/dexes/quickswap.svg'
import AlgebraNftManagerABI from 'constants/abis/earn/algebraNftManagerContract.json'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'

export default {
  name: 'QuickSwap V3',
  logo: quickswapLogo,
  nftManagerContract: {
    [ChainId.MATIC]: '0x8eF88E4c7CfbbaC1C163f7eddd4B578792201de6',
  },
  nftManagerContractAbi: AlgebraNftManagerABI,
  unwrapWNativeTokenFuncName: 'unwrapWNativeToken',
  siteUrl: 'https://quickswap.exchange/#/pools',
  collectFeeSupported: true,
  isForkFrom: CoreProtocol.AlgebraV1,
  showVersion: true,
  farmingSupported: false,
}
