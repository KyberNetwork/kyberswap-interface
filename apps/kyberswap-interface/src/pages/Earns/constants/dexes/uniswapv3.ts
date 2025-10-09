import { ChainId } from '@kyberswap/ks-sdk-core'

import Univ3NftManagerABI from 'constants/abis/earn/uniswapv3NftManagerContract.json'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'

export default {
  name: 'Uniswap V3',
  nftManagerContract: {
    [ChainId.MAINNET]: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    [ChainId.BSCMAINNET]: '0x7b8A01B39D58278b5DE7e48c8449c9f4F5170613',
    [ChainId.MATIC]: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    [ChainId.ARBITRUM]: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    [ChainId.AVAXMAINNET]: '0x655C406EBFa14EE2006250925e54ec43AD184f8B',
    [ChainId.BASE]: '0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1',
    [ChainId.BLAST]: '0xB218e4f7cF0533d4696fDfC419A0023D33345F28',
    [ChainId.FANTOM]: '0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1',
    [ChainId.LINEA]: '0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1',
    [ChainId.MANTLE]: '0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1',
    [ChainId.OPTIMISM]: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    [ChainId.SCROLL]: '0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1',
  },
  nftManagerContractAbi: Univ3NftManagerABI,
  unwrapWNativeTokenFuncName: 'unwrapWETH9',
  siteUrl: 'https://app.uniswap.org/positions/v3/$chainName/$positionId',
  collectFeeSupported: true,
  isForkFrom: CoreProtocol.UniswapV3,
  showVersion: true,
  farmingSupported: false,
}
