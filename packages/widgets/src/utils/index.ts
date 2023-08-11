import { getAddress } from 'ethers/lib/utils'
import { NATIVE_TOKEN_ADDRESS, WRAPPED_NATIVE_TOKEN } from '../constants'

// returns the checksummed address if the address is valid, otherwise returns false
export function isAddress(value: string): string | false {
  try {
    return getAddress(value)
  } catch {
    return false
  }
}

export function copyToClipboard(textToCopy: string) {
  // navigator clipboard api needs a secure context (https)
  if (navigator.clipboard && window.isSecureContext) {
    // navigator clipboard api method'
    return navigator.clipboard.writeText(textToCopy)
  } else {
    // text area method
    const textArea = document.createElement('textarea')
    textArea.value = textToCopy
    // make the textarea out of viewport
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    return new Promise((res, rej) => {
      // here the magic happens
      document.execCommand('copy') ? res(textToCopy) : rej()
      textArea.remove()
    })
  }
}

const isNative = (chainId: number, address: string) => {
  if (address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()) return true
  if (address.toLowerCase() === WRAPPED_NATIVE_TOKEN[chainId].address?.toLowerCase()) return true
  return false
}

export function isSameTokenAddress(
  chainId: number,
  tokenAAddress: string | undefined,
  tokenBAddress: string | undefined,
): boolean {
  if (!tokenAAddress) return false
  if (!tokenBAddress) return false
  if (isNative(chainId, tokenAAddress) && isNative(chainId, tokenBAddress)) return true

  return tokenAAddress.toLowerCase() === tokenBAddress.toLowerCase()
}
