import { ChainId } from '@kyberswap/ks-sdk-core'

import Univ4NftManagerABI from 'constants/abis/earn/uniswapv4NftManagerContract.json'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'

export default {
  name: 'Uniswap V4',
  nftManagerContract: {
    [ChainId.MAINNET]: '0xbd216513d74c8cf14cf4747e6aaa6420ff64ee9e',
    [ChainId.BSCMAINNET]: '0x7a4a5c919ae2541aed11041a1aeee68f1287f95b',
    [ChainId.MATIC]: '0x1ec2ebf4f37e7363fdfe3551602425af0b3ceef9',
    [ChainId.ARBITRUM]: '0xd88f38f930b7952f2db2432cb002e7abbf3dd869',
    [ChainId.AVAXMAINNET]: '0xb74b1f14d2754acfcbbe1a221023a5cf50ab8acd',
    [ChainId.BASE]: '0x7c5f5a4bbd8fd63184577525326123b519429bdc',
    [ChainId.BLAST]: '0x4ad2f4cca2682cbb5b950d660dd458a1d3f1baad',
    [ChainId.OPTIMISM]: '0x3c3ea4b57a46241e54610e5f022e5c45859a1017',
  },
  nftManagerContractAbi: Univ4NftManagerABI,
  unwrapWNativeTokenFuncName: null,
  siteUrl: 'https://app.uniswap.org/positions/v4/$chainName/$positionId',
  collectFeeSupported: true,
  isForkFrom: CoreProtocol.UniswapV4,
  showVersion: true,
  farmingSupported: false,
}
