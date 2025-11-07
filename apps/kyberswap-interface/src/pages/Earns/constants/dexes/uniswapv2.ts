import uniswapLogo from 'assets/dexes/uniswap.svg'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'

export default {
  name: 'Uniswap V2',
  logo: uniswapLogo,
  nftManagerContract: {},
  nftManagerContractAbi: null,
  unwrapWNativeTokenFuncName: null,
  siteUrl: 'https://app.uniswap.org/positions/v2/$chainName/$poolAddress',
  collectFeeSupported: false,
  isForkFrom: CoreProtocol.UniswapV2,
  showVersion: true,
  farmingSupported: false,
}
