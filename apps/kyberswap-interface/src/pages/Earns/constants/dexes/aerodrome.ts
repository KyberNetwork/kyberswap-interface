import { ChainId } from '@kyberswap/ks-sdk-core'

import aerodromeLogo from 'assets/dexes/aerodrome.svg'
import Univ3NftManagerABI from 'constants/abis/earn/uniswapv3NftManagerContract.json'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'

export default {
  name: 'Aerodrome Concentrated',
  logo: aerodromeLogo,
  nftManagerContract: {
    [ChainId.BASE]: '0x827922686190790b37229fd06084350E74485b72',
  },
  nftManagerContractAbi: Univ3NftManagerABI,
  unwrapWNativeTokenFuncName: 'unwrapWETH9',
  siteUrl: 'https://www.aerodrome.finance/liquidity',
  collectFeeSupported: true,
  isForkFrom: CoreProtocol.UniswapV3,
  showVersion: true,
  farmingSupported: false,
}
