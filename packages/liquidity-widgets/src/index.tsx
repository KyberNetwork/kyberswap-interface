import { ChainId, PoolType } from '@kyber/schema';
import '@kyber/ui/styles.css';

import Widget from '@/Widget';
import '@/Widget.scss';
import '@/globals.css';
import useInitWidget from '@/hooks/useInitWidget';
import { ZapContextProvider } from '@/hooks/useZapState';
import { SupportedLocale, WidgetI18nProvider } from '@/i18n';
import { OnSuccessProps, TxStatus, WidgetProps } from '@/types/index';

const LiquidityWidget = (widgetProps: WidgetProps) => {
  const { locale } = widgetProps;

  useInitWidget(widgetProps);

  return (
    <WidgetI18nProvider locale={locale}>
      <ZapContextProvider>
        <Widget />
      </ZapContextProvider>
    </WidgetI18nProvider>
  );
};

export { PoolType, ChainId, LiquidityWidget, TxStatus };

export type { OnSuccessProps, SupportedLocale };
