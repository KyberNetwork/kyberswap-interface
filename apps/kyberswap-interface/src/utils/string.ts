import { ChainId } from '@kyberswap/ks-sdk-core'
import DOMPurify from 'dompurify'

import { NETWORKS_INFO, SUPPORTED_NETWORKS } from 'constants/networks'

export const queryStringToObject = (queryString: string) => {
  return Object.fromEntries(new URLSearchParams(queryString).entries())
}

export const isInEnum = <T extends Record<string, string>>(str: string, enumParam: T): str is T[keyof T] => {
  return Object.values(enumParam).includes(str)
}

// hello world => hello...
export const shortString = (str: string | undefined, n: number) => {
  if (!str) return ''
  return str.length <= n ? str : str.substring(0, n) + '...'
}

export const escapeScriptHtml = (str: string) => {
  // DOMPurify needs a real DOM; under SSR/prerender it has no `sanitize`. Skip there — the
  // client re-renders (and re-sanitizes) this content on hydration.
  if (typeof DOMPurify.sanitize !== 'function') return str
  return DOMPurify.sanitize(str)
}

export const isEmailValid = (value: string | undefined) =>
  (value || '').trim().match(/^\w+([\.-]?\w)*@\w+([\.-]?\w)*(\.\w{2,10})+$/)

export const getChainIdFromSlug = (network: string | undefined): ChainId | undefined => {
  return SUPPORTED_NETWORKS.find(chainId => NETWORKS_INFO[chainId].route === network)
}

export function capitalizeFirstLetter(str?: string) {
  const string = str || ''
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export function convertStringToBoolean(value?: string) {
  if (!value) return false
  return ['1', 'true', 'yes'].includes(value.toLowerCase())
}
