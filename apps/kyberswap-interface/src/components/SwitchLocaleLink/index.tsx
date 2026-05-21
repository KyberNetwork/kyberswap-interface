import { useMemo } from 'react'
import { useLocation } from 'react-router'

import { DEFAULT_LOCALE, SupportedLocale, getLocaleLabel } from 'constants/locales'
import { navigatorLocale, useActiveLocale } from 'hooks/useActiveLocale'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { StyledInternalLink, TYPE } from 'theme'

export function SwitchLocaleLink() {
  const activeLocale = useActiveLocale()
  const browserLocale = useMemo(() => navigatorLocale(), [])
  const location = useLocation()
  const qs = useParsedQueryString()

  if (browserLocale && (browserLocale !== DEFAULT_LOCALE || activeLocale !== DEFAULT_LOCALE)) {
    let targetLocale: SupportedLocale
    if (activeLocale === browserLocale) {
      targetLocale = DEFAULT_LOCALE
    } else {
      targetLocale = browserLocale
    }

    const target = {
      ...location,
      search: new URLSearchParams({ ...qs, lng: targetLocale }).toString(),
    }

    return (
      <TYPE.small className="!mt-4 opacity-60 hover:opacity-100 max-md:hidden">
        KyberSwap available in: {<StyledInternalLink to={target}>{getLocaleLabel(targetLocale)}</StyledInternalLink>}
      </TYPE.small>
    )
  }

  return null
}
