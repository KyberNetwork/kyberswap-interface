import { ReactNode, useEffect, useMemo } from 'react';

import '@kyber/ui/styles.css';

import { Action } from '@/components/Action';
import Estimated from '@/components/Estimated';
import { Header } from '@/components/Header';
import { PoolFee } from '@/components/PoolFee';
import { PoolPrice } from '@/components/PoolPrice';
import PoolStat from '@/components/PoolStat';
import PositionLiquidity from '@/components/PositionLiquidity';
import { PositionPriceRange } from '@/components/PositionPriceRange';
import { Preview } from '@/components/Preview';
import { ZapSummary } from '@/components/ZapSummary';
import { ZapTo } from '@/components/ZapTo';
import { TokenListProvider } from '@/hooks/useTokenList';
import { ChainId, PoolType } from '@/schema';
import { ZapOutProps, ZapOutProvider, useZapOutContext } from '@/stores';
import { Theme, defaultTheme } from '@/theme';

import './Widget.scss';
import './globals.css';

const ZapOut = (props: ZapOutProps) => {
  const { theme, chainId, poolType, positionId, poolAddress } = props;

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
    <ZapOutProvider {...widgetProps}>
      <TokenProvider chainId={chainId}>
        <div className="ks-lw ks-lw-style">
          <div className="px-4 py-6 sm:px-6">
            <Header />
            <div className="mt-4 flex gap-5 max-sm:flex-col">
              <div className="flex flex-col gap-4 w-[55%] max-sm:w-full">
                <div className="-mb-4">
                  <PoolStat chainId={chainId} poolType={poolType} positionId={positionId} poolAddress={poolAddress} />
                </div>
                <PositionLiquidity />
                <PoolPrice />
                <PositionPriceRange />
                <PoolFee />
              </div>

              <div className="flex flex-col gap-4 w-[45%] max-sm:w-full">
                <ZapTo chainId={chainId} />
                <Estimated />
                <ZapSummary />
              </div>
            </div>
            <Action />
            <Preview />
          </div>
        </div>
      </TokenProvider>
    </ZapOutProvider>
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

export { ChainId, PoolType, ZapOut };
