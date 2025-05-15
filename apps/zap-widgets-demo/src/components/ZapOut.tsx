import { zapOutDexMapping } from "../constant";
import Input from "./Input";
import Modal from "./Modal";
import SubmitButton from "./SubmitButton";
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
  PoolType as ZapOutDex,
  ChainId,
  ZapOut as ZapOutWidget,
} from "@kyberswap/zap-out-widgets";
import "@kyberswap/zap-out-widgets/dist/style.css";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useState } from "react";
import { useAccount, useChainId, useSwitchChain, useWalletClient } from "wagmi";

const ZapOut = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const { openConnectModal } = useConnectModal();
  const { data: walletClient } = useWalletClient();
  const { switchChain } = useSwitchChain();

  const [openWidget, setOpenWidget] = useState(false);
  const [params, setParams] = useState<{
    chainId: string;
    positionId: string;
    poolAddress: string;
    poolType: ZapOutDex;
  }>({
    chainId: ChainId.Base.toString(),
    positionId: "35636",
    poolAddress:
      "0x96d4b53a38337a5733179751781178a2613306063c511b78cd02684739288c0a",
    poolType: ZapOutDex.DEX_UNISWAP_V4,
  });

  const widgetProps = {
    chainId: params.chainId ? Number(params.chainId) : ChainId.Base,
    positionId: params.positionId,
    poolAddress: params.poolAddress,
    poolType: params.poolType,
    connectedAccount: {
      address,
      chainId,
    },
    source: "zap-out-demo",
    onClose: () => {
      setOpenWidget(false);
    },
    onConnectWallet: () => {
      openConnectModal?.();
    },
    onSwitchChain: () => {
      switchChain?.({ chainId: Number(params.chainId) });
    },
    onSubmitTx: async (txData: {
      from: string;
      to: string;
      value: string;
      data: string;
      gasLimit: string;
    }) => {
      if (!walletClient) throw new Error("No wallet client");
      try {
        const hash = await walletClient?.sendTransaction({
          account: txData.from as `0x${string}`,
          to: txData.to as `0x${string}`,
          data: txData.data as `0x${string}`,
          value: BigInt(txData.value),
        });
        return hash;
      } catch (e) {
        console.log(e);
        throw e;
      }
    },
  };

  return (
    <TabsContent value="zap-out">
      <Card>
        <CardHeader>
          <CardTitle>Zap out widget</CardTitle>
          <CardDescription>
            Change the pool and position info below. After submit, the widget
            will be opened.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1 max-md:gap-2">
            <div className="space-y-1">
              <Label htmlFor="chainId">Chain Id</Label>
              <Input
                id="chainId"
                placeholder="Chain Id"
                value={params.chainId}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow numbers
                  if (value === "" || /^\d+$/.test(value)) {
                    setParams((p) => ({
                      ...p,
                      chainId: value,
                    }));
                  }
                }}
              />
            </div>
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
          <div className="space-y-1">
            <Label>Protocols</Label>
            <RadioGroup
              className="grid grid-cols-3 gap-2 max-md:grid-cols-2"
              value={params.poolType}
              onValueChange={(value) =>
                setParams((p) => ({
                  ...p,
                  poolType: value as ZapOutDex,
                }))
              }
            >
              {Object.keys(ZapOutDex).map((key, index) => (
                <div className="flex items-center space-x-2" key={key}>
                  <RadioGroupItem
                    value={ZapOutDex[key as keyof typeof ZapOutDex]}
                    id={`${index + 1}`}
                  />
                  <Label className="text-xs" htmlFor={`${index + 1}`}>
                    {ZapOutDex[key as keyof typeof ZapOutDex] in
                    zapOutDexMapping
                      ? zapOutDexMapping[
                          ZapOutDex[
                            key as keyof typeof ZapOutDex
                          ] as keyof typeof zapOutDexMapping
                        ]
                      : ZapOutDex[key as keyof typeof ZapOutDex]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton
            disabled={
              !params.chainId || !params.poolAddress || !params.positionId
            }
            onClick={() => setOpenWidget(true)}
          />

          {openWidget && (
            <Modal onClose={() => setOpenWidget(false)}>
              <ZapOutWidget {...widgetProps} />
            </Modal>
          )}
        </CardFooter>
      </Card>
    </TabsContent>
  );
};

export default ZapOut;
