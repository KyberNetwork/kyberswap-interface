import { ChainId } from '@kyberswap/ks-sdk-core'

import Univ3NftManagerABI from 'constants/abis/earn/uniswapv3NftManagerContract.json'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'

export default {
  name: 'SushiSwap V3',
  nftManagerContract: {
    [ChainId.ARBITRUM]: '0xF0cBce1942A68BEB3d1b73F0dd86C8DCc363eF49',
    [ChainId.AVAXMAINNET]: '0x18350b048AB366ed601fFDbC669110Ecb36016f3',
    [ChainId.BASE]: '0x80C7DD17B01855a6D2347444a0FCC36136a314de',
    [ChainId.BLAST]: '0x51edb3e5bcE8618B77b60215F84aD3DB14709051',
    [ChainId.BSCMAINNET]: '0xF70c086618dcf2b1A461311275e00D6B722ef914',
    [ChainId.MAINNET]: '0x2214A42d8e2A1d20635c2cb0664422c528B6A432',
    [ChainId.FANTOM]: '0x10c19390E1Ac2Fd6D0c3643a2320b0abA38E5bAA',
    [ChainId.LINEA]: '0x80C7DD17B01855a6D2347444a0FCC36136a314de',
    [ChainId.OPTIMISM]: '0x1af415a1EbA07a4986a52B6f2e7dE7003D82231e',
    [ChainId.MATIC]: '0xb7402ee99F0A008e461098AC3A27F4957Df89a40',
    [ChainId.SCROLL]: '0x0389879e0156033202C44BF784ac18fC02edeE4f',
  },
  nftManagerContractAbi: Univ3NftManagerABI,
  unwrapWNativeTokenFuncName: 'unwrapWETH9',
  siteUrl: 'https://www.sushi.com/$chainName/pool/v3/$poolAddress/$positionId',
  collectFeeSupported: true,
  isForkFrom: CoreProtocol.UniswapV3,
  showVersion: true,
  farmingSupported: false,
}
