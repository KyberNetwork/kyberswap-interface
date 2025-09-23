import { zapMigrationDexMapping } from "@/constant";
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
  Checkbox,
} from "@kyber/ui";
import {
  PoolType as ZapMigrationDex,
  ZapMigration as ZapMigrationWidget,
  ChainId,
} from "@kyberswap/zap-migration-widgets";
import "@kyberswap/zap-migration-widgets/dist/style.css";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useState } from "react";
import { useAccount, useChainId, useSwitchChain, useWalletClient } from "wagmi";
import { Zap } from "@/App";
import { cn } from "@kyber/utils/tailwind-helpers";

const ZapMigration = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const { openConnectModal } = useConnectModal();
  const { data: walletClient } = useWalletClient();
  const { switchChain } = useSwitchChain();

  const [openWidget, setOpenWidget] = useState(false);
  const [params, setParams] = useState<{
    chainId: string;
    from: {
      poolType: ZapMigrationDex;
      poolAddress: string;
      positionId: number | string | undefined;
    };
    to: {
      poolType: ZapMigrationDex;
      poolAddress: string;
      positionId: number | string | undefined;
    };
    rePositionMode: boolean;
  }>({
    chainId: ChainId.Ethereum.toString(),
    from: {
      poolType: ZapMigrationDex.DEX_UNISWAP_V4_FAIRFLOW,
      poolAddress:
        "0xce93ea3914c62e0008348cf39fd006e130e7c503935fb01d154b971c8663f4fb",
      positionId: "66205",
    },
    to: {
      poolType: ZapMigrationDex.DEX_UNISWAP_V4_FAIRFLOW,
      poolAddress:
        "0x3b1bd35a555160a9b60c7524db56029c2025ab93b69d97d33ca3f1c23b6494ad",
      positionId: "32321",
      // positionId: undefined,
    },
    rePositionMode: false,
  });

  const widgetProps = {
    chainId: +params.chainId,
    from: {
      poolType: +params.from.poolType,
      poolAddress: params.from.poolAddress,
      positionId: (params.from.positionId || -1).toString(),
    },
    to: !params.rePositionMode
      ? {
          poolType: +params.to.poolType,
          poolAddress: params.to.poolAddress,
          positionId: params.to.positionId?.toString(),
        }
      : undefined,
    rePositionMode: params.rePositionMode,
    client: "zap-migration-demo",
    connectedAccount: {
      address,
      chainId,
    },
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
    <TabsContent value={Zap.ZAP_MIGRATION}>
      <Card>
        <CardHeader>
          <CardTitle>Zap migration widget</CardTitle>
          <CardDescription>
            Change the pool and position info below. After submit, the widget
            will be opened.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1">
            <div className="flex items-center space-x-1.5">
              <Checkbox
                checked={params.rePositionMode}
                onChange={(checked) =>
                  setParams((p) => ({ ...p, rePositionMode: checked }))
                }
              />
              <Label htmlFor="rePositionMode">Reposition</Label>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="chainId">Chain Id</Label>
            <Input
              id="chainId"
              className="w-[150px]"
              placeholder="Chain Id"
              value={params.chainId}
              onChange={(e) =>
                setParams((p) => ({ ...p, chainId: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1 max-md:gap-8">
            <div className="space-y-1.5">
              <Label>Zap from</Label>
              <div className="space-y-1">
                <Label htmlFor="from-pool" className="text-xs text-[#ffffff66]">
                  Pool address
                </Label>
                <Input
                  id="from-pool"
                  placeholder="Pool address"
                  value={params.from.poolAddress}
                  onChange={(e) =>
                    setParams((p) => ({
                      ...p,
                      from: { ...p.from, poolAddress: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="from-position"
                  className="text-xs text-[#ffffff66]"
                >
                  Position Id
                </Label>
                <Input
                  id="from-position"
                  placeholder="Position Id"
                  value={params.from.positionId}
                  onChange={(e) =>
                    setParams((p) => ({
                      ...p,
                      from: { ...p.from, positionId: e.target.value },
                    }))
                  }
                />
              </div>
              <Label className="relative top-1 text-xs text-[#ffffff66]">
                Protocols
              </Label>
              <RadioGroup
                className="grid grid-cols-2 gap-2"
                value={params.from.poolType.toString()}
                onValueChange={(value) =>
                  setParams((p) => ({
                    ...p,
                    from: { ...p.from, poolType: value as any },
                  }))
                }
              >
                {Object.keys(ZapMigrationDex)
                  .filter((key) => isNaN(Number(key)))
                  .map((key: string, index: number) => {
                    return (
                      <div className="flex items-center space-x-2" key={key}>
                        <RadioGroupItem
                          value={ZapMigrationDex[
                            key as keyof typeof ZapMigrationDex
                          ].toString()}
                          id={`from-${index + 1}`}
                        />
                        <Label
                          className="text-xs"
                          htmlFor={`from-${index + 1}`}
                        >
                          {ZapMigrationDex[
                            key as keyof typeof ZapMigrationDex
                          ] in zapMigrationDexMapping
                            ? zapMigrationDexMapping[
                                ZapMigrationDex[
                                  key as keyof typeof ZapMigrationDex
                                ] as keyof typeof zapMigrationDexMapping
                              ]
                            : ZapMigrationDex[
                                key as keyof typeof ZapMigrationDex
                              ]}
                        </Label>
                      </div>
                    );
                  })}
              </RadioGroup>
            </div>
            <div
              className={cn(
                "space-y-1.5",
                params.rePositionMode && "opacity-50 cursor-not-allowed"
              )}
            >
              <Label>Zap to</Label>
              <div className="space-y-1">
                <Label htmlFor="to-pool" className="text-xs text-[#ffffff66]">
                  Pool address
                </Label>
                <Input
                  id="to-pool"
                  placeholder="Pool address"
                  disabled={params.rePositionMode}
                  value={params.to.poolAddress}
                  onChange={(e) =>
                    setParams((p) => ({
                      ...p,
                      to: { ...p.to, poolAddress: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="to-position-id"
                  className="text-xs text-[#ffffff66]"
                >
                  Position Id
                </Label>
                <Input
                  id="to-position-id"
                  placeholder="Position Id"
                  disabled={params.rePositionMode}
                  value={params.to.positionId}
                  onChange={(e) =>
                    setParams((p) => ({
                      ...p,
                      to: { ...p.to, positionId: e.target.value },
                    }))
                  }
                />
              </div>
              <Label className="relative top-1 text-xs text-[#ffffff66]">
                Protocols
              </Label>
              <RadioGroup
                className="grid grid-cols-2 gap-2"
                disabled={params.rePositionMode}
                value={params.to.poolType.toString()}
                onValueChange={(value) =>
                  setParams((p) => ({
                    ...p,
                    to: { ...p.to, poolType: value as any },
                  }))
                }
              >
                {Object.keys(ZapMigrationDex)
                  .filter((key) => isNaN(Number(key)))
                  .map((key: string, index: number) => {
                    return (
                      <div className="flex items-center space-x-2" key={key}>
                        <RadioGroupItem
                          value={ZapMigrationDex[
                            key as keyof typeof ZapMigrationDex
                          ].toString()}
                          id={`to-${index + 1}`}
                        />
                        <Label className="text-xs" htmlFor={`to-${index + 1}`}>
                          {ZapMigrationDex[
                            key as keyof typeof ZapMigrationDex
                          ] in zapMigrationDexMapping
                            ? zapMigrationDexMapping[
                                ZapMigrationDex[
                                  key as keyof typeof ZapMigrationDex
                                ] as keyof typeof zapMigrationDexMapping
                              ]
                            : ZapMigrationDex[
                                key as keyof typeof ZapMigrationDex
                              ]}
                        </Label>
                      </div>
                    );
                  })}
              </RadioGroup>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton
            disabled={
              !params.from.poolAddress ||
              (!params.to.poolAddress && !params.rePositionMode) ||
              !params.from.positionId ||
              !params.chainId
            }
            onClick={() => setOpenWidget(true)}
          />

          {openWidget && (
            <Modal
              className="max-w-[850px]"
              onClose={() => setOpenWidget(false)}
            >
              <ZapMigrationWidget {...widgetProps} />
            </Modal>
          )}
        </CardFooter>
      </Card>
    </TabsContent>
  );
};

export default ZapMigration;
