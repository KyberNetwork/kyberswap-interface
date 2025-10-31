import { ReactNode, useEffect, useState } from 'react';

import { I18nProvider } from '@lingui/react';

import * as uiEnUSCatalog from '@kyber/ui/locales/en-US.mjs';
import * as uiZhCNCatalog from '@kyber/ui/locales/zh-CN.mjs';

import { i18n } from '@/lingui';

import * as widgetEnUSCatalog from './locales/en-US.mjs';
import * as widgetZhCNCatalog from './locales/zh-CN.mjs';

const catalogs = {
  'en-US': { ui: uiEnUSCatalog, widget: widgetEnUSCatalog },
  'zh-CN': { ui: uiZhCNCatalog, widget: widgetZhCNCatalog },
} as const;

export type SupportedLocale = keyof typeof catalogs;

type CatalogModule = { messages?: Record<string, string>; default?: { messages?: Record<string, string> } };

const extractMessages = (catalog?: CatalogModule) => catalog?.messages ?? catalog?.default?.messages ?? {};

async function dynamicActivate(locale: SupportedLocale) {
  const { ui, widget } = catalogs[locale];
  const messages = { ...extractMessages(ui), ...extractMessages(widget) };

  if (!Object.keys(messages).length) {
    throw new Error(`Missing translation catalog for locale "${locale}"`);
  }

  i18n.load(locale, messages);
  i18n.activate(locale);
}

type WidgetI18nProviderProps = {
  locale?: SupportedLocale;
  children: ReactNode;
};

export const WidgetI18nProvider = ({ locale = 'en-US', children }: WidgetI18nProviderProps) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const targetLocale = catalogs[locale] ? locale : 'en-US';
    dynamicActivate(targetLocale)
      .then(() => {
        setLoaded(true);
      })
      .catch(error => {
        console.error('Failed to activate locale', targetLocale, error);
      });
  }, [locale]);

  if (!loaded) return null;

  return <I18nProvider i18n={i18n}>{children}</I18nProvider>;
};
