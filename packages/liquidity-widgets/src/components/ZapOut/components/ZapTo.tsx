import {
  ChainId,
  UniV2Position,
  UniV3Position,
  univ2PoolNormalize,
  univ3PoolNormalize,
} from "@/schema";
import questionImg from "@/assets/svg/question.svg?url";
import { useZapOutContext } from "@/stores/zapout";
import DropdownIcon from "@/assets/svg/dropdown.svg";
import { assertUnreachable } from "@/utils";
import { Skeleton } from "@kyber/ui/skeleton";
import { getPositionAmounts } from "@kyber/utils/uniswapv3";
import {
  formatDisplayNumber,
  formatTokenAmount,
  toRawString,
} from "@kyber/utils/number";
import CircleChevronRight from "@/assets/svg/circle-chevron-right.svg";
import { RefundAction, useZapOutUserState } from "@/stores/zapout/zapout-state";
import { useEffect, useState } from "react";
import TokenSelectorModal from "./TokenSelector/TokenSelectorModal";
import { NATIVE_TOKEN_ADDRESS, NetworkInfo } from "@/constants";

export function ZapTo({ chainId }: { chainId: ChainId }) {
  const { position, pool, poolType } = useZapOutContext((s) => s);

  const loading = position === "loading" || pool === "loading";
  const [showTokenSelect, setShowTokenSelect] = useState(false);

  const {
    liquidityOut,
    tokenOut,
    setTokenOut,
    route,
    setSlippage,
    manualSlippage,
  } = useZapOutUserState();

  const actionRefund = route?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_REFUND"
  ) as RefundAction | undefined;
  const amountOut = BigInt(actionRefund?.refund.tokens[0].amount || 0);

  useEffect(() => {
    if (pool === "loading" || !tokenOut || manualSlippage) return;

    if (pool.category === "stablePair" && tokenOut.isStable) {
      setSlippage(10);
    } else if (
      pool.category === "correlatedPair" &&
      [
        pool.token0.address.toLowerCase(),
        pool.token1.address.toLowerCase(),
      ].includes(
        tokenOut.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
          ? NetworkInfo[chainId].wrappedToken.address.toLowerCase()
          : tokenOut.address.toLowerCase()
      )
    ) {
      setSlippage(25);
    } else {
      setSlippage(50);
    }
  }, [tokenOut, manualSlippage, pool, chainId, setSlippage]);

  let amount0 = 0n;
  let amount1 = 0n;
  if (!loading) {
    const { success: isUniv3, data: univ3Pool } =
      univ3PoolNormalize.safeParse(pool);

    const { success: isUniv2, data: univ2Pool } =
      univ2PoolNormalize.safeParse(pool);

    if (isUniv3) {
      ({ amount0, amount1 } = getPositionAmounts(
        univ3Pool.tick,
        (position as UniV3Position).tickLower,
        (position as UniV3Position).tickUpper,
        BigInt(univ3Pool.sqrtPriceX96),
        liquidityOut
      ));
    } else if (isUniv2) {
      amount0 =
        (BigInt(liquidityOut) * BigInt(univ2Pool.reserves[0])) /
        (position as UniV2Position).totalSupply;
      amount1 =
        (BigInt(liquidityOut) * BigInt(univ2Pool.reserves[1])) /
        (position as UniV2Position).totalSupply;
    } else assertUnreachable(poolType as never, `${poolType} is not handled`);
  }

  useEffect(() => {
    if (!tokenOut && pool !== "loading" && (!!amount0 || !!amount1)) {
      const usdValue0 =
        (pool.token0.price || 0) *
        Number(toRawString(amount0, pool.token0.decimals));
      const usdValue1 =
        (pool.token1.price || 0) *
        Number(toRawString(amount1, pool.token1.decimals));
      setTokenOut(usdValue1 > usdValue0 ? pool.token1 : pool.token0);
    }
  }, [tokenOut, pool, setTokenOut, amount1, amount0]);

  return (
    <>
      {showTokenSelect && (
        <TokenSelectorModal
          onClose={() => setShowTokenSelect(false)}
          chainId={chainId}
        />
      )}
      <div className="rounded-lg border border-stroke px-4 py-3 text-subText text-sm">
        <div>Your Position Liquidity</div>

        <div className="flex justify-between mt-4 items-start">
          {loading ? (
            <>
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-14" />
            </>
          ) : (
            <>
              <div className="flex items-center text-base gap-1 text-text">
                <img
                  src={pool.token0.logo || ""}
                  alt=""
                  className="w-4 h-4"
                  onError={({ currentTarget }) => {
                    currentTarget.onerror = null; // prevents looping
                    currentTarget.src = questionImg;
                  }}
                />
                {pool.token0.symbol}
              </div>
              <div className="text-xs text-subText text-right">
                <div className="text-text text-base">
                  {formatTokenAmount(amount0, pool.token0.decimals, 8)}
                </div>
                {formatDisplayNumber(
                  (pool.token0.price || 0) *
                    Number(toRawString(amount0, pool.token0.decimals)),
                  { style: "currency" }
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-between mt-2 items-start">
          {loading ? (
            <>
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-14" />
            </>
          ) : (
            <>
              <div className="flex items-center text-base gap-1 text-text">
                <img
                  src={pool.token1.logo || ""}
                  alt=""
                  className="w-4 h-4"
                  onError={({ currentTarget }) => {
                    currentTarget.onerror = null; // prevents looping
                    currentTarget.src = questionImg;
                  }}
                />
                {pool.token1.symbol}
              </div>
              <div className="text-xs text-subText text-right">
                <div className="text-text text-base">
                  {formatTokenAmount(amount1, pool.token1.decimals, 8)}
                </div>
                {formatDisplayNumber(
                  (pool.token1.price || 0) *
                    Number(toRawString(amount1, pool.token1.decimals)),
                  { style: "currency" }
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <CircleChevronRight className="text-subText w-8 h-8 p-1 rotate-90 -mt-3 -mb-3 mx-auto" />

      <div className="rounded-lg border border-stroke px-4 py-3 text-subText text-sm">
        <div>Zap to </div>
        <div className="flex justify-between items-center mt-2">
          <button
            className="bg-layer2 border-none rounded-full outline-inherit cursor-pointer py-[6px] px-3 items-center text-text brightness-150 flex gap-1 hover:brightness-150 active:scale-95"
            onClick={() => {
              setShowTokenSelect(true);
            }}
          >
            <img
              src={tokenOut?.logo ? tokenOut.logo : questionImg}
              alt="TokenLogo"
              width="20px"
              className="rounded-full brightness-75"
              onError={({ currentTarget }) => {
                currentTarget.onerror = null;
                currentTarget.src = questionImg;
              }}
            />
            <span>{tokenOut?.symbol}</span>
            <DropdownIcon />
          </button>
          <div className="text-text text-xl font-medium">
            {formatTokenAmount(amountOut, tokenOut?.decimals || 18)}{" "}
          </div>
        </div>
      </div>
    </>
  );
}
