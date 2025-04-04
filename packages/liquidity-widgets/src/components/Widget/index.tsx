import { ReactNode, useEffect, useMemo } from "react";
import "./Widget.scss";

import { defaultTheme, Theme } from "../../theme";
import { PoolType, ChainId } from "@/schema";
import WidgetContent from "../Content";
import { ZapContextProvider } from "../../hooks/useZapInState";
import { TokenListProvider } from "../../hooks/useTokenList";
import Setting from "../Setting";

import "../../globals.css";
import { WidgetProps, WidgetProvider, useWidgetContext } from "@/stores/widget";

export { PoolType, ChainId };

// createModalRoot.js
const createModalRoot = () => {
  let modalRoot = document.getElementById("ks-lw-modal-root");
  if (!modalRoot) {
    modalRoot = document.createElement("div");
    modalRoot.id = "ks-lw-modal-root";
    modalRoot.className = "ks-lw-style";
    document.body.appendChild(modalRoot);
  }
};

createModalRoot();

export default function Widget(props: WidgetProps) {
  const {
    theme,
    aggregatorOptions,
    source,
    initDepositTokens,
    initAmounts,
    chainId,
  } = props;

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
    <WidgetProvider {...widgetProps}>
      <TokenProvider chainId={chainId}>
        <ZapContextProvider
          includedSources={aggregatorOptions?.includedSources?.join(",")}
          excludedSources={aggregatorOptions?.excludedSources?.join(",")}
          source={source}
          initDepositTokens={initDepositTokens}
          initAmounts={initAmounts}
        >
          <div className="ks-lw ks-lw-style">
            <WidgetContent />
            <Setting />
          </div>
        </ZapContextProvider>
      </TokenProvider>
    </WidgetProvider>
  );
}

const TokenProvider = ({
  children,
  chainId,
}: {
  children: ReactNode;
  chainId: ChainId;
}) => {
  const pool = useWidgetContext((s) => s.pool);
  return (
    <TokenListProvider chainId={chainId} pool={pool}>
      {children}
    </TokenListProvider>
  );
};
