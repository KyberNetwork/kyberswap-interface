import { ChainId } from '@kyberswap/ks-sdk-core'

import { ETHER_ADDRESS, ZERO_ADDRESS } from 'constants/index'
import type { TokenInfo } from 'state/lists/wrappedTokenInfo'

const ABSTRACT_TOKENS_URL = 'https://li.quest/v1/tokens?chains=2741'
const CACHE_TTL = 5 * 60_000

// Explicit contract identities, not symbol matching. LI.FI listing does not imply KyberSwap whitelisting.
const ABSTRACT_STABLE_ADDRESSES = new Set([
  '0x84a71ccd554cc1b02749b35d22f684cc8ec987e1', // USDC.e
  '0x0709f39376deee2a2dfc94a58edeb2eb9df012bd', // USDT
])

export const isAbstractStableToken = (address: string) => ABSTRACT_STABLE_ADDRESSES.has(address.toLowerCase())

type LifiToken = {
  chainId: number
  address: string
  decimals: number
  symbol: string
  name: string
  logoURI?: string
}

export const mapAbstractTokens = (tokens: LifiToken[]): TokenInfo[] => {
  const result = new Map<string, TokenInfo>()
  for (const token of tokens) {
    if (
      token.chainId !== ChainId.ABSTRACT ||
      !/^0x[0-9a-fA-F]{40}$/.test(token.address) ||
      !Number.isInteger(token.decimals) ||
      token.decimals < 0 ||
      token.decimals > 254 ||
      typeof token.symbol !== 'string' ||
      typeof token.name !== 'string'
    )
      continue
    const address = token.address.toLowerCase() === ZERO_ADDRESS ? ETHER_ADDRESS : token.address
    result.set(address.toLowerCase(), {
      chainId: ChainId.ABSTRACT,
      address,
      decimals: token.decimals,
      symbol: token.symbol,
      name: token.name,
      logoURI: token.logoURI,
      isWhitelisted: false,
      isStable: isAbstractStableToken(address),
    })
  }
  return [...result.values()]
}

let cache: { tokens: TokenInfo[]; expiresAt: number } | undefined
let pending: Promise<TokenInfo[]> | undefined

export const fetchAbstractTokens = (): Promise<TokenInfo[]> => {
  if (cache && cache.expiresAt > Date.now()) return Promise.resolve(cache.tokens)
  if (pending) return pending
  pending = (async () => {
    const response = await fetch(ABSTRACT_TOKENS_URL)
    if (!response.ok) throw new Error(`Abstract token list failed: ${response.status}`)
    const data = await response.json()
    const tokens = data?.tokens?.[ChainId.ABSTRACT]
    if (!Array.isArray(tokens)) throw new Error('Abstract token list is missing')
    const mapped = mapAbstractTokens(tokens)
    if (!mapped.length) throw new Error('Abstract token list is empty')
    cache = { tokens: mapped, expiresAt: Date.now() + CACHE_TTL }
    return mapped
  })().finally(() => {
    pending = undefined
  })
  return pending
}
