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
  Dex,
  ZapMigration as ZapMigrationWidget,
  ChainId,
} from "@kyberswap/zap-migration-widgets";
import "@kyberswap/zap-migration-widgets/dist/style.css";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useState } from "react";
import { useAccount, useChainId, useSwitchChain, useWalletClient } from "wagmi";

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
      dex: Dex;
      poolId: string;
      positionId: number | string | undefined;
    };
    to: {
      dex: Dex;
      poolId: string;
      positionId: number | string | undefined;
    };
  }>({
    chainId: ChainId.Base.toString(),
    from: {
      dex: Dex.DEX_UNISWAP_V4,
      poolId:
        "0x96d4b53a38337a5733179751781178a2613306063c511b78cd02684739288c0a",
      positionId: 35636,
    },
    to: {
      dex: Dex.DEX_UNISWAPV3,
      poolId: "0xd364eb55e17700b54bd75feb3f14582ed7a29444",
      positionId: undefined,
    },
  });

  const widgetProps = {
    chainId: +params.chainId,
    from: {
      dex: +params.from.dex,
      poolId: params.from.poolId,
      positionId: params.from.positionId || -1,
    },
    to: {
      dex: +params.to.dex,
      poolId: params.to.poolId,
      positionId: params.to.positionId,
    },
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
      switchChain?.({ chainId: ChainId.Bsc });
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
    <TabsContent value="zap-migration">
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
                  value={params.from.poolId}
                  onChange={(e) =>
                    setParams((p) => ({
                      ...p,
                      from: { ...p.from, poolId: e.target.value },
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
                value={params.from.dex.toString()}
                onValueChange={(value) =>
                  setParams((p) => ({
                    ...p,
                    from: { ...p.from, dex: value as any },
                  }))
                }
              >
                {Object.entries(Dex)
                  .filter((x) => isNaN(+x[0]))
                  .map(([key, value]) => {
                    return (
                      <div className="flex items-center space-x-2" key={key}>
                        <RadioGroupItem
                          value={value.toString() as string}
                          id={`from-${key}`}
                        />
                        <Label className="text-xs" htmlFor={`from-${key}`}>
                          {key in dexMapping
                            ? dexMapping[key as keyof typeof dexMapping]
                            : key}
                        </Label>
                      </div>
                    );
                  })}
              </RadioGroup>
            </div>
            <div className="space-y-1.5">
              <Label>Zap to</Label>
              <div className="space-y-1">
                <Label htmlFor="to-pool" className="text-xs text-[#ffffff66]">
                  Pool address
                </Label>
                <Input
                  id="to-pool"
                  placeholder="Pool address"
                  value={params.to.poolId}
                  onChange={(e) =>
                    setParams((p) => ({
                      ...p,
                      to: { ...p.to, poolId: e.target.value },
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
                value={params.to.dex.toString()}
                onValueChange={(value) =>
                  setParams((p) => ({
                    ...p,
                    to: { ...p.to, dex: value as any },
                  }))
                }
              >
                {Object.entries(Dex)
                  .filter((x) => isNaN(+x[0]))
                  .map(([key, value]) => {
                    return (
                      <div className="flex items-center space-x-2" key={key}>
                        <RadioGroupItem
                          value={value.toString() as string}
                          id={`to-${key}`}
                        />
                        <Label className="text-xs" htmlFor={`to-${key}`}>
                          {key in dexMapping
                            ? dexMapping[key as keyof typeof dexMapping]
                            : key}
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
              !params.from.poolId ||
              !params.to.poolId ||
              !params.from.positionId ||
              !params.chainId
            }
            onClick={() => setOpenWidget(true)}
          />

          {openWidget && (
            <Modal onClose={() => setOpenWidget(false)}>
              <ZapMigrationWidget {...widgetProps} />
            </Modal>
          )}
        </CardFooter>
      </Card>
    </TabsContent>
  );
};

export default ZapMigration;
