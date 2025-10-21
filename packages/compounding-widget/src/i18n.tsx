import { ReactNode, useEffect, useState } from 'react';

import { I18nProvider } from '@lingui/react';

import { i18n } from '@/lingui';

type CatalogModule = { messages?: Record<string, string>; default?: { messages?: Record<string, string> } };

async function dynamicActivate(locale: SupportedLocale) {
  const catalog: CatalogModule = await import(`./locales/${locale}.mjs`);
  const messages = catalog.messages ?? catalog.default?.messages;

  if (!messages) {
    throw new Error(`Missing translation catalog for locale "${locale}"`);
  }

  i18n.load(locale, messages);
  i18n.activate(locale);
}

const catalogs = {
  'en-US': 'en-US',
  'zh-CN': 'zh-CN',
} as const;

export type SupportedLocale = keyof typeof catalogs;

type WidgetI18nProviderProps = {
  locale?: SupportedLocale;
  children: ReactNode;
};

export const WidgetI18nProvider = ({ locale = 'en-US', children }: WidgetI18nProviderProps) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supportedLocale = catalogs[locale] ? locale : 'en-US';
    dynamicActivate(supportedLocale)
      .then(() => {
        setLoaded(true);
      })
      .catch(error => {
        console.error('Failed to activate locale', locale, error);
      });
  }, [locale]);

  // prevent the app from rendering with placeholder text before the locale is loaded
  if (!loaded) return null;

  return <I18nProvider i18n={i18n}>{children}</I18nProvider>;
};
