import { ChainId } from '@kyberswap/ks-sdk-core'

import thenaLogo from 'assets/dexes/thena.svg'
import AlgebraNftManagerABI from 'constants/abis/earn/algebraNftManagerContract.json'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'

export default {
  name: 'Thena',
  logo: thenaLogo,
  nftManagerContract: {
    [ChainId.BSCMAINNET]: '0xa51ADb08Cbe6Ae398046A23bec013979816B77Ab',
  },
  nftManagerContractAbi: AlgebraNftManagerABI,
  unwrapWNativeTokenFuncName: 'unwrapWNativeToken',
  siteUrl: 'https://thena.fi/pools/$poolAddress',
  collectFeeSupported: true,
  isForkFrom: CoreProtocol.AlgebraV1,
  showVersion: false,
  farmingSupported: false,
}
