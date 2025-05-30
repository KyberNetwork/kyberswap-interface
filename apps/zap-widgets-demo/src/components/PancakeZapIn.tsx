import { pancakeZapInDexMapping } from "@/constant";
import Input from "@/components/Input";
import Modal from "@/components/Modal";
import SubmitButton from "@/components/SubmitButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@kyber/ui/card";
import { Label } from "@kyber/ui/label";
import { RadioGroup, RadioGroupItem } from "@kyber/ui/radio-group";
import { TabsContent } from "@kyber/ui/tabs";
import {
  LiquidityWidget as ZapInWidget,
  Dex as ZapInDex,
} from "@kyberswap/pancake-liquidity-widgets";
import "@kyberswap/pancake-liquidity-widgets/dist/style.css";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useCallback, useState } from "react";
import { useAccount, useChainId, useWalletClient } from "wagmi";
import { Zap } from "@/App";

const ZapIn = () => {
  const { address: account } = useAccount();
  const chainId = useChainId();
  const { openConnectModal } = useConnectModal();
  const { data: walletClient } = useWalletClient();

  const [openWidget, setOpenWidget] = useState(false);
  const [params, setParams] = useState<{
    chainId: number;
    positionId: string;
    poolAddress: string;
    poolType: ZapInDex;
    initTickLower: string;
    initTickUpper: string;
    initDepositTokens: string;
    initAmounts: string;
    theme: "dark" | "light";
  }>({
    chainId: 56,
    initTickLower: "",
    initTickUpper: "",
    initDepositTokens: "",
    initAmounts: "",
    theme: "dark",

    positionId: "",
    // positionId: "6361",
    poolAddress:
      "0x752e76950f6167b8dbb0495b957d264d61724dfa26e3dd6fad1ba820862ce9cf",
    poolType: ZapInDex.DEX_PANCAKE_INFINITY_CL,

    // poolAddress: "0x133b3d95bad5405d14d53473671200e9342896bf",
    // poolType: ZapInDex.DEX_PANCAKESWAPV3,
    // positionId: "1373488",
  });

  const handleAddTokens = useCallback((tokenAddresses: string) => {
    const amountsToAdd = tokenAddresses
      .split("")
      .filter((item) => item === ",")
      .join("");
    setParams((params) => ({
      ...params,
      initDepositTokens: params.initDepositTokens
        ? `${params.initDepositTokens},${tokenAddresses}`
        : tokenAddresses,
      initAmounts: params.initAmounts
        ? `${params.initAmounts},${amountsToAdd}`
        : amountsToAdd,
    }));
  }, []);

  // required
  const handleRemoveToken = useCallback(
    (tokenAddress: string) => {
      const tokens = params.initDepositTokens.split(",");
      const indexOfToken = tokens.findIndex(
        (t) => t.toLowerCase() === tokenAddress.toLowerCase()
      );
      if (indexOfToken === -1) return;

      tokens.splice(indexOfToken, 1);
      const amounts = params.initAmounts.split(",");
      amounts.splice(indexOfToken, 1);
      setParams((params) => ({
        ...params,
        initDepositTokens: tokens.join(","),
        initAmounts: amounts.join(","),
      }));
    },
    [params.initAmounts, params.initDepositTokens]
  );

  // required
  const handleAmountChange = useCallback(
    (tokenAddress: string, amount: string) => {
      const tokens = params.initDepositTokens.split(",");
      const indexOfToken = tokens.findIndex(
        (t) => t.toLowerCase() === tokenAddress.toLowerCase()
      );
      if (indexOfToken === -1) return;

      const amounts = params.initAmounts.split(",");
      amounts[indexOfToken] = amount;
      setParams((params) => ({
        ...params,
        initAmounts: amounts.join(","),
      }));
    },
    [params.initAmounts, params.initDepositTokens]
  );

  const widgetProps = {
    chainId: params.chainId ? Number(params.chainId) : 0,
    positionId: params.positionId || undefined,
    poolAddress: params.poolAddress,
    dex: params.poolType,
    initTickLower: params.initTickLower ? +params.initTickLower : undefined,
    initTickUpper: params.initTickUpper ? +params.initTickUpper : undefined,
    theme: params.theme,
    initDepositTokens: params.initDepositTokens,
    initAmounts: params.initAmounts,
    walletClient,
    account,
    networkChainId: chainId,
    source: "zap-widget-demo",
    farmContractAddresses: ["0x556B9306565093C855AEA9AE92A594704c2Cd59e"],
    feePcm: 0,
    feeAddress: "0xB82bb6Ce9A249076Ca7135470e7CA634806De168",
    onAddTokens: handleAddTokens,
    onRemoveToken: handleRemoveToken,
    onAmountChange: handleAmountChange,
    onConnectWallet: () => {
      openConnectModal?.();
    },
    onOpenTokenSelectModal: () => console.log("Token select modal opened"),
    onDismiss: () => setOpenWidget(false),
  };

  return (
    <TabsContent value={Zap.PANCAKE_ZAP_IN}>
      <Card>
        <CardHeader>
          <CardTitle>Pancake zap in widget</CardTitle>
          <CardDescription>
            Change the pool and position info below. After submit, the widget
            will be opened.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1 max-md:gap-2">
            {/* Chain Id */}
            <div className="space-y-1">
              <Label htmlFor="chainId">Chain Id</Label>
              <Input
                id="chainId"
                placeholder="Chain Id"
                value={params.chainId}
                onChange={(e) =>
                  setParams((p) => ({
                    ...p,
                    chainId: Number(e.target.value),
                  }))
                }
              />
            </div>

            {/* Position Id */}
            <div className="space-y-1">
              <Label htmlFor="positionId">Position Id</Label>
              <Input
                id="positionId"
                placeholder="Position Id"
                value={params.positionId}
                onChange={(e) =>
                  setParams((p) => ({ ...p, positionId: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Pool address */}
          <div className="space-y-1">
            <Label htmlFor="pooladdress">Pool address</Label>
            <Input
              id="pooladdress"
              placeholder="Pool address"
              value={params.poolAddress}
              onChange={(e) =>
                setParams((p) => ({ ...p, poolAddress: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1 max-md:gap-2">
            {/* Tokens In */}
            <div className="space-y-1">
              <Label htmlFor="initDepositTokens">Tokens in</Label>
              <Input
                id="initDepositTokens"
                placeholder="Tokens in"
                value={params.initDepositTokens}
                onChange={(e) =>
                  setParams((p) => ({
                    ...p,
                    initDepositTokens: e.target.value,
                  }))
                }
              />
            </div>

            {/* Amounts In */}
            <div className="space-y-1">
              <Label htmlFor="initAmounts">Amounts in</Label>
              <Input
                id="initAmounts"
                placeholder="Amounts in"
                value={params.initAmounts}
                onChange={(e) =>
                  setParams((p) => ({ ...p, initAmounts: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Theme */}
          <div className="space-y-1">
            <Label>Theme</Label>
            <RadioGroup
              className="grid grid-cols-3 gap-2 max-md:grid-cols-2"
              value={params.theme}
              onValueChange={(value) =>
                setParams((p) => ({
                  ...p,
                  theme: value as "dark" | "light",
                }))
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="theme-dark" />
                <Label className="text-xs" htmlFor={`theme-dark`}>
                  Dark
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="theme-light" />
                <Label className="text-xs" htmlFor={`theme-light`}>
                  Light
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Protocols */}
          <div className="space-y-1 mt-1">
            <Label>Protocols</Label>
            <RadioGroup
              className="grid grid-cols-3 gap-2 max-md:grid-cols-2"
              value={params.poolType}
              onValueChange={(value) =>
                setParams((p) => ({
                  ...p,
                  poolType: value as ZapInDex,
                }))
              }
            >
              {Object.keys(ZapInDex).map((key: string, index: number) => (
                <div className="flex items-center space-x-2" key={key}>
                  <RadioGroupItem
                    value={ZapInDex[key as keyof typeof ZapInDex]}
                    id={`${index + 1}`}
                  />
                  <Label className="text-xs" htmlFor={`${index + 1}`}>
                    {ZapInDex[key as keyof typeof ZapInDex] in
                    pancakeZapInDexMapping
                      ? pancakeZapInDexMapping[
                          ZapInDex[
                            key as keyof typeof ZapInDex
                          ] as keyof typeof pancakeZapInDexMapping
                        ]
                      : ZapInDex[key as keyof typeof ZapInDex]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton
            disabled={!params.chainId || !params.poolAddress}
            onClick={() => setOpenWidget(true)}
          />

          {openWidget && (
            <Modal onClose={() => setOpenWidget(false)}>
              <ZapInWidget {...widgetProps} />
            </Modal>
          )}
        </CardFooter>
      </Card>
    </TabsContent>
  );
};

export default ZapIn;
