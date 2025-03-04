import { usePoolsStore } from "../stores/usePoolsStore";
import { Image } from "./Image";
import { LiquiditySkeleton } from "./FromPool";
import { useZapStateStore } from "../stores/useZapStateStore";
import { getPositionAmounts } from "@kyber/utils/uniswapv3";
import {
  formatDisplayNumber,
  formatTokenAmount,
  toRawString,
} from "@kyber/utils/number";
import { Skeleton } from "@kyber/ui/skeleton";
import { cn } from "@kyber/utils/tailwind-helpers";

export function ToPool({ className }: { className?: string }) {
  const { pools } = usePoolsStore();
  const { fetchingRoute, tickUpper, tickLower, route } = useZapStateStore();

  let amount0 = 0n;
  let amount1 = 0n;
  const newDetail =
    route?.poolDetails.uniswapV3 || route?.poolDetails.algebraV1;
  if (route !== null && tickLower !== null && tickUpper !== null && newDetail) {
    ({ amount0, amount1 } = getPositionAmounts(
      newDetail.newTick,
      tickLower,
      tickUpper,
      BigInt(newDetail.newSqrtP),
      BigInt(route.positionDetails.addedLiquidity)
    ));
  }

  return (
    <div
      className={cn(
        "flex-1 border border-stroke rounded-md px-4 py-3",
        className
      )}
    >
      <div className="text-subText text-sm">Your New Position Liquidity</div>
      <div className="mt-2 flex items-start justify-between">
        {pools === "loading" ? (
          <LiquiditySkeleton />
        ) : (
          <>
            <div className="flex gap-1 items-center">
              <Image
                src={pools[1].token0.logo || ""}
                alt={pools[1].token0.symbol}
                className="w-4 h-4"
              />
              <span className="text-base">{pools[1].token0.symbol}</span>
            </div>

            {fetchingRoute ? (
              <div className="flex flex-col items-end h-[40px]">
                <Skeleton className="w-20 h-4" />
                <Skeleton className="w-10 h-3 mt-1" />
              </div>
            ) : (
              <div className="text-base flex flex-col items-end">
                {formatTokenAmount(amount0, pools[1].token0.decimals, 10)}{" "}
                <div className="text-subText text-xs">
                  ~
                  {formatDisplayNumber(
                    (pools[1].token0.price || 0) *
                      Number(toRawString(amount0, pools[1].token0.decimals)),
                    { style: "currency" }
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-2 flex items-start justify-between">
        {pools === "loading" ? (
          <LiquiditySkeleton />
        ) : (
          <>
            <div className="flex gap-1 items-center">
              <Image
                src={pools[1].token1.logo || ""}
                alt={pools[1].token1.symbol}
                className="w-4 h-4"
              />
              <span className="text-base">{pools[1].token1.symbol}</span>
            </div>

            {fetchingRoute ? (
              <div className="flex flex-col items-end h-[40px]">
                <Skeleton className="w-20 h-4" />
                <Skeleton className="w-10 h-3 mt-1" />
              </div>
            ) : (
              <div className="text-base flex flex-col items-end">
                {formatTokenAmount(amount1, pools[1].token1.decimals, 10)}{" "}
                <div className="text-subText text-xs">
                  ~
                  {formatDisplayNumber(
                    (pools[1].token1.price || 0) *
                      Number(toRawString(amount1, pools[1].token1.decimals)),
                    { style: "currency" }
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
