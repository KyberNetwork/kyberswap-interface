import { dexMapping } from "../constant";
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
  PoolType,
  LiquidityWidget as ZapInWidget,
  ChainId,
} from "@kyberswap/liquidity-widgets";
import "@kyberswap/liquidity-widgets/dist/style.css";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useState } from "react";
import { useAccount, useChainId, useSwitchChain, useWalletClient } from "wagmi";

const ZapIn = () => {
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
    poolType: PoolType;
  }>({
    chainId: ChainId.Base.toString(),
    positionId: "",
    poolAddress: "0xc9034c3e7f58003e6ae0c8438e7c8f4598d5acaa",
    poolType: PoolType.DEX_UNISWAPV3,
  });

  const widgetProps = {
    chainId: params.chainId
      ? Number(params.chainId)
      : ("" as unknown as ChainId),
    positionId: params.positionId || undefined,
    poolAddress: params.poolAddress,
    poolType: params.poolType,
    connectedAccount: {
      address,
      chainId,
    },
    source: "zap-widget-demo",
    onClose: () => {
      setOpenWidget(false);
    },
    onConnectWallet: () => {
      openConnectModal?.();
    },
    onSwitchChain: () => {
      switchChain?.({ chainId: ChainId.Base });
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
    <TabsContent value="zap-in">
      <Card>
        <CardHeader>
          <CardTitle>Zap in widget</CardTitle>
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
                onChange={(e) =>
                  setParams((p) => ({
                    ...p,
                    chainId: e.target.value,
                  }))
                }
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
                  poolType: value as PoolType,
                }))
              }
            >
              {Object.keys(PoolType).map((key, index) => (
                <div className="flex items-center space-x-2" key={key}>
                  <RadioGroupItem
                    value={PoolType[key as keyof typeof PoolType]}
                    id={`${index + 1}`}
                  />
                  <Label className="text-xs" htmlFor={`${index + 1}`}>
                    {key in dexMapping
                      ? dexMapping[key as keyof typeof dexMapping]
                      : PoolType[key as keyof typeof PoolType]}
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
