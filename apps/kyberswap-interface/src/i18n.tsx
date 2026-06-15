// Only the DEFAULT locale (en-US) is statically imported, so the FIRST paint (server prerender
// or client cold load) is translated synchronously with no flash of untranslated keys. Non-default
// locale catalogs are split into separate async chunks (see `lazyCatalogs`) and fetched on demand
// when the user switches language — keeping ~50KB gzip of zh-CN messages out of the eager entry.
import * as appEnUSCatalog from '@/locales/en-US.po'
import * as uiEnUSCatalog from '@kyber/ui/locales/en-US.mjs'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { ReactNode, useEffect } from 'react'

import { DEFAULT_LOCALE, SupportedLocale } from 'constants/locales'
import { getInitialLocale, useActiveLocale, useSetLocaleFromUrl } from 'hooks/useActiveLocale'

type CatalogModule = { messages?: Record<string, string>; default?: { messages?: Record<string, string> } }
type CatalogPair = { ui: CatalogModule; app: CatalogModule }

// Default locale: statically imported so first paint is synchronously translated.
const defaultCatalog: CatalogPair = { ui: uiEnUSCatalog, app: appEnUSCatalog }

// Non-default locales: dynamic-import thunks so Vite emits them as separate async chunks,
// fetched only when the user switches to that locale.
const lazyCatalogs: Partial<Record<SupportedLocale, () => Promise<CatalogPair>>> = {
  'zh-CN': async () => ({
    ui: await import('@kyber/ui/locales/zh-CN.mjs'),
    app: await import('@/locales/zh-CN.po'),
  }),
}

const extractMessages = (catalog?: CatalogModule) => catalog?.messages ?? catalog?.default?.messages ?? {}

function loadAndActivate(target: SupportedLocale, { ui, app }: CatalogPair) {
  const messages = { ...extractMessages(ui), ...extractMessages(app) }

  if (!Object.keys(messages).length) {
    throw new Error(`Missing translation catalog for locale "${target}"`)
  }

  i18n.load(target, messages)
  i18n.activate(target)
}

// Synchronously load + activate the statically-imported default catalog. Always succeeds at the
// catalog level (the catalog ships in the entry); the try/catch keeps a corrupt catalog from
// white-screening the app at module scope.
function activateDefault() {
  try {
    loadAndActivate(DEFAULT_LOCALE, defaultCatalog)
  } catch (error) {
    console.warn('Failed to activate locale', DEFAULT_LOCALE, error)
  }
}

function activate(locale: SupportedLocale) {
  const lazy = locale !== DEFAULT_LOCALE ? lazyCatalogs[locale] : undefined

  // Default locale (and any unknown locale) resolves synchronously from the statically-imported catalog.
  if (!lazy) {
    activateDefault()
    return
  }

  // Non-default locale: ensure a synchronous translated baseline (default catalog) is active so there
  // is no flash of untranslated keys, then fetch the split catalog chunk and switch once it resolves.
  // This never blocks first paint — the app renders in the default locale until the chunk loads.
  if (i18n.locale !== locale) activateDefault()

  lazy()
    .then(catalog => loadAndActivate(locale, catalog))
    .catch(error => console.warn('Failed to activate locale', locale, error))
}

// Activate the cookie/default locale at module load so the FIRST render (server prerender or client)
// is already translated. When the initial locale is the default it activates synchronously (no flash
// of untranslated keys); a non-default persisted locale kicks off its async chunk load without
// blocking first paint (the app renders in the default locale until it resolves).
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
