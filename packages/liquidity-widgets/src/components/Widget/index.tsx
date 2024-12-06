import { useEffect } from "react";
import "./Widget.scss";

import { Theme } from "../../theme";
import { PoolType, ChainId } from "../../constants";
import WidgetContent from "../Content";
import { ZapContextProvider } from "../../hooks/useZapInState";
import { TokenListProvider } from "../../hooks/useTokenList";
import Setting from "../Setting";

import "../../globals.css";
import { WidgetProps, WidgetProvider } from "@/stores/widget";

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
  const { theme, aggregatorOptions, source, initDepositTokens, initAmounts } =
    props;

  useEffect(() => {
    if (!theme) return;
    const r = document.querySelector<HTMLElement>(":root");
    Object.keys(theme).forEach((key) => {
      r?.style.setProperty(`--ks-lw-${key}`, theme[key as keyof Theme]);
    });
  }, [theme]);

  return (
    <WidgetProvider {...props}>
      <TokenListProvider>
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
      </TokenListProvider>
    </WidgetProvider>
  );
}
