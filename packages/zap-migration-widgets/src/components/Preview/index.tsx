import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@kyber/ui/dialog";
import { useTokenPrices } from "@kyber/hooks/use-token-prices";
import { useZapStateStore } from "../../stores/useZapStateStore";
import {
  formatDisplayNumber,
  formatTokenAmount,
  toRawString,
} from "@kyber/utils/number";
import { usePoolsStore } from "../../stores/usePoolsStore";
import CopyIcon from "../../assets/icons/copy.svg";
import AlertIcon from "../../assets/icons/circle-alert.svg";
import LoadingIcon from "../../assets/icons/loader-circle.svg";
import CheckIcon from "../../assets/icons/circle-check.svg";
import { Image } from "../Image";
import { ZAP_URL, DexInfos, NetworkInfo } from "../../constants";
import { ChainId } from "../../schema";
import { getPositionAmounts } from "@kyber/utils/uniswapv3";
import { cn } from "@kyber/utils/tailwind-helpers";
import { useEffect, useState } from "react";
import {
  estimateGas,
  getCurrentGasPrice,
  isTransactionSuccessful,
} from "@kyber/utils/crypto";
import { MigrationSummary } from "./MigrationSummary";

export function Preview({
  chainId,
  onSubmitTx,
  account,
  client,
  onClose,
}: {
  client: string;
  chainId: ChainId;
  onSubmitTx: (txData: {
    from: string;
    to: string;
    value: string;
    data: string;
  }) => Promise<string>;
  account: string | undefined;
  onClose: () => void;
}) {
  const { showPreview, togglePreview, tickLower, tickUpper, route, slippage } =
    useZapStateStore();
  const { pools } = usePoolsStore();

  const [buildData, setBuildData] = useState<{
    callData: string;
    routerAddress: string;
    value: string;
  } | null>(null);
  const [error, setError] = useState<string>("");

  const { fetchPrices } = useTokenPrices({ addresses: [], chainId });

  useEffect(() => {
    if (!route?.route || !showPreview) return;
    fetch(
      `${ZAP_URL}/${NetworkInfo[chainId].zapPath}/api/v1/migrate/route/build`,
      {
        method: "POST",
        body: JSON.stringify({
          sender: account,
          route: route.route,
          burnNft: false,
          source: client,
        }),
        headers: {
          "x-client-id": client,
        },
      }
    )
      .then((res) => res.json())
      .then((res) => {
        if (res.data) setBuildData(res.data);
        else setError(res.message || "build failed");
      })
      .catch((err) => {
        setError(err.message || JSON.stringify(err));
      });
  }, [route?.route, showPreview]);

  const rpcUrl = NetworkInfo[chainId].defaultRpc;

  const [gasUsd, setGasUsd] = useState<number | null>(null);
  useEffect(() => {
    if (!buildData) return;
    (async () => {
      const wethAddress =
        NetworkInfo[chainId].wrappedToken.address.toLowerCase();
      const [gasEstimation, gasPrice, nativeTokenPrice] = await Promise.all([
        estimateGas(rpcUrl, {
          from: "0xDcFCD5dD752492b95ac8C1964C83F992e7e39FA9",
          to: buildData.routerAddress,
          value: "0x0", // alway use WETH when remove this this is alway 0
          data: buildData.callData,
        }).catch(() => {
          return "0";
        }),
        getCurrentGasPrice(rpcUrl).catch(() => 0),
        fetchPrices([wethAddress])
          .then((prices) => {
            return prices[wethAddress]?.PriceBuy || 0;
          })
          .catch(() => 0),
      ]);
      const gasUsd =
        (parseInt(gasEstimation, 16) / 10 ** 18) * gasPrice * nativeTokenPrice;

      setGasUsd(gasUsd);
    })();
  }, [buildData]);

  const [showProcessing, setShowProcessing] = useState(false);
  const [submiting, setSubmiting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<"success" | "failed" | "">("");

  useEffect(() => {
    if (!txHash) return;
    const i = setInterval(
      async () => {
        const isSuccess = await isTransactionSuccessful(rpcUrl, txHash);
        setTxStatus(isSuccess ? "success" : "failed");
      },
      chainId === ChainId.Ethereum ? 10_000 : 5_000
    );
    return () => clearInterval(i);
  }, [txHash, chainId]);

  if (route === null || pools === "loading" || !account) return null;
  let amount0 = 0n;
  let amount1 = 0n;
  if (route !== null && tickLower !== null && tickUpper !== null) {
    ({ amount0, amount1 } = getPositionAmounts(
      route.poolDetails.uniswapV3.newTick,
      tickLower,
      tickUpper,
      BigInt(route.poolDetails.uniswapV3.newSqrtP),
      BigInt(route.positionDetails.addedLiquidity)
    ));
  }

  if (showProcessing) {
    let content = <></>;
    if (txHash) {
      content = (
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center gap-2 text-xl font-medium my-8">
            {txStatus === "success" ? (
              <CheckIcon className="w-6 h-6 text-success" />
            ) : txStatus === "failed" ? (
              <AlertIcon className="w-6 h-6 text-error" />
            ) : (
              <LoadingIcon className="w-6 h-6 text-primary animate-spin" />
            )}
            {txStatus === "success"
              ? "Migrate Success!"
              : txStatus === "failed"
              ? "Transaction Failed!"
              : "Processing Transaction"}
          </div>

          <div className="text-subText">
            {txStatus === "success"
              ? "You have successfully added liquidity!"
              : txStatus === "failed"
              ? "An error occurred during the liquidity migration."
              : "Transaction submitted. Waiting for the transaction to be mined"}
          </div>
          <a
            className="text-primary text-xs mt-4"
            href={`${NetworkInfo[chainId].scanLink}/tx/${txHash}`}
            target="_blank"
            rel="noreferrer noopener"
          >
            View transaction ↗
          </a>
        </div>
      );
    } else if (submiting) {
      content = (
        <div className="flex items-center justify-center gap-2 text-xl font-medium my-8">
          <LoadingIcon className="w-6 h-6 text-primary animate-spin" />
          Submitting transaction
        </div>
      );
    } else if (error) {
      content = (
        <>
          <div className="flex items-center justify-center gap-2 text-xl font-medium mt-8">
            <AlertIcon className="w-6 h-6 text-error" />
            Failed to migrate
          </div>
          <div className="text-subText mt-6 break-all	text-center max-h-[200px] overflow-y-scroll">
            {error}
          </div>
        </>
      );
    }
    return (
      <Dialog
        open={showProcessing}
        onOpenChange={() => {
          if (txStatus === "success") {
            onClose();
          }
          togglePreview();
          setShowProcessing(false);
          setError("");
          setSubmiting(false);
        }}
      >
        <DialogContent>
          <DialogDescription>{content}</DialogDescription>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={showPreview} onOpenChange={() => togglePreview()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Migrate Liquidity via Zap</DialogTitle>
        </DialogHeader>

        <DialogDescription>
          <div>
            Migrate{" "}
            {formatDisplayNumber(route.zapDetails.initialAmountUsd, {
              style: "currency",
            })}{" "}
            value
          </div>
          <div className="border border-stroke rounded-md p-4 mt-4 flex gap-2 items-start">
            <div className="flex items-end">
              <Image
                src={pools[0].token0.logo || ""}
                alt={pools[0].token0.symbol}
                className="w-9 h-9 z-0"
              />
              <Image
                src={pools[0].token1.logo || ""}
                alt={pools[0].token1.symbol}
                className="w-9 h-9 -ml-3 z-10"
              />
              <Image
                src={NetworkInfo[chainId].logo}
                alt={NetworkInfo[chainId].name}
                className="w-4 h-4 -ml-1.5 z-20"
              />
            </div>
            <div>
              <div className="flex gap-1 items-center">
                {pools[0].token0.symbol}/{pools[0].token1.symbol}{" "}
                <CopyIcon className="text-subText w-4 h-4" />
              </div>
              <div className="flex gap-1 items-center text-subText mt-1">
                <Image
                  src={DexInfos[pools[0].dex].icon}
                  alt={DexInfos[pools[0].dex].name}
                  className="w-3 h-3"
                />
                <div className="text-sm opacity-70">
                  {DexInfos[pools[0].dex].name}
                </div>
                <div className="rounded-xl bg-layer2 px-2 py-1 text-xs">
                  Fee {pools[0].fee}%
                </div>
              </div>
            </div>
          </div>

          <div className="border border-stroke rounded-md p-4 mt-4 flex gap-2 items-start">
            <div className="flex items-end">
              <Image
                src={pools[1].token0.logo || ""}
                alt={pools[1].token0.symbol}
                className="w-9 h-9 z-0"
              />
              <Image
                src={pools[1].token1.logo || ""}
                alt={pools[1].token1.symbol}
                className="w-9 h-9 -ml-3 z-10"
              />
              <Image
                src={NetworkInfo[chainId].logo}
                alt={NetworkInfo[chainId].name}
                className="w-4 h-4 -ml-1.5 z-20"
              />
            </div>
            <div>
              <div className="flex gap-1 items-center">
                {pools[1].token0.symbol}/{pools[1].token1.symbol}{" "}
                <CopyIcon className="text-subText w-4 h-4" />
              </div>
              <div className="flex gap-1 items-center text-subText mt-1">
                <Image
                  src={DexInfos[pools[1].dex].icon}
                  alt={DexInfos[pools[1].dex].name}
                  className="w-3 h-3"
                />
                <div className="text-sm opacity-70">
                  {DexInfos[pools[1].dex].name}
                </div>
                <div className="rounded-xl bg-layer2 px-2 py-1 text-xs">
                  Fee {pools[1].fee}%
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-md px-5 py-4 bg-interactive">
            <span className="text-subText text-sm">New Pool Liquidity</span>
            <div className="flex justify-between items-start text-base mt-2">
              <div className="flex items-center gap-1">
                <Image
                  className="w-4 h-4"
                  src={pools[1].token0.logo || ""}
                  alt=""
                />
                {formatTokenAmount(amount0, pools[1].token0.decimals, 10)}{" "}
                {pools[1].token0.symbol}
              </div>
              <div className="text-subText">
                ~
                {formatDisplayNumber(
                  (pools[1].token0.price || 0) *
                    Number(toRawString(amount0, pools[1].token0.decimals)),
                  { style: "currency" }
                )}
              </div>
            </div>

            <div className="flex justify-between items-start text-base mt-2">
              <div className="flex items-center gap-1">
                <Image
                  className="w-4 h-4"
                  src={pools[1].token1.logo || ""}
                  alt=""
                />
                {formatTokenAmount(amount1, pools[1].token1.decimals, 10)}{" "}
                {pools[1].token1.symbol}
              </div>
              <div className="text-subText">
                ~
                {formatDisplayNumber(
                  (pools[1].token1.price || 0) *
                    Number(toRawString(amount1, pools[1].token1.decimals)),
                  { style: "currency" }
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-subText text-xs border-b border-dotted border-subText">
              Remaining Amount
            </div>
            <div>TODO</div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-subText text-xs border-b border-dotted border-subText">
              Max Slippage
            </div>
            <div className="text-sm">
              {formatDisplayNumber((slippage * 100) / 10_000, {
                style: "percent",
              })}
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-subText text-xs border-b border-dotted border-subText">
              Swap Price Impact
            </div>
            <div>TODO</div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-subText text-xs border-b border-dotted border-subText">
              Est. Gas Fee
            </div>
            <div className="text-sm">
              {gasUsd
                ? formatDisplayNumber(gasUsd, { style: "currency" })
                : "--"}
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-subText text-xs border-b border-dotted border-subText">
              Migration Fee
            </div>
            <div>TODO</div>
          </div>

          <div className="flex gap-5 mt-8">
            <button
              className="flex-1 h-[40px] rounded-full border border-stroke text-subText text-sm font-medium"
              onClick={() => togglePreview()}
            >
              Cancel
            </button>
            <button
              className={cn(
                "flex-1 h-[40px] rounded-full border border-primary bg-primary text-textRevert text-sm font-medium",
                "disabled:bg-stroke disabled:text-subText disabled:border-stroke disabled:cursor-not-allowed"
              )}
              onClick={async () => {
                if (!buildData) {
                  setShowProcessing(true);
                  return;
                }

                const txData = {
                  from: account,
                  to: buildData.routerAddress,
                  value: "0x0", // alway use WETH when remove this this is alway 0
                  data: buildData.callData,
                };

                setShowProcessing(true);
                setSubmiting(true);
                const gas = await estimateGas(rpcUrl, txData).catch((err) => {
                  console.log(err.message);
                  setSubmiting(false);
                  setError(`Estimate Gas Failed: ${err.message}`);
                  return "0";
                });

                if (gas === "0") return;

                try {
                  const txHash = await onSubmitTx(txData);
                  setTxHash(txHash);
                } catch (err) {
                  setSubmiting(false);
                  setError(`Submit Tx Failed: ${JSON.stringify(err)}`);
                }
              }}
            >
              Migrate
            </button>
          </div>

          <MigrationSummary route={route} />
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
