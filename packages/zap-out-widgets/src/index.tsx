import "./Widget.scss";
import "./globals.css";
import { Action } from "@/components/Action";
import { EstLiqValue } from "@/components/EstLiqValue";
import { Header } from "@/components/Header";
import { LiquidityToRemove } from "@/components/LiquidityToRemove";
import { PoolFee } from "@/components/PoolFee";
import { PoolPrice } from "@/components/PoolPrice";
import PoolStat from "@/components/PoolStat";
import { PositionPriceRange } from "@/components/PositionPriceRange";
import { Preview } from "@/components/Preview";
import { ZapSummary } from "@/components/ZapSummary";
import { ZapTo } from "@/components/ZapTo";
import { TokenListProvider } from "@/hooks/useTokenList";
import { ChainId, PoolType } from "@/schema";
import { ZapOutProps, ZapOutProvider, useZapOutContext } from "@/stores";
import { defaultTheme, Theme } from "@/theme";
import "@kyber/ui/styles.css";
import { ReactNode, useEffect, useMemo } from "react";

const ZapOut = (props: ZapOutProps) => {
  const { theme, chainId, poolType, positionId, poolAddress } = props;

  const themeToApply = useMemo(
    () =>
      theme && typeof theme === "object"
        ? {
            ...defaultTheme,
            ...theme,
          }
        : defaultTheme,
    [theme]
  );

  useEffect(() => {
    if (!themeToApply) return;
    const r = document.querySelector<HTMLElement>(":root");
    Object.keys(themeToApply).forEach((key) => {
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
            <div className="grid grid-cols-1 gap-6 mt-4 sm:grid-cols-2">
              <div className="flex flex-col gap-4">
                <div className="-mb-4">
                  <PoolStat
                    chainId={chainId}
                    poolType={poolType}
                    positionId={positionId}
                    poolAddress={poolAddress}
                  />
                </div>
                <PoolPrice />
                <PositionPriceRange />
                <LiquidityToRemove />
                <PoolFee />
              </div>

              <div className="flex flex-col gap-4">
                <ZapTo chainId={chainId} />
                <EstLiqValue />
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

const TokenProvider = ({
  children,
  chainId,
}: {
  children: ReactNode;
  chainId: number;
}) => {
  const pool = useZapOutContext((s) => s.pool);

  return (
    <TokenListProvider chainId={chainId} pool={pool}>
      {children}
    </TokenListProvider>
  );
};

export { ChainId, PoolType, ZapOut };
