import { NATIVE_TOKEN_ADDRESS } from '@kyber/schema'

import { isAddressString } from 'utils/address'

export const NATIVE_TOKEN_PRICE_KEY = NATIVE_TOKEN_ADDRESS.toLowerCase()

/**
 * `isAddressString` builds a `Token` to checksum, which is far too slow to run per address on every
 * render of a long list. The mapping is pure, so cache it for the session.
 */
const checksumCache = new Map<string, string>()

export const checksum = (address: string) => {
  const cached = checksumCache.get(address)
  if (cached !== undefined) return cached
  const result = isAddressString(address)
  checksumCache.set(address, result)
  return result
}

/**
 * Build a consumer's price map: total over `tokenList`, `0`-filled, and emitted under both the
 * lowercased address and its checksummed alias because call sites index it either way — many with
 * bare arithmetic, so a missing key silently turns every USD figure into `$0`.
 */
export const resolvePriceMap = (
  tokenList: string[],
  chainPrices: { [address: string]: number | null },
  wrappedNativeAddress?: string,
): { [address: string]: number } =>
  tokenList.reduce<Record<string, number>>((acc, address) => {
    const price =
      (address === NATIVE_TOKEN_PRICE_KEY && wrappedNativeAddress
        ? chainPrices[address] || chainPrices[wrappedNativeAddress]
        : chainPrices[address]) || 0

    acc[address] = price
    const checksummed = checksum(address)
    // An unparseable address checksums to '', which would collide every bad address on one key.
    if (checksummed) acc[checksummed] = price
    return acc
  }, {})
