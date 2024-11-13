import { useEffect } from "react";
import { usePositionStore } from "../stores/useFromPositionStore";
import { usePoolsStore } from "../stores/usePoolsStore";
import { useZapStateStore } from "../stores/useZapStateStore";
import { ChainId } from "../schema";
import { Skeleton } from "@kyber/ui/skeleton";
import { Image } from "./Image";
import {
  formatDisplayNumber,
  formatTokenAmount,
  toRawString,
} from "@kyber/utils/number";
import { getPositionAmounts } from "@kyber/utils/uniswapv3";
import { cn } from "@kyber/utils/tailwind-helpers";

export function EstimateLiqValue({
  chainId,
  onSwitchChain,
  onConnectWallet,
  connectedAccount,
}: {
  chainId: ChainId;
  connectedAccount: {
    address: string | undefined; // check if account is connected
    chainId: number; // check if wrong network
  };
  onConnectWallet: () => void;
  onSwitchChain: () => void;
}) {
  const { pools } = usePoolsStore();
  const { position } = usePositionStore();
  const {
    fetchZapRoute,
    tickUpper,
    tickLower,
    liquidityOut,
    route,
    fetchingRoute,
    slippage,
    togglePreview,
    showPreview,
  } = useZapStateStore();

  useEffect(() => {
    if (showPreview) return;
    fetchZapRoute(chainId);
  }, [
    pools,
    position,
    fetchZapRoute,
    tickUpper,
    tickLower,
    liquidityOut,
    showPreview,
  ]);

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

  let btnText = "";
  if (fetchingRoute) btnText = "Fetching Route...";
  else if (liquidityOut === 0n) btnText = "Select Liquidity to Remove";
  else if (tickLower === null || tickUpper === null)
    btnText = "Select Price Range";
  else if (route === null) btnText = "No Route Found";
  else if (!connectedAccount.address) btnText = "Connect Wallet";
  else if (connectedAccount.chainId !== chainId) btnText = "Switch Network";
  else btnText = "Preview";

  const disableBtn =
    fetchingRoute ||
    route === null ||
    liquidityOut === 0n ||
    tickLower === null ||
    tickUpper === null;

  return (
    <>
      <div className="border border-stroke rounded-md px-4 py-3 text-sm mt-4">
        <div className="flex justify-between items-center border-b border-stroke pb-2">
          <div>Est. Liquidity Value</div>
          {fetchingRoute ? (
            <Skeleton className="w-[60px] h-3" />
          ) : (
            <div>
              {formatDisplayNumber(route?.zapDetails.finalAmountUsd || 0, {
                style: "currency",
              })}
            </div>
          )}
        </div>

        <div className="py-4 flex gap-6">
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div className="text-subText text-xs border-b border-dotted border-subText flex items-center gap-2">
                Est. Pooled{" "}
                {pools === "loading" ? (
                  <Skeleton className="w-8 h-2.5" />
                ) : (
                  pools[1].token0.symbol
                )}
              </div>
              <div className="flex flex-col items-end">
                {pools === "loading" ? (
                  <>
                    <Skeleton className="w-20 h-4" />
                    <Skeleton className="w-10 h-3 mt-1" />
                  </>
                ) : fetchingRoute ? (
                  <div className="flex flex-col items-end h-[32px]">
                    <Skeleton className="w-20 h-4" />
                    <Skeleton className="w-10 h-3 mt-1" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1 text-xs">
                      <Image
                        className="w-4 h-4"
                        src={pools[1].token0.logo || ""}
                        alt=""
                      />
                      {formatTokenAmount(amount0, pools[1].token0.decimals, 10)}{" "}
                      {pools[1].token0.symbol}
                    </div>
                    <div className="text-subText text-xs">
                      ~
                      {formatDisplayNumber(
                        (pools[1].token0.price || 0) *
                          Number(
                            toRawString(amount0, pools[1].token0.decimals)
                          ),
                        { style: "currency" }
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-between items-start mt-2">
              <div className="text-subText text-xs border-b border-dotted border-subText flex items-center gap-2">
                Est. Pooled{" "}
                {pools === "loading" ? (
                  <Skeleton className="w-8 h-2.5" />
                ) : (
                  pools[1].token1.symbol
                )}
              </div>
              <div className="flex flex-col items-end">
                {pools === "loading" ? (
                  <>
                    <Skeleton className="w-20 h-4" />
                    <Skeleton className="w-10 h-3 mt-1" />
                  </>
                ) : fetchingRoute ? (
                  <div className="flex flex-col items-end h-[32px]">
                    <Skeleton className="w-20 h-4" />
                    <Skeleton className="w-10 h-3 mt-1" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1 text-xs">
                      <Image
                        className="w-4 h-4"
                        src={pools[1].token1.logo || ""}
                        alt=""
                      />
                      {formatTokenAmount(amount1, pools[1].token1.decimals, 10)}{" "}
                      {pools[1].token1.symbol}
                    </div>
                    <div className="text-subText text-xs">
                      ~
                      {formatDisplayNumber(
                        (pools[1].token1.price || 0) *
                          Number(
                            toRawString(amount1, pools[1].token1.decimals)
                          ),
                        { style: "currency" }
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="h-auto w-[1px] bg-stroke" />
          <div className="flex-1 text-xs">
            <div className="flex justify-between items-start">
              <span className="text-subText border-b border-dotted border-subText">
                Swap Impact
              </span>
              <span>TODO%</span>
            </div>
            <div className="flex justify-between items-start mt-2">
              <span className="text-subText border-b border-dotted border-subText">
                Swap Max Slippage
              </span>
              <span>{(slippage / 10_000) * 100}%</span>
            </div>

            <div className="flex justify-between items-start mt-2">
              <span className="text-subText border-b border-dotted border-subText">
                Zap Impact
              </span>
              <span>
                {formatDisplayNumber(route?.zapDetails.priceImpact, {
                  style: "percent",
                  fallback: "--",
                  fractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-5 mt-8">
        <button className="flex-1 h-[40px] rounded-full border border-stroke text-subText text-sm font-medium">
          Cancel
        </button>
        <button
          className={cn(
            "flex-1 h-[40px] rounded-full border border-primary bg-primary text-textRevert text-sm font-medium",
            "disabled:bg-stroke disabled:text-subText disabled:border-stroke disabled:cursor-not-allowed"
          )}
          disabled={disableBtn}
          onClick={() => {
            if (!connectedAccount.address) onConnectWallet();
            else if (connectedAccount.chainId !== chainId) onSwitchChain();
            else togglePreview();
          }}
        >
          {btnText}
        </button>
      </div>
    </>
  );
}
