import { ChainId } from '@kyberswap/ks-sdk-core'

import { isSupportedChainId } from 'constants/networks'
import { NativeCurrencies } from 'constants/tokens'
import { Chain, NonEvmChain, isNonEvmChain } from 'pages/CrossChainSwap/adapters/types'
import { SOLANA_NATIVE } from 'pages/CrossChainSwap/utils'

export const getSwapChains = (params: URLSearchParams, fallback: ChainId) => {
  const readChain = (value: string | null): Chain => {
    if (isNonEvmChain(value as NonEvmChain)) return value as NonEvmChain
    const chainId = Number(value) as ChainId
    return isSupportedChainId(chainId) ? chainId : fallback
  }
  const fromChain = readChain(params.get('from'))
  const toChain = readChain(params.get('to'))

  return {
    fromChain,
    toChain,
    // Non-EVM pairs continue to use the existing cross-chain wallet/adapter flow.
    isCrossChain: fromChain !== toChain || typeof fromChain !== 'number',
  }
}

export const getDefaultSwapTokenId = (chain: Chain): string => {
  if (chain === NonEvmChain.Bitcoin) return 'BTC'
  if (chain === NonEvmChain.Near) return 'near'
  if (chain === NonEvmChain.Solana) return SOLANA_NATIVE
  return NativeCurrencies[chain].symbol?.toLowerCase() || ''
}
