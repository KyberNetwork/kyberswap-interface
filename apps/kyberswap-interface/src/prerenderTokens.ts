import { ChainId } from '@kyberswap/ks-sdk-core'

import type { TokenMap } from 'hooks/useTokens'
import { type TokenInfo, WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

// Build-time only: curated tokens missing from the native/default/stable currency constants.
// Snapshot of the production token catalog, verified 2026-11-10. Keep addresses and decimals tied
// to their chain; never infer them from a symbol. The client still loads its authoritative token list.
const CURATED_PRERENDER_TOKENS: TokenInfo[] = [
  {
    chainId: ChainId.MAINNET,
    address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    symbol: 'WBTC',
    name: 'Wrapped BTC',
    decimals: 8,
    logoURI: 'https://storage.googleapis.com/ks-setting-1d682dca/74a53978-aaa4-44e3-9e3f-8012d19f9c38.png',
    isWhitelisted: true,
  },
  {
    chainId: ChainId.BASE,
    address: '0x0555e30da8f98308edb960aa94c0db47230d2b9c',
    symbol: 'WBTC',
    name: 'Wrapped BTC',
    decimals: 8,
    logoURI: 'https://coin-images.coingecko.com/coins/images/66849/large/btc.png?1750793694',
    isWhitelisted: true,
  },
  {
    chainId: ChainId.BSCMAINNET,
    address: '0x0555e30da8f98308edb960aa94c0db47230d2b9c',
    symbol: 'WBTC',
    name: 'Wrapped BTC',
    decimals: 8,
    logoURI: 'https://coin-images.coingecko.com/coins/images/54335/large/wbtc.jpg?1739334808',
    isWhitelisted: true,
  },
  {
    chainId: ChainId.OPTIMISM,
    address: '0x4200000000000000000000000000000000000042',
    symbol: 'OP',
    name: 'Optimism',
    decimals: 18,
    logoURI: 'https://storage.googleapis.com/ks-setting-1d682dca/7dd69eb0-bbff-4fbc-a581-1562070eff66.png',
    isWhitelisted: true,
  },
]

export function getPrerenderTokens(chainId: ChainId): TokenMap {
  return Object.fromEntries(
    CURATED_PRERENDER_TOKENS.filter(token => token.chainId === chainId).map(info => {
      const token = new WrappedTokenInfo(info)
      return [token.address, token]
    }),
  )
}
