import { ReactNode, useEffect, useMemo } from 'react';

import { ChainId, PoolType, Theme, defaultTheme } from '@kyber/schema';
import '@kyber/ui/styles.css';
import { cn } from '@kyber/utils/tailwind-helpers';

import { Action } from '@/components/Action';
import Estimated from '@/components/Estimated';
import { Header } from '@/components/Header';
import HoneypotWarning from '@/components/HoneypotWarning';
import { PoolFee } from '@/components/PoolFee';
import { PoolPrice } from '@/components/PoolPrice';
import PoolStat from '@/components/PoolStat';
import PositionLiquidity from '@/components/PositionLiquidity';
import { PositionPriceRange } from '@/components/PositionPriceRange';
import { Preview } from '@/components/Preview';
import WidgetError from '@/components/WidgetError';
import { ZapSummary } from '@/components/ZapSummary';
import { ZapTo } from '@/components/ZapTo';
import { TokenListProvider } from '@/hooks/useTokenList';
import { SupportedLocale, WidgetI18nProvider } from '@/i18n';
import { ZapOutProvider, useZapOutContext } from '@/stores';
import { useZapOutUserState } from '@/stores/state';
import { TxStatus, ZapOutProps } from '@/types/index';

import './Widget.scss';
import './globals.css';

const createModalRoot = () => {
  let modalRoot = document.getElementById('ks-lw-modal-root');
  if (!modalRoot) {
    modalRoot = document.createElement('div');
    modalRoot.id = 'ks-lw-modal-root';
    modalRoot.className = 'ks-lw-style';
    document.body.appendChild(modalRoot);
  }
};

createModalRoot();

const ZapOut = (props: ZapOutProps) => {
  const { theme, chainId, locale } = props;
  const { buildData } = useZapOutUserState();

  const themeToApply = useMemo(
    () =>
      theme && typeof theme === 'object'
        ? {
            ...defaultTheme,
            ...theme,
          }
        : defaultTheme,
    [theme],
  );

  useEffect(() => {
    if (!themeToApply) return;
    const r = document.querySelector<HTMLElement>(':root');
    Object.keys(themeToApply).forEach(key => {
      r?.style.setProperty(`--ks-lw-${key}`, themeToApply[key as keyof Theme]);
    });
  }, [themeToApply]);

  const widgetProps = {
    ...props,
    theme: themeToApply,
  };

  return (
    <WidgetI18nProvider locale={locale}>
      <ZapOutProvider {...widgetProps}>
        <TokenProvider chainId={chainId}>
          <div className="ks-lw ks-lw-style">
            <div className={cn('px-4 py-6 sm:px-6', buildData ? 'hidden' : '')}>
              <Header />
              <div className="mt-4 flex gap-5 max-sm:flex-col">
                <div className="flex flex-col gap-4 w-[55%] max-sm:w-full">
                  <div className="-mb-4">
                    <PoolStat />
                  </div>
                  <PositionLiquidity />
                  <PoolPrice />
                  <PositionPriceRange />
                  <PoolFee />
                  <HoneypotWarning />
                </div>

                <div className="flex flex-col gap-4 w-[45%] max-sm:w-full">
                  <ZapTo chainId={chainId} />
                  <Estimated />
                  <ZapSummary />
                </div>
              </div>
              <Action />
              <WidgetError />
            </div>
            <Preview />
          </div>
        </TokenProvider>
      </ZapOutProvider>
    </WidgetI18nProvider>
  );
};

const TokenProvider = ({ children, chainId }: { children: ReactNode; chainId: number }) => {
  const pool = useZapOutContext(s => s.pool);

  return (
    <TokenListProvider chainId={chainId} pool={pool}>
      {children}
    </TokenListProvider>
  );
};

export { ChainId, PoolType, ZapOut, TxStatus };

export type { SupportedLocale };
