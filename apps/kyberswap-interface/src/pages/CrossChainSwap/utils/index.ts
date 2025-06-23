import { ChainId } from '@kyberswap/ks-sdk-core'

import { NETWORKS_INFO } from 'constants/networks'
import { isEvmChain } from 'utils'

import { Chain, NonEvmChain, NonEvmChainInfo } from '../adapters'

export const getNetworkInfo = (chain: Chain) => {
  if (isEvmChain(chain))
    return {
      name: NETWORKS_INFO[chain as ChainId].name,
      icon: NETWORKS_INFO[chain as ChainId].icon,
    }
  return NonEvmChainInfo[chain as NonEvmChain]
}

export const CANONICAL_TOKENS: Record<string, Record<number, string>> = {
  WETH: {
    [ChainId.MAINNET]: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    [ChainId.BSCMAINNET]: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    [ChainId.SONIC]: '0x50c42dEAcD8Fc9773493ED674b675bE577f2634b',
    [ChainId.ARBITRUM]: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
    [ChainId.BASE]: '0x4200000000000000000000000000000000000006',
    [ChainId.RONIN]: '0xc99a6A985eD2Cac1ef41640596C5A5f9F4E19Ef5',
    [ChainId.OPTIMISM]: '0x4200000000000000000000000000000000000006',
    [ChainId.UNICHAIN]: '0x4200000000000000000000000000000000000006',
    [ChainId.ZKSYNC]: '0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91',
    [ChainId.LINEA]: '0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f',
    [ChainId.SCROLL]: '0x5300000000000000000000000000000000000004',
    [ChainId.BLAST]: '0x5300000000000000000000000000000000000004',
    [ChainId.AVAXMAINNET]: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB',
    [ChainId.BERA]: '0x2F6F07CDcf3588944Bf4C42aC74ff24bF56e7590',
    [ChainId.HYPEREVM]: '0x1fbccdc677c10671ee50b46c61f0f7d135112450',
  },
  BNB: {
    [ChainId.BSCMAINNET]: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    [ChainId.MAINNET]: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
  },
  POL: {
    [ChainId.MAINNET]: '0x455e53cbb86018ac2b8092fdcd39d8444affc3f6',
    [ChainId.MATIC]: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
  },
}

export function isCanonicalPair(chainId0: number, address0: string, chainId1: number, address1: string) {
  for (const [, chainMapping] of Object.entries(CANONICAL_TOKENS)) {
    const add0 = chainMapping[chainId0]?.toLowerCase()
    const add1 = chainMapping[chainId1]?.toLowerCase()

    if (add0 === address0.toLowerCase() && add1 === address1.toLowerCase()) {
      return true
    }
  }

  return false
}
