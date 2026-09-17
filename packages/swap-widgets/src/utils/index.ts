import { NATIVE_IS_ERC20, NATIVE_TOKEN_ADDRESS, WRAPPED_NATIVE_TOKEN } from '../constants'

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

/**
 * Whether the chain's native asset is itself an ERC-20 contract, in which case its two interfaces
 * name one asset and neither can be wrapped into the other.
 */
export const isNativeErc20Chain = (chainId: number) => !!NATIVE_IS_ERC20[chainId]

/** The chain's native asset seen through its ERC-20 interface, where it has one. */
export const nativeErc20Address = (chainId: number): string | undefined =>
  NATIVE_IS_ERC20[chainId] ? WRAPPED_NATIVE_TOKEN[chainId]?.address : undefined

/** Whether the address is the chain's native asset seen through its ERC-20 interface. */
export const isNativeErc20Interface = (chainId: number, address: string | undefined) =>
  !!address && nativeErc20Address(chainId)?.toLowerCase() === address.toLowerCase()

/**
 * The single address the widget uses for a token. Both spellings of the native asset fold onto the
 * sentinel: the sentinel written in any case, and — on a chain whose native asset is also an ERC-20
 * contract — that contract. So a token picked from the list, echoed by the router, or handed in as a
 * prop all name the same thing, and the one the widget offers is the one it can resolve.
 */
export const toWidgetTokenAddress = (chainId: number, address: string): string => {
  if (!address) return address
  if (address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()) return NATIVE_TOKEN_ADDRESS
  return isNativeErc20Interface(chainId, address) ? NATIVE_TOKEN_ADDRESS : address
}

/**
 * The amount trimmed to the precision the router can actually move. Where the native asset is also an
 * ERC-20 contract the pools hold the contract form, so anything finer than its decimals is left
 * behind by the swap — and, since the native side is paid through `msg.value`, not returned either.
 */
export const toRoutableAmount = (chainId: number, tokenAddress: string, amount: string): string => {
  if (tokenAddress !== NATIVE_TOKEN_ADDRESS) return amount
  const decimals = NATIVE_IS_ERC20[chainId] ? WRAPPED_NATIVE_TOKEN[chainId]?.decimals : undefined
  if (decimals === undefined) return amount
  const [whole, fraction = ''] = amount.split('.')
  return fraction.length > decimals ? `${whole}.${fraction.slice(0, decimals)}` : amount
}

const isNative = (chainId: number, address: string) => {
  if (address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()) return true
  if (address.toLowerCase() === WRAPPED_NATIVE_TOKEN[chainId]?.address?.toLowerCase()) return true
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
