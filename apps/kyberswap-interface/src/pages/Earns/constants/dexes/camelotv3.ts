import { ChainId } from '@kyberswap/ks-sdk-core'

import AlgebraNftManagerABI from 'constants/abis/earn/algebraNftManagerContract.json'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'

export default {
  name: 'Camelot V3',
  nftManagerContract: {
    [ChainId.ARBITRUM]: '0x00c7f3082833e796A5b3e4Bd59f6642FF44DCD15',
  },
  nftManagerContractAbi: AlgebraNftManagerABI,
  unwrapWNativeTokenFuncName: 'unwrapWNativeToken',
  siteUrl: 'https://app.camelot.exchange/positions',
  collectFeeSupported: true,
  isForkFrom: CoreProtocol.AlgebraV19,
  showVersion: true,
  farmingSupported: false,
}
