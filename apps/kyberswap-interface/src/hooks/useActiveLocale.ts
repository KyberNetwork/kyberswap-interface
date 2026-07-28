import { useEffect, useMemo } from 'react'

import { DEFAULT_LOCALE, LOCALE_INFO, SupportedLocale } from 'constants/locales'
import { useUserLocale, useUserLocaleManager } from 'state/user/hooks'
import { readLocaleCookie } from 'utils/localeCookie'

import useParsedQueryString from './useParsedQueryString'

/**
 * Given a locale string (e.g. from user agent), return the best match for corresponding SupportedLocale
 * @param maybeSupportedLocale the fuzzy locale identifier
 */
export function parseLocale(maybeSupportedLocale: string): SupportedLocale | undefined {
  const lowerMaybeSupportedLocale = maybeSupportedLocale.toLowerCase()
  return Object.keys(LOCALE_INFO).find(
    locale => locale.toLowerCase() === lowerMaybeSupportedLocale || locale.split('-')[0] === lowerMaybeSupportedLocale,
  ) as SupportedLocale
}

/** Read the active locale from the ks_locale cookie (SSR-safe — no window/document required). */
function readCookieLocale(): SupportedLocale | undefined {
  const raw = readLocaleCookie()
  if (!raw) return undefined
  // decodeURIComponent throws URIError on a malformed percent-sequence; a corrupted cookie must
  // not white-screen the app, because this runs at module scope (i18n activateInitialLocale).
  try {
    return parseLocale(decodeURIComponent(raw))
  } catch {
    return undefined
  }
}

/** Fallback: read the locale persisted by redux-localstorage-simple (client-only). */
function reduxPersistedLocale(): SupportedLocale | undefined {
  if (typeof localStorage === 'undefined') return undefined
  try {
    const user = JSON.parse(localStorage.getItem('redux_localstorage_simple_user') || '{}')
    return user?.userLocale ? parseLocale(user.userLocale) : undefined
  } catch {
    return undefined
  }
}

/**
 * SSR-safe initial locale: cookie -> redux-persisted -> default. Resolvable without `window`,
 * so build/prerender (and the first client render) can pick the catalog deterministically.
 */
export function getInitialLocale(): SupportedLocale {
  return readCookieLocale() ?? reduxPersistedLocale() ?? DEFAULT_LOCALE
}

/**
 * Returns the supported locale read from the user agent (navigator)
 */
export function navigatorLocale(): SupportedLocale | undefined {
  if (typeof navigator === 'undefined' || !navigator.language) return undefined

  const [language, region] = navigator.language.split('-')

  if (region) {
    return parseLocale(`${language}-${region.toUpperCase()}`) ?? parseLocale(language)
  }

  return parseLocale(language)
}

export function useSetLocaleFromUrl() {
  const { lng } = useParsedQueryString<{ lng: string }>()
  const [userLocale, setUserLocale] = useUserLocaleManager()

  useEffect(() => {
    const urlLocale = typeof lng === 'string' ? parseLocale(lng) : undefined
    if (urlLocale && urlLocale !== userLocale) {
      setUserLocale(urlLocale)
    }
  }, [lng, setUserLocale, userLocale])
}

/**
 * Returns the currently active locale, from a combination of user agent, query string, and user settings stored in redux
 */
export function useActiveLocale(): SupportedLocale {
  const userLocale = useUserLocale()

  return useMemo(() => {
    return userLocale ?? getInitialLocale()
  }, [userLocale])
}
