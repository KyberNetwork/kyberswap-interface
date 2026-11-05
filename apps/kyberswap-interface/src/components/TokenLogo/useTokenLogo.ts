import { ChainId } from '@kyberswap/ks-sdk-core'

import { useCurrencyLookup } from 'hooks/useTokens'
import { useAppSelector } from 'state/hooks'
import { type Chain, type Currency, isEvmChain } from 'types/crossChain'
import { isNativeAsset } from 'utils/nativeErc20'
import { getNativeTokenLogo, getTokenLogoURL } from 'utils/tokenLogo'

// Resolve presentation data separately from the token snapshot used for amounts.
// Subscribe to the fallback source so a late whitelist load updates existing rows.
export const useTokenLogo = (
  currency: (Currency & Partial<{ isNative: boolean; logoURI: string; logo: string }>) | undefined,
  chainId: Chain,
) => {
  const evmChain = isEvmChain(chainId) ? (chainId as ChainId) : undefined
  const native = evmChain !== undefined && isNativeAsset(currency)
  const address = currency && 'address' in currency ? currency.address : undefined
  const suppliedLogo = evmChain !== undefined ? currency?.logoURI : currency?.logo
  const fallbackLogo = useAppSelector(state => {
    if (evmChain === undefined) return ''
    const tokens = state.lists.mapWhitelistTokens[evmChain] ?? {}
    if (native) return getNativeTokenLogo(evmChain, tokens)
    return address ? getTokenLogoURL(address, evmChain, tokens) : ''
  })

  // The shared query cache owns fetching, deduplication and current-address data.
  const lookupAddress = evmChain !== undefined && !native && !suppliedLogo && !fallbackLogo ? address : undefined
  const { currency: metadata } = useCurrencyLookup(lookupAddress, evmChain ?? ChainId.MAINNET)
  const fetchedLogo = lookupAddress && metadata && 'logoURI' in metadata ? metadata.logoURI : undefined

  if (native) return fallbackLogo
  return suppliedLogo || fallbackLogo || (typeof fetchedLogo === 'string' ? fetchedLogo : '')
}
