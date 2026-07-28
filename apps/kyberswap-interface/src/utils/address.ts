import { ChainId, Token } from '@kyberswap/ks-sdk-core'

// returns the checksummed address if the address is valid, otherwise returns false
export function isAddress(chainId: ChainId, value: any): string | false {
  try {
    return new Token(chainId, value, 0).address
  } catch {
    return false
  }
}

export function isAddressString(value: any): string {
  try {
    return new Token(1, value, 0).address
  } catch {
    return ''
  }
}

/**
 * Shorten the checksummed version of the input address to have 0x + 4 characters at start and end
 */
export function shortenAddress(chainId: ChainId, address: string, chars = 4, checksum = true): string {
  const parsed = isAddress(chainId, address)
  if (!parsed && checksum) {
    throw Error(`Invalid 'address' parameter '${address}' on chain ${chainId}.`)
  }
  const value = (checksum && parsed ? parsed : address) ?? ''
  return `${value.substring(0, chars + 2)}...${value.substring(42 - chars)}`
}

export const shortenHash = (hash: string, chars = 3): string => {
  if (!hash) return ''
  if (hash.length < chars * 2) return hash

  const start = hash.substring(0, chars + 2)
  const end = hash.substring(hash.length - chars)

  return `${start}...${end}`
}

/**
 * This function can handle non-EVM addresses like Tron.
 */
export function getShortenAddress(address: string, showX = false) {
  try {
    return showX
      ? address.substr(0, 6) + 'x'.repeat(address.length - 10) + address.slice(-4)
      : shortenAddress(1, address)
  } catch {
    return address.length > 13
      ? address.substr(0, 6) + (showX ? 'x'.repeat(address.length - 10) : '...') + address.slice(-4)
      : address
  }
}
