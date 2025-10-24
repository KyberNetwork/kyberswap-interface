import { ChainId } from '@kyberswap/ks-sdk-core'

import kodiakLogo from 'assets/dexes/kodiak.svg'
import Univ3NftManagerABI from 'constants/abis/earn/uniswapv3NftManagerContract.json'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'

export default {
  name: 'Kodiak Concentrated',
  logo: kodiakLogo,
  nftManagerContract: {
    [ChainId.BERA]: '0xFE5E8C83FFE4d9627A75EaA7Fee864768dB989bD',
  },
  nftManagerContractAbi: Univ3NftManagerABI,
  unwrapWNativeTokenFuncName: 'unwrapWETH9',
  siteUrl: 'https://app.kodiak.finance/#/liquidity/v3/$positionId',
  collectFeeSupported: true,
  isForkFrom: CoreProtocol.UniswapV3,
  showVersion: false,
  farmingSupported: false,
}
