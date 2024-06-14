import { useEffect, useMemo } from "react";
import "./Widget.scss";
import { Web3Provider } from "../../hooks/useProvider";

import { Theme, defaultTheme } from "../../theme";
import { WidgetProvider } from "../../hooks/useWidgetInfo";
import { providers } from "ethers";
import { NetworkInfo, PoolType } from "../../constants";
import WidgetContent from "../Content";
import { ZapContextProvider } from "../../hooks/useZapInState";
import Setting from "../Setting";

export { PoolType };

// createModalRoot.js
const createModalRoot = () => {
  let modalRoot = document.getElementById("ks-lw-modal-root");
  if (!modalRoot) {
    modalRoot = document.createElement("div");
    modalRoot.id = "ks-lw-modal-root";
    document.body.appendChild(modalRoot);
  }
};

createModalRoot();

export interface WidgetProps {
  theme?: Theme;
  provider: providers.Web3Provider | providers.JsonRpcProvider | undefined;
  poolAddress: string;
  positionId?: string;
  poolType: PoolType;
  chainId: number;
  onDismiss: () => void;
  onTxSubmit?: (txHash: string) => void;
  feeAddress?: string;
  feePcm?: number;
}

export default function Widget({
  theme,
  provider,
  poolAddress,
  positionId,
  chainId,
  poolType,
  onDismiss,
  onTxSubmit,
  feeAddress,
  feePcm,
}: WidgetProps) {
  const defaultProvider = useMemo(
    () => new providers.JsonRpcProvider(NetworkInfo[chainId].defaultRpc),
    [chainId]
  );

  useEffect(() => {
    if (!theme) return;
    const r = document.querySelector<HTMLElement>(":root");
    Object.keys(theme).forEach((key) => {
      r?.style.setProperty(`--ks-lw-${key}`, theme[key as keyof Theme]);
    });
  }, [theme]);

  return (
    <Web3Provider provider={provider || defaultProvider} chainId={chainId}>
      <WidgetProvider
        poolAddress={poolAddress}
        poolType={poolType}
        positionId={positionId}
        theme={theme || defaultTheme}
        feeAddress={feeAddress}
        feePcm={feePcm}
      >
        <ZapContextProvider>
          <div className="ks-lw">
            <WidgetContent onDismiss={onDismiss} onTxSubmit={onTxSubmit} />
            <Setting />
          </div>
        </ZapContextProvider>
      </WidgetProvider>
    </Web3Provider>
  );
}
