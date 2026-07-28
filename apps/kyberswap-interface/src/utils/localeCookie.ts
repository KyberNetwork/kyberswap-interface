// Standalone (no app imports) so both the i18n locale hooks and the user-locale setter can use
// it without a circular dependency. SSR-safe: every accessor guards `typeof document`.
export const KS_LOCALE_COOKIE = 'ks_locale'

/** Persist the chosen locale to the ks_locale cookie so SSR/edge can read it. */
export function setLocaleCookie(locale: string) {
  if (typeof document === 'undefined') return
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${KS_LOCALE_COOKIE}=${encodeURIComponent(locale)}; path=/; max-age=${
    60 * 60 * 24 * 365
  }; SameSite=Lax${secure}`
}

/** Read the raw ks_locale cookie value (undefined when absent or under SSR). */
export function readLocaleCookie(): string | undefined {
  if (typeof document === 'undefined') return undefined
  return document.cookie.match('(^|;)\\s*' + KS_LOCALE_COOKIE + '\\s*=\\s*([^;]+)')?.pop()
}
