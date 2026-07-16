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

export const resolveTokenIntentPair = (
  intent: TokenIntent,
  subjectToken: string,
  quoteToken: string,
  quoteTokenAliases: string[] = [],
) => {
  const subject = subjectToken.toLowerCase()
  const quote = quoteToken.toLowerCase()
  const isQuoteTokenSubject = [quote, ...quoteTokenAliases.map(alias => alias.toLowerCase())].includes(subject)

  // A manually entered quote-token subject would otherwise produce a quoteToken -> quoteToken pair.
  // Keep the requested subject selected and leave the other side open for the user instead.
  if (isQuoteTokenSubject) {
    return intent === 'buy' ? { fromCurrency: '', toCurrency: subject } : { fromCurrency: subject, toCurrency: '' }
  }

  return intent === 'buy' ? { fromCurrency: quote, toCurrency: subject } : { fromCurrency: subject, toCurrency: quote }
}
