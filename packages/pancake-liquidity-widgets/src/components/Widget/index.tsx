import { useEffect, useMemo } from "react";
import { WalletClient, Address, http, createPublicClient } from "viem";
import * as chains from "viem/chains";
import { Theme, defaultTheme, lightTheme } from "@/theme";
import Setting from "@/components/Setting";
import WidgetContent from "@/components/Content";
import { Web3Provider } from "@/hooks/useProvider";
import { TokenProvider } from "@/hooks/useTokens";
import { WidgetProvider } from "@/hooks/useWidgetInfo";
import { ZapContextProvider } from "@/hooks/useZapInState";
import { PoolType, NetworkInfo } from "@/constants";
import "./Widget.scss";
import "../../globals.css";

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
  poolAddress: string;
  positionId?: string;
  feeAddress?: string;
  feePcm?: number;
  source: string;
  includedSources?: string;
  excludedSources?: string;
  initDepositTokens: string;
  initAmounts: string;
  poolType: PoolType;
  onDismiss: () => void;
  onTxSubmit?: (txHash: string) => void;
  onConnectWallet: () => void;
  onAddTokens: (tokenAddresses: string) => void;
  onRemoveToken: (tokenAddress: string) => void;
  onAmountChange: (tokenAddress: string, amount: string) => void;
  onOpenTokenSelectModal: () => void;
  farmContractAddresses?: string[];
}

export default function Widget({
  theme: themeProps,
  walletClient,
  account,
  chainId,
  networkChainId,
  initTickLower,
  initTickUpper,
  poolAddress,
  positionId,
  feeAddress,
  feePcm,
  includedSources,
  excludedSources,
  source,
  initDepositTokens,
  initAmounts,
  onDismiss,
  onTxSubmit,
  onConnectWallet,
  onAddTokens,
  onRemoveToken,
  onAmountChange,
  onOpenTokenSelectModal,
  farmContractAddresses = [],
  poolType,
}: WidgetProps) {
  const publicClient = useMemo(() => {
    const chain = getChainById(chainId);
    if (!chain) {
      throw new Error(`chainId: ${chainId} is not supported`);
    }

    return createPublicClient({
      chain,
      transport: http(NetworkInfo[chainId].defaultRpc),
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
        modalRoot.className = "ks-lw-style";
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
      <TokenProvider>
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
          onAddTokens={onAddTokens}
          onRemoveToken={onRemoveToken}
          onAmountChange={onAmountChange}
          onOpenTokenSelectModal={onOpenTokenSelectModal}
          farmContractAddresses={farmContractAddresses}
          poolType={poolType}
        >
          <ZapContextProvider
            includedSources={includedSources}
            excludedSources={excludedSources}
            initTickUpper={initTickUpper}
            initTickLower={initTickLower}
            source={source}
            initDepositTokens={initDepositTokens}
            initAmounts={initAmounts}
          >
            <div className="ks-lw ks-lw-style">
              <WidgetContent onDismiss={onDismiss} onTxSubmit={onTxSubmit} />
              <Setting />
            </div>
          </ZapContextProvider>
        </WidgetProvider>
      </TokenProvider>
    </Web3Provider>
  );
}

export { PoolType };
