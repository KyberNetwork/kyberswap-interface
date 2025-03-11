import { useEffect, useMemo } from 'react'

import { DEFAULT_LOCALE, LOCALE_INFO, SupportedLocale } from 'constants/locales'
import { useUserLocale, useUserLocaleManager } from 'state/user/hooks'

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

/**
 * Returns the supported locale read from the user agent (navigator)
 */
export function navigatorLocale(): SupportedLocale | undefined {
  if (!navigator.language) return undefined

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
    return userLocale ?? DEFAULT_LOCALE
  }, [userLocale])
}
