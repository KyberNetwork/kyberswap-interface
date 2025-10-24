import pancakeLogo from 'assets/dexes/pancake.svg'
import Univ3NftManagerABI from 'constants/abis/earn/uniswapv3NftManagerContract.json'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'

export default {
  name: 'PancakeSwap V3',
  logo: pancakeLogo,
  nftManagerContract: '0x46A15B0b27311cedF172AB29E4f4766fbE7F4364',
  nftManagerContractAbi: Univ3NftManagerABI,
  unwrapWNativeTokenFuncName: 'unwrapWETH9',
  siteUrl: 'https://pancakeswap.finance/liquidity/$positionId',
  collectFeeSupported: true,
  isForkFrom: CoreProtocol.UniswapV3,
  showVersion: true,
  farmingSupported: false,
}
