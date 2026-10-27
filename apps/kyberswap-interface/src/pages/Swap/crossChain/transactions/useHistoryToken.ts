import { ChainId } from '@kyberswap/ks-sdk-core'

import { ETHER_ADDRESS, ZERO_ADDRESS } from 'constants/index'
import { useCurrencyLookup } from 'hooks/useTokens'
import { useNearIntentsTokens } from 'pages/Swap/crossChain/adapters/NearIntentsAdapter/useNearIntentsTokens'
import { BitcoinToken, type Chain, type Currency, NonEvmChain } from 'pages/Swap/crossChain/adapters/types'
import { useSolanaTokens } from 'pages/Swap/crossChain/hooks/useSolanaTokens'

const isEvmChainId = (chain: Chain): chain is ChainId => typeof chain === 'number'

// Local rows already contain Currency objects. API rows contain identifiers;
// resolve only those through the existing token hooks/cache, without a History cache.
export const useHistoryToken = (token: Currency | string, chain: Chain): Currency | string => {
  const id = typeof token === 'string' ? token : undefined
  const { currency } = useCurrencyLookup(
    isEvmChainId(chain) ? (id === ZERO_ADDRESS ? ETHER_ADDRESS : id) : undefined,
    isEvmChainId(chain) ? chain : ChainId.MAINNET,
  )
  const { solanaTokens } = useSolanaTokens(id || '', chain !== NonEvmChain.Solana || id === undefined)
  const { nearTokens } = useNearIntentsTokens(chain !== NonEvmChain.Near || id === undefined)

  if (id === undefined) return token
  if (isEvmChainId(chain)) return currency || token
  if (chain === NonEvmChain.Bitcoin) return BitcoinToken
  if (chain === NonEvmChain.Solana) return solanaTokens.find(currency => currency.id === id) || token
  return (
    nearTokens.find(
      currency => currency.blockchain === 'near' && (currency.assetId === id || currency.contractAddress === id),
    ) || token
  )
}
