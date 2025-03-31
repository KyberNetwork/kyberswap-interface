import { ChainId } from '@kyberswap/ks-sdk-core'

import AlgebraNftManagerABI from 'constants/abis/nft-manager-contract/algebraNftManagerContract.json'
import Univ3NftManagerABI from 'constants/abis/nft-manager-contract/uniswapv3NftManagerContract.json'
import { ETHER_ADDRESS } from 'constants/index'
import { ContractInterface } from 'ethers'
import { enumToArrayOfValues } from 'utils'

export enum EarnDex {
  DEX_UNISWAPV3 = 'Uniswap V3',
  DEX_PANCAKESWAPV3 = 'PancakeSwap V3',
  DEX_SUSHISWAPV3 = 'SushiSwap V3',
  DEX_QUICKSWAPV3ALGEBRA = 'QuickSwap V3',
  DEX_CAMELOTV3 = 'Camelot V3',
  DEX_THENAFUSION = 'THENA',
  DEX_KODIAK_V3 = 'Kodiak Concentrated',
  DEX_UNISWAPV2 = 'Uniswap V2',
}

export enum EarnDex2 {
  DEX_UNISWAPV3 = 'uniswapv3',
  DEX_PANCAKESWAPV3 = 'pancake-v3',
  DEX_SUSHISWAPV3 = 'sushiswap-v3',
  DEX_QUICKSWAPV3ALGEBRA = 'quickswap-v3',
  DEX_CAMELOTV3 = 'camelot-v3',
  DEX_THENAFUSION = 'thena',
  DEX_KODIAK_V3 = 'kodiakcl',
  DEX_UNISWAPV2 = 'uniswapv2',
}

export enum EarnChain {
  MAINNET = ChainId.MAINNET,
  BASE = ChainId.BASE,
  BSC = ChainId.BSCMAINNET,
  ARBITRUM = ChainId.ARBITRUM,
  AVAX = ChainId.AVAXMAINNET,
  OPTIMISM = ChainId.OPTIMISM,
  MATIC = ChainId.MATIC,
  BERA = ChainId.BERA,
}

export const earnSupportedChains = enumToArrayOfValues(EarnChain, 'number')

export const earnSupportedProtocols = enumToArrayOfValues(EarnDex)

export const NFT_MANAGER_CONTRACT: { [key in EarnDex]: { [key: string]: string } | string } = {
  [EarnDex.DEX_UNISWAPV3]: {
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
  [EarnDex.DEX_PANCAKESWAPV3]: '0x46A15B0b27311cedF172AB29E4f4766fbE7F4364',
  [EarnDex.DEX_SUSHISWAPV3]: {
    [ChainId.ARBITRUM]: '0x96E04591579f298681361C6122Dc4Ef405c19385',
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
  [EarnDex.DEX_QUICKSWAPV3ALGEBRA]: {
    [ChainId.MATIC]: '0x8eF88E4c7CfbbaC1C163f7eddd4B578792201de6',
  },
  [EarnDex.DEX_CAMELOTV3]: {
    [ChainId.ARBITRUM]: '0x00c7f3082833e796A5b3e4Bd59f6642FF44DCD15',
  },
  [EarnDex.DEX_THENAFUSION]: {
    [ChainId.BSCMAINNET]: '0xa51ADb08Cbe6Ae398046A23bec013979816B77Ab',
  },
  [EarnDex.DEX_KODIAK_V3]: {
    [ChainId.BERA]: '0xFE5E8C83FFE4d9627A75EaA7Fee864768dB989bD',
  },
  [EarnDex.DEX_UNISWAPV2]: {},
}

export const NATIVE_ADDRESSES: Record<EarnChain, string> = {
  [EarnChain.MAINNET]: ETHER_ADDRESS.toLowerCase(),
  [EarnChain.BASE]: ETHER_ADDRESS.toLowerCase(),
  [EarnChain.BSC]: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  [EarnChain.ARBITRUM]: ETHER_ADDRESS.toLowerCase(),
  [EarnChain.AVAX]: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  [EarnChain.OPTIMISM]: ETHER_ADDRESS.toLowerCase(),
  [EarnChain.MATIC]: '0xcccccccccccccccccccccccccccccccccccccccc',
  [EarnChain.BERA]: ETHER_ADDRESS.toLowerCase(),
}

export const NFT_MANAGER_ABI: { [key in EarnDex]: ContractInterface | null } = {
  [EarnDex.DEX_UNISWAPV3]: Univ3NftManagerABI,
  [EarnDex.DEX_PANCAKESWAPV3]: Univ3NftManagerABI,
  [EarnDex.DEX_SUSHISWAPV3]: Univ3NftManagerABI,
  [EarnDex.DEX_QUICKSWAPV3ALGEBRA]: AlgebraNftManagerABI,
  [EarnDex.DEX_CAMELOTV3]: AlgebraNftManagerABI,
  [EarnDex.DEX_THENAFUSION]: AlgebraNftManagerABI,
  [EarnDex.DEX_KODIAK_V3]: Univ3NftManagerABI,
  [EarnDex.DEX_UNISWAPV2]: null,
}

export const UNWRAP_WNATIVE_TOKEN_FUNC: { [key in EarnDex]: string | null } = {
  [EarnDex.DEX_UNISWAPV3]: 'unwrapWETH9',
  [EarnDex.DEX_PANCAKESWAPV3]: 'unwrapWETH9',
  [EarnDex.DEX_SUSHISWAPV3]: 'unwrapWETH9',
  [EarnDex.DEX_QUICKSWAPV3ALGEBRA]: 'unwrapWNativeToken',
  [EarnDex.DEX_CAMELOTV3]: 'unwrapWNativeToken',
  [EarnDex.DEX_THENAFUSION]: 'unwrapWNativeToken',
  [EarnDex.DEX_KODIAK_V3]: 'unwrapWETH9',
  [EarnDex.DEX_UNISWAPV2]: null,
}

export const PROTOCOL_POSITION_URL: Record<EarnDex, string> = {
  [EarnDex.DEX_UNISWAPV3]: 'https://app.uniswap.org/positions/v3/$chainName/$positionId',
  [EarnDex.DEX_SUSHISWAPV3]: 'https://www.sushi.com/$chainName/pool/v3/$poolAddress/$positionId',
  [EarnDex.DEX_PANCAKESWAPV3]: 'https://pancakeswap.finance/liquidity/$positionId',
  [EarnDex.DEX_QUICKSWAPV3ALGEBRA]: 'https://quickswap.exchange/#/pools',
  [EarnDex.DEX_CAMELOTV3]: 'https://app.camelot.exchange/positions',
  [EarnDex.DEX_THENAFUSION]: 'https://thena.fi/pools/$poolAddress',
  [EarnDex.DEX_KODIAK_V3]: 'https://app.kodiak.finance/#/liquidity/v3/$positionId',
  [EarnDex.DEX_UNISWAPV2]: 'https://app.uniswap.org/positions/v2/base/$poolAddress',
}

export const DEXES_HIDE_TOKEN_ID: Record<EarnDex, boolean> = {
  [EarnDex.DEX_UNISWAPV3]: false,
  [EarnDex.DEX_PANCAKESWAPV3]: false,
  [EarnDex.DEX_SUSHISWAPV3]: false,
  [EarnDex.DEX_QUICKSWAPV3ALGEBRA]: false,
  [EarnDex.DEX_CAMELOTV3]: false,
  [EarnDex.DEX_THENAFUSION]: true,
  [EarnDex.DEX_KODIAK_V3]: false,
  [EarnDex.DEX_UNISWAPV2]: true,
}

export const DEXES_SUPPORT_COLLECT_FEE: Record<EarnDex, boolean> = {
  [EarnDex.DEX_UNISWAPV3]: true,
  [EarnDex.DEX_PANCAKESWAPV3]: true,
  [EarnDex.DEX_SUSHISWAPV3]: true,
  [EarnDex.DEX_QUICKSWAPV3ALGEBRA]: true,
  [EarnDex.DEX_CAMELOTV3]: true,
  [EarnDex.DEX_THENAFUSION]: true,
  [EarnDex.DEX_KODIAK_V3]: true,
  [EarnDex.DEX_UNISWAPV2]: false,
}

export enum CoreProtocol {
  UniswapV3,
  UniswapV2,
  AlgebraV1,
  AlgebraV19,
  AlgebraIntegral,
}

export const PROTOCOLS_CORE_MAPPING: Record<EarnDex, CoreProtocol> = {
  [EarnDex.DEX_UNISWAPV3]: CoreProtocol.UniswapV3,
  [EarnDex.DEX_PANCAKESWAPV3]: CoreProtocol.UniswapV3,
  [EarnDex.DEX_SUSHISWAPV3]: CoreProtocol.UniswapV3,
  [EarnDex.DEX_QUICKSWAPV3ALGEBRA]: CoreProtocol.AlgebraV1,
  [EarnDex.DEX_CAMELOTV3]: CoreProtocol.AlgebraV19,
  [EarnDex.DEX_THENAFUSION]: CoreProtocol.AlgebraV1,
  [EarnDex.DEX_KODIAK_V3]: CoreProtocol.UniswapV3,
  [EarnDex.DEX_UNISWAPV2]: CoreProtocol.UniswapV2,
}
