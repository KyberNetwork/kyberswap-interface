import { Zap } from "@/App";
import { zapInDexMapping } from "@/constant";
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
  Label,
  RadioGroup,
  RadioGroupItem,
  TabsContent,
} from "@kyber/ui";
import {
  PoolType as ZapInDex,
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
    poolType: ZapInDex;
  }>({
    chainId: ChainId.Ethereum.toString(),
    positionId: "", // 22415
    poolAddress:
      "0xdbcba57c5681e063bd033c8f735f6b3e62f1a07947a731c61586c00863d0b613",
    poolType: ZapInDex.DEX_UNISWAP_V4_FAIRFLOW,
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
    <TabsContent value={Zap.ZAP_IN}>
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
              value={params.poolType.toString()}
              onValueChange={(value) =>
                setParams((p) => ({
                  ...p,
                  poolType: Number(value) as ZapInDex,
                }))
              }
            >
              {Object.keys(ZapInDex)
                .filter((key) => isNaN(Number(key)))
                .map((key: string, index: number) => (
                  <div className="flex items-center space-x-2" key={key}>
                    <RadioGroupItem
                      value={ZapInDex[key as keyof typeof ZapInDex].toString()}
                      id={`${index + 1}`}
                    />
                    <Label className="text-xs" htmlFor={`${index + 1}`}>
                      {ZapInDex[key as keyof typeof ZapInDex] in zapInDexMapping
                        ? zapInDexMapping[
                            ZapInDex[
                              key as keyof typeof ZapInDex
                            ] as keyof typeof zapInDexMapping
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
