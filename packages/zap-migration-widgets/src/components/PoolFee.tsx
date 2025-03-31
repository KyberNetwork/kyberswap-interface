import { Skeleton } from "@kyber/ui/skeleton";
import {
  formatDisplayNumber,
  formatTokenAmount,
  toRawString,
} from "@kyber/utils/number";
import { useRef } from "react";
import {
  RemoveLiquidityAction,
  useZapStateStore,
} from "../stores/useZapStateStore";
import { usePoolsStore } from "../stores/usePoolsStore";
import { univ3Dexes } from "../schema";

export const PoolFee = () => {
  const { route } = useZapStateStore();
  const { pools } = usePoolsStore((s) => s);

  const pool = pools === "loading" ? "loading" : pools[0];
  const isUniv3 = pools !== "loading" && univ3Dexes.includes(pools[0].dex);

  const actionRemoveLiq = route?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_REMOVE_LIQUIDITY"
  ) as RemoveLiquidityAction | undefined;

  const { fees } = actionRemoveLiq?.removeLiquidity || {};

  const fee0 =
    pool !== "loading" &&
    fees?.find(
      (f) => f.address.toLowerCase() === pool.token0.address.toLowerCase()
    );
  const fee1 =
    pool !== "loading" &&
    fees?.find(
      (f) => f.address.toLowerCase() === pool.token1.address.toLowerCase()
    );

  const feeAmount0 = BigInt(fee0 ? fee0.amount : 0);
  const feeAmount1 = BigInt(fee1 ? fee1.amount : 0);

  const feeAmount0Ref = useRef(feeAmount0);
  if (route) feeAmount0Ref.current = feeAmount0;

  const feeAmount1Ref = useRef(feeAmount1);
  if (route) feeAmount1Ref.current = feeAmount1;

  if (!isUniv3) return null;

  return (
    <div className="rounded-lg px-4 py-3 border border-stroke text-sm text-subText">
      <div>Pool fee</div>

      <div className="flex justify-between mt-2 items-center">
        {pool === "loading" ? (
          <>
            <Skeleton className="h-5 w-20 mt-2" />
            <Skeleton className="h-4 w-14" />
          </>
        ) : (
          <>
            <div className="flex items-center text-base gap-1 text-text">
              <img src={pool.token0.logo || ""} alt="" className="w-4 h-4" />
              {formatTokenAmount(
                feeAmount0Ref.current,
                pool.token0.decimals,
                8
              )}{" "}
              {pool.token0.symbol}
            </div>
            <div className="text-xs text-subText">
              {formatDisplayNumber(
                (pool.token0.price || 0) *
                  Number(
                    toRawString(feeAmount0Ref.current, pool.token0.decimals)
                  ),
                { style: "currency" }
              )}
            </div>
          </>
        )}
      </div>
      <div className="flex justify-between mt-2 items-center">
        {pool === "loading" ? (
          <>
            <Skeleton className="h-5 w-20 mt-2" />
            <Skeleton className="h-4 w-14" />
          </>
        ) : (
          <>
            <div className="flex items-center text-base gap-1 text-text">
              <img src={pool.token1.logo || ""} alt="" className="w-4 h-4" />
              {formatTokenAmount(
                feeAmount1Ref.current,
                pool.token1.decimals,
                8
              )}{" "}
              {pool.token1.symbol}
            </div>
            <div className="text-xs text-subText">
              {formatDisplayNumber(
                (pool.token1.price || 0) *
                  Number(
                    toRawString(feeAmount1Ref.current, pool.token1.decimals)
                  ),
                { style: "currency" }
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
