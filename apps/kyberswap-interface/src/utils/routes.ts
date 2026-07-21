import { APP_PATHS } from 'constants/index'

const isPathOrChild = (pathname: string, path: string) => pathname === path || pathname.startsWith(`${path}/`)

const SWAP_LIKE_PATHS = [APP_PATHS.SWAP, APP_PATHS.BUY, APP_PATHS.SELL]

export const isSwapLikePath = (pathname: string) => SWAP_LIKE_PATHS.some(path => isPathOrChild(pathname, path))

export enum SwapIntent {
  BUY = 'buy',
  SELL = 'sell',
}

export const getSwapIntentFromPath = (pathname: string): SwapIntent | undefined => {
  if (isPathOrChild(pathname, APP_PATHS.BUY)) return SwapIntent.BUY
  if (isPathOrChild(pathname, APP_PATHS.SELL)) return SwapIntent.SELL
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

type ResolveSwapIntentPairParams = {
  intent: SwapIntent
  subjectToken: string
  nativeToken: string
  stableCounterToken: string
  nativeTokenAliases?: string[]
  wrappedNativeAliases?: string[]
}

export const resolveSwapIntentPair = ({
  intent,
  subjectToken,
  nativeToken,
  stableCounterToken,
  nativeTokenAliases = [],
  wrappedNativeAliases = [],
}: ResolveSwapIntentPairParams) => {
  const subject = subjectToken.toLowerCase()
  const native = nativeToken.toLowerCase()
  const isNativeSubject = [native, ...nativeTokenAliases.map(alias => alias.toLowerCase())].includes(subject)
  const isWrappedNativeSubject = wrappedNativeAliases.map(alias => alias.toLowerCase()).includes(subject)
  const counter = isNativeSubject || isWrappedNativeSubject ? stableCounterToken.toLowerCase() : native
  const normalizedSubject = isNativeSubject ? native : subject

  return intent === SwapIntent.BUY
    ? { fromCurrency: counter, toCurrency: normalizedSubject }
    : { fromCurrency: normalizedSubject, toCurrency: counter }
}
