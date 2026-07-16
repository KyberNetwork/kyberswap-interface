import { APP_PATHS } from 'constants/index'

const isPathOrChild = (pathname: string, path: string) => pathname === path || pathname.startsWith(`${path}/`)

const SWAP_LIKE_PATHS = [APP_PATHS.SWAP, APP_PATHS.BUY, APP_PATHS.SELL]

export const isSwapLikePath = (pathname: string) => SWAP_LIKE_PATHS.some(path => isPathOrChild(pathname, path))

export type TokenIntent = 'buy' | 'sell'

export const getTokenIntentFromPath = (pathname: string): TokenIntent | undefined => {
  if (isPathOrChild(pathname, APP_PATHS.BUY)) return 'buy'
  if (isPathOrChild(pathname, APP_PATHS.SELL)) return 'sell'
  return undefined
}

export const getSyncedNetworkPathname = (pathname: string, networkParam: string, networkRoute: string) => {
  const syncedPathname = pathname.replace(encodeURIComponent(networkParam), networkRoute)

  if (
    [APP_PATHS.SWAP, APP_PATHS.BUY, APP_PATHS.SELL].some(path => syncedPathname.startsWith(`${path}/${networkRoute}/`))
  ) {
    return `${APP_PATHS.SWAP}/${networkRoute}`
  }

  if (syncedPathname.startsWith(`${APP_PATHS.LIMIT}/${networkRoute}/`)) {
    return `${APP_PATHS.LIMIT}/${networkRoute}`
  }

  return syncedPathname
}

export const resolveTokenIntentPair = (
  intent: TokenIntent,
  subjectToken: string,
  nativeToken: string,
  stableCounterToken: string,
  nativeTokenAliases: string[] = [],
) => {
  const subject = subjectToken.toLowerCase()
  const native = nativeToken.toLowerCase()
  const isNativeSubject = [native, ...nativeTokenAliases.map(alias => alias.toLowerCase())].includes(subject)
  const counter = isNativeSubject ? stableCounterToken.toLowerCase() : native
  const normalizedSubject = isNativeSubject ? native : subject

  return intent === 'buy'
    ? { fromCurrency: counter, toCurrency: normalizedSubject }
    : { fromCurrency: normalizedSubject, toCurrency: counter }
}
