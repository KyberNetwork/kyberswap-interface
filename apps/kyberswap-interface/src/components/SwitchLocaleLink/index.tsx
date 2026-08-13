import { useMemo } from 'react'
import { useLocation } from 'react-router'

import { HStack } from 'components/Stack'
import { DEFAULT_LOCALE, LOCALE_INFO, SupportedLocale } from 'constants/locales'
import { navigatorLocale, useActiveLocale } from 'hooks/useActiveLocale'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { StyledInternalLink } from 'theme'

type SwitchLocaleLinkProps = {
  centered?: boolean
}

export function SwitchLocaleLink({ centered }: SwitchLocaleLinkProps = {}) {
  const activeLocale = useActiveLocale()
  const browserLocale = useMemo(() => navigatorLocale(), [])
  const location = useLocation()
  const qs = useParsedQueryString()

  if (!browserLocale || (browserLocale === DEFAULT_LOCALE && activeLocale === DEFAULT_LOCALE)) return null

  const targetLocale: SupportedLocale = activeLocale === browserLocale ? DEFAULT_LOCALE : browserLocale
  const target = {
    ...location,
    search: new URLSearchParams({ ...qs, lng: targetLocale }).toString(),
  }
  const { flag, name } = LOCALE_INFO[targetLocale]

  const link = (
    <HStack className="items-center gap-2 text-[11px] font-medium leading-[normal] max-md:hidden">
      <span className="text-text-60">KyberSwap available in:</span>
      <StyledInternalLink
        className="inline-flex items-center gap-1 !no-underline opacity-80 transition-opacity hover:!no-underline hover:opacity-100 focus:!no-underline"
        to={target}
      >
        <img src={flag} className="h-4 shrink-0" alt="" />
        <span>{name}</span>
      </StyledInternalLink>
    </HStack>
  )

  if (!centered) return link

  return <HStack className="justify-center">{link}</HStack>
}
