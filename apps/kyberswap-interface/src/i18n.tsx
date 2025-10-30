import * as uiEnUSCatalog from '@kyber/ui/locales/en-US.mjs'
import * as uiZhCNCatalog from '@kyber/ui/locales/zh-CN.mjs'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { ReactNode, useEffect, useState } from 'react'

import { SupportedLocale } from 'constants/locales'
import { useActiveLocale, useSetLocaleFromUrl } from 'hooks/useActiveLocale'

import * as appEnUSCatalog from './locales/en-US.po'
import * as appZhCNCatalog from './locales/zh-CN.po'

type CatalogModule = { messages?: Record<string, string>; default?: { messages?: Record<string, string> } }

const catalogs: Record<SupportedLocale, { ui: CatalogModule; app: CatalogModule }> = {
  'en-US': { ui: uiEnUSCatalog, app: appEnUSCatalog },
  'zh-CN': { ui: uiZhCNCatalog, app: appZhCNCatalog },
}

const extractMessages = (catalog?: CatalogModule) => catalog?.messages ?? catalog?.default?.messages ?? {}

async function dynamicActivate(locale: SupportedLocale) {
  const { ui, app } = catalogs[locale]
  const messages = { ...extractMessages(ui), ...extractMessages(app) }

  if (!Object.keys(messages).length) {
    throw new Error(`Missing translation catalog for locale "${locale}"`)
  }

  i18n.load(locale, messages)
  i18n.activate(locale)
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  useSetLocaleFromUrl()
  const locale = useActiveLocale()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const targetLocale = catalogs[locale] ? locale : 'en-US'
    dynamicActivate(targetLocale)
      .then(() => {
        setLoaded(true)
      })
      .catch(error => {
        console.error('Failed to activate locale', targetLocale, error)
      })
  }, [locale])

  if (!loaded) return null

  return <I18nProvider i18n={i18n}>{children}</I18nProvider>
}
