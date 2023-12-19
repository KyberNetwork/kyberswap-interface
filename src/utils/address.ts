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
