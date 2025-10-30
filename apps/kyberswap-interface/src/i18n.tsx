import * as uiEnUSCatalog from '@kyber/ui/locales/en-US.mjs'
import * as uiZhCNCatalog from '@kyber/ui/locales/zh-CN.mjs'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { ReactNode, useEffect, useState } from 'react'

import { SupportedLocale } from 'constants/locales'
import { useActiveLocale, useSetLocaleFromUrl } from 'hooks/useActiveLocale'

type CatalogModule = { messages?: Record<string, string>; default?: { messages?: Record<string, string> } }

const uiCatalogs: Record<SupportedLocale, CatalogModule> = {
  'en-US': uiEnUSCatalog,
  'zh-CN': uiZhCNCatalog,
}

const appCatalogLoaders: Record<SupportedLocale, () => Promise<CatalogModule>> = {
  'en-US': () => import('./locales/en-US.po'),
  'zh-CN': () => import('./locales/zh-CN.po'),
}

const extractMessages = (catalog?: CatalogModule) => catalog?.messages ?? catalog?.default?.messages ?? {}

const fallbackLocale: SupportedLocale = 'en-US'
const supportedLocales = Object.keys(appCatalogLoaders) as SupportedLocale[]

async function dynamicActivate(locale: SupportedLocale) {
  const targetLocale = supportedLocales.includes(locale) ? locale : fallbackLocale

  const [appCatalog] = await Promise.all([appCatalogLoaders[targetLocale]()])
  const uiCatalog = uiCatalogs[targetLocale] ?? uiCatalogs[fallbackLocale]

  const messages = {
    ...extractMessages(uiCatalog),
    ...extractMessages(appCatalog),
  }

  if (!Object.keys(messages).length) {
    throw new Error(`Missing translation catalog for locale "${targetLocale}"`)
  }

  i18n.load(targetLocale, messages)
  i18n.activate(targetLocale)
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  useSetLocaleFromUrl()
  const locale = useActiveLocale()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const targetLocale = supportedLocales.includes(locale) ? locale : fallbackLocale

    dynamicActivate(targetLocale)
      .then(() => {
        setLoaded(true)
      })
      .catch(error => {
        console.error('Failed to activate locale', targetLocale, error)
      })
  }, [locale])

  // prevent the app from rendering with placeholder text before the locale is loaded
  if (!loaded) return null

  return <I18nProvider i18n={i18n}>{children}</I18nProvider>
}
