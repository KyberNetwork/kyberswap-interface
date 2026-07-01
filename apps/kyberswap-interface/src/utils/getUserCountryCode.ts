import { getCountryForTimezone } from 'countries-and-timezones'

/**
 * Resolve the user's country from the browser timezone, returned as a lowercase
 * ISO 3166-1 alpha-2 code (e.g. 'sg'). Returns undefined when the timezone is
 * unavailable or cannot be mapped to a country.
 *
 * Note: timezone is client-controlled, so this is a UX signal only — it is not a
 * compliance boundary. Enforcement must be done server-side.
 */
export const getUserCountryCode = (): string | undefined => {
  if (typeof Intl === 'undefined') return undefined
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (!timezone) return undefined
  return getCountryForTimezone(timezone)?.id?.toLowerCase()
}
