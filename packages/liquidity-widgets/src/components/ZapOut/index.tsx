import "../../globals.css";
import "../Widget/Widget.scss";
import "@kyber/ui/styles.css";

import { ZapOutProps, ZapOutProvider, useZapOutContext } from "@/stores/zapout";
import { Theme } from "@/theme";
import { ReactNode, useEffect } from "react";
import { Header } from "./components/Header";
import { PoolPrice } from "./components/PoolPrice";
import { PositionPriceRange } from "./components/PositionPriceRange";
import { LiquidityToRemove } from "./components/LiquidityToRemove";
import { ZapTo } from "./components/ZapTo";
import { ZapSummary } from "./components/ZapSummary";
import { EstLiqValue } from "./components/EstLiqValue";
import { Preview } from "./components/Preview";
import { TokenListProvider } from "@/hooks/useTokenList";
import PoolInfo from "../Content/PoolInfo";
import { PoolFee } from "./components/PoolFee";
import { Action } from "./components/Action";

export default function ZapOut(props: ZapOutProps) {
  const { theme } = props;

  useEffect(() => {
    if (!theme) return;
    const r = document.querySelector<HTMLElement>(":root");
    Object.keys(theme).forEach((key) => {
      r?.style.setProperty(`--ks-lw-${key}`, theme[key as keyof Theme]);
    });
  }, [theme]);

  return (
    <ZapOutProvider {...props}>
      <TokenProvider chainId={props.chainId}>
        <div className="ks-lw ks-lw-style">
          <div className="px-4 py-6 sm:px-6">
            <Header />
            <div className="grid grid-cols-1 gap-6 mt-4 sm:grid-cols-2">
              <div className="flex flex-col gap-4">
                <div className="-mb-4">
                  <PoolInfo
                    chainId={props.chainId}
                    poolType={props.poolType}
                    positionId={props.positionId}
                    poolAddress={props.poolAddress}
                  />
                </div>
                <PoolPrice />
                <PositionPriceRange />
                <LiquidityToRemove />
                <PoolFee />
              </div>

              <div className="flex flex-col gap-4">
                <ZapTo chainId={props.chainId} />
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
}

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
