import { useEffect, useMemo } from "react";
import { WalletClient, Address, http, createPublicClient } from "viem";
import * as chains from "viem/chains";

import { Web3Provider } from "../../hooks/useProvider";
import { Theme, defaultTheme, lightTheme } from "../../theme";
import { WidgetProvider } from "../../hooks/useWidgetInfo";
import WidgetContent from "../Content";
import { ZapContextProvider } from "../../hooks/useZapInState";
import Setting from "../Setting";

import "./Widget.scss";

const getChainById = (chainId: number) => {
  return Object.values(chains).find((chain) => chain.id === chainId);
};

export interface WidgetProps {
  theme?: Theme | "dark" | "light";

  walletClient: WalletClient | undefined;
  account: Address | undefined;
  chainId: number;
  networkChainId: number;
  initTickLower?: number;
  initTickUpper?: number;
  initDepositToken?: string;
  initAmount?: number | string;

  poolAddress: string;
  positionId?: string;
  onDismiss: () => void;
  onTxSubmit?: (txHash: string) => void;
  feeAddress?: string;
  feePcm?: number;
  source: string;
  includedSources?: string;
  excludedSources?: string;
  onConnectWallet: () => void;
}

export default function Widget({
  theme: themeProps,

  walletClient,
  account,
  chainId,
  networkChainId,

  initTickLower,
  initTickUpper,
  initDepositToken,
  initAmount,
  poolAddress,
  positionId,
  onDismiss,
  onTxSubmit,
  feeAddress,
  feePcm,
  includedSources,
  excludedSources,
  source,
  onConnectWallet,
}: WidgetProps) {
  const publicClient = useMemo(() => {
    const chain = getChainById(chainId);
    if (!chain) {
      throw new Error(`chainId: ${chainId} is not supported`);
    }

    return createPublicClient({
      chain,
      transport: http(),
    });
  }, [chainId]);

  const theme: Theme = useMemo(() => {
    if (themeProps === "light") return lightTheme;
    return defaultTheme;
  }, [themeProps]);

  useEffect(() => {
    if (!theme) return;
    const r = document.querySelector<HTMLElement>(":root");
    Object.keys(theme).forEach((key) => {
      r?.style.setProperty(`--ks-lw-${key}`, theme[key as keyof Theme]);
    });
  }, [theme]);

  useEffect(() => {
    const createModalRoot = () => {
      let modalRoot = document.getElementById("ks-lw-modal-root");
      if (!modalRoot) {
        modalRoot = document.createElement("div");
        modalRoot.id = "ks-lw-modal-root";
        document.body.appendChild(modalRoot);
      }
    };

    createModalRoot();
  }, []);

  return (
    <Web3Provider
      walletClient={walletClient}
      // @ts-ignore
      publicClient={publicClient}
      chainId={chainId}
      account={account}
      networkChainId={networkChainId}
    >
      <WidgetProvider
        poolAddress={poolAddress}
        positionId={
          positionId === "" || !parseInt(positionId || "")
            ? undefined
            : positionId
        }
        theme={theme || defaultTheme}
        feeAddress={feeAddress}
        feePcm={feePcm}
        onConnectWallet={onConnectWallet}
      >
        <ZapContextProvider
          includedSources={includedSources}
          excludedSources={excludedSources}
          initTickUpper={initTickUpper}
          initTickLower={initTickLower}
          initDepositToken={initDepositToken}
          initAmount={initAmount}
          source={source}
        >
          <div className="ks-lw">
            <WidgetContent onDismiss={onDismiss} onTxSubmit={onTxSubmit} />
            <Setting />
          </div>
        </ZapContextProvider>
      </WidgetProvider>
    </Web3Provider>
  );
}
