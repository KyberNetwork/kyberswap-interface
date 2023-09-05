import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { ReactNode, useEffect, useState } from 'react'

import { SupportedLocale } from 'constants/locales'
import { useActiveLocale, useSetLocaleFromUrl } from 'hooks/useActiveLocale'

async function dynamicActivate(locale: SupportedLocale) {
  const { messages } = await import(`./locales/${locale}.po`)

  i18n.load(locale, messages)
  i18n.activate(locale)
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  useSetLocaleFromUrl()
  const locale = useActiveLocale()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    dynamicActivate(locale)
      .then(() => {
        setLoaded(true)
      })
      .catch(error => {
        console.error('Failed to activate locale', locale, error)
      })
  }, [locale])

  // prevent the app from rendering with placeholder text before the locale is loaded
  if (!loaded) return null

  return <I18nProvider i18n={i18n}>{children}</I18nProvider>
}
