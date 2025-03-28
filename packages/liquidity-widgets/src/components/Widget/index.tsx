import { ReactNode, useEffect, useMemo, useState } from "react";
import "./Widget.scss";

import { defaultTheme, Theme } from "../../theme";
import { PoolType, ChainId, NetworkInfo } from "../../constants";
import WidgetContent from "../Content";
import { ZapContextProvider } from "../../hooks/useZapInState";
import { TokenListProvider } from "../../hooks/useTokenList";
import Setting from "../Setting";

import "../../globals.css";
import { WidgetProps, WidgetProvider, useWidgetContext } from "@/stores/widget";
import { getFunctionSelector } from "@kyber/utils/crypto";

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
    positionId: purePositionId,
    poolType,
    connectedAccount,
    poolAddress,
  } = props;

  const [positionId, setPositionId] = useState<string | undefined>(
    purePositionId
  );

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

  useEffect(() => {
    if (
      poolType === PoolType.DEX_UNISWAPV2 &&
      !positionId &&
      connectedAccount.address
    ) {
      const balanceOfSelector = getFunctionSelector("balanceOf(address)");
      const paddedAccount = connectedAccount.address
        .replace("0x", "")
        .padStart(64, "0");

      const getPayload = (d: string) => {
        return {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "eth_call",
            params: [
              {
                to: poolAddress,
                data: d,
              },
              "latest",
            ],
            id: 1,
          }),
        };
      };

      fetch(
        NetworkInfo[chainId].defaultRpc,
        getPayload(`0x${balanceOfSelector}${paddedAccount}`)
      )
        .then((res) => res.json())
        .then((res) => {
          if (res.result && BigInt(res.result) > BigInt(0))
            setPositionId(connectedAccount.address);
        });
    }
  }, [chainId, connectedAccount.address, poolAddress, poolType, positionId]);

  const widgetProps = {
    ...props,
    theme: themeToApply,
    positionId,
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
