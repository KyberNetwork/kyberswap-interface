import * as appEnUSCatalog from '@/locales/en-US.po'
import * as appZhCNCatalog from '@/locales/zh-CN.po'
import * as uiEnUSCatalog from '@kyber/ui/locales/en-US.mjs'
import * as uiZhCNCatalog from '@kyber/ui/locales/zh-CN.mjs'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { ReactNode, useEffect } from 'react'

import { SupportedLocale } from 'constants/locales'
import { getInitialLocale, useActiveLocale, useSetLocaleFromUrl } from 'hooks/useActiveLocale'

type CatalogModule = { messages?: Record<string, string>; default?: { messages?: Record<string, string> } }

const catalogs: Record<SupportedLocale, { ui: CatalogModule; app: CatalogModule }> = {
  'en-US': { ui: uiEnUSCatalog, app: appEnUSCatalog },
  'zh-CN': { ui: uiZhCNCatalog, app: appZhCNCatalog },
}

const extractMessages = (catalog?: CatalogModule) => catalog?.messages ?? catalog?.default?.messages ?? {}

function activate(locale: SupportedLocale) {
  const target = catalogs[locale] ? locale : 'en-US'
  const { ui, app } = catalogs[target]
  const messages = { ...extractMessages(ui), ...extractMessages(app) }

  if (!Object.keys(messages).length) {
    throw new Error(`Missing translation catalog for locale "${target}"`)
  }

  i18n.load(target, messages)
  i18n.activate(target)
}

// Activate the cookie/default locale synchronously at module load so the FIRST render
// (server prerender or client) is already translated — no null-render gate needed.
// Catalogs are statically imported, so this needs no async/await.
export function activateInitialLocale() {
  activate(getInitialLocale())
}

activateInitialLocale()

export function LanguageProvider({ children }: { children: ReactNode }) {
  useSetLocaleFromUrl()
  const locale = useActiveLocale()

  useEffect(() => {
    activate(locale)
  }, [locale])

  return <I18nProvider i18n={i18n}>{children}</I18nProvider>
}
