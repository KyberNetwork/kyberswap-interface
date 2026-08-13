import { APP_PATHS } from 'constants/index'

export const isPathOrChild = (pathname: string, path: string) => pathname === path || pathname.startsWith(`${path}/`)

const SWAP_LIKE_PATHS = [APP_PATHS.SWAP, APP_PATHS.BUY, APP_PATHS.SELL]

export const isSwapLikePath = (pathname: string) => SWAP_LIKE_PATHS.some(path => isPathOrChild(pathname, path))

// Trade products addressed as `{product}/{network}/{tokenIn}-to-{tokenOut}`. Swap owns every other trade path.
const TRADE_PRODUCT_PATHS = [APP_PATHS.LIMIT, APP_PATHS.STOP_LOSS] as const

/** Resolves which trade product a pathname belongs to, so token selection keeps the user on that product. */
export const getTradeProductPath = (pathname: string) =>
  TRADE_PRODUCT_PATHS.find(path => isPathOrChild(pathname, path)) ?? APP_PATHS.SWAP

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

  const selfCanonicalProductPath = TRADE_PRODUCT_PATHS.find(path =>
    syncedPathname.startsWith(`${path}/${networkRoute}/`),
  )
  if (selfCanonicalProductPath) {
    return `${selfCanonicalProductPath}/${networkRoute}`
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
