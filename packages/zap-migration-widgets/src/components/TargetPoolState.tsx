import { Skeleton } from "@kyber/ui/skeleton";
import { usePoolsStore } from "../stores/usePoolsStore";
import {
  MAX_TICK,
  MIN_TICK,
  nearestUsableTick,
  priceToClosestTick,
  tickToPrice,
} from "@kyber/utils/uniswapv3";
import SwapIcon from "../assets/icons/swap.svg";
import { useEffect, useMemo, useState } from "react";
import { formatDisplayNumber } from "@kyber/utils/number";
import { cn } from "@kyber/utils/tailwind-helpers";
import { useZapStateStore } from "../stores/useZapStateStore";
import { usePositionStore } from "../stores/usePositionStore";

const DEFAULT_PRICE_RANGE = {
  LOW_POOL_FEE: 1,
  MEDIUM_POOL_FEE: 10,
  HIGH_POOL_FEE: 50,
};

const PRICE_RANGE = {
  LOW_POOL_FEE: [100, 1, 0.5, 0.1],
  MEDIUM_POOL_FEE: [100, 20, 10, 5],
  HIGH_POOL_FEE: [100, 50, 20, 10],
};

export function TargetPoolState({
  initialTick,
}: {
  initialTick?: { tickLower: number; tickUpper: number };
}) {
  const { pools } = usePoolsStore();
  const { tickLower, tickUpper, setTickLower, setTickUpper } =
    useZapStateStore();

  const { toPosition } = usePositionStore();

  useEffect(() => {
    if (toPosition !== "loading" && toPosition !== null) {
      setTickLower(toPosition.tickLower);
      setTickUpper(toPosition.tickUpper);
    }
  }, [toPosition]);

  const pool = pools === "loading" ? "loading" : pools[1];
  const [revertDisplay, setRevertDisplay] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const isMinTick =
    pool !== "loading" &&
    tickLower === nearestUsableTick(MIN_TICK, pool.tickSpacing);
  const isMaxTick =
    pool !== "loading" &&
    tickUpper === nearestUsableTick(MAX_TICK, pool.tickSpacing);

  useEffect(() => {
    if (pool !== "loading" && tickUpper)
      setMaxPrice(
        isMaxTick
          ? revertDisplay
            ? "0"
            : "∞"
          : formatDisplayNumber(
              +tickToPrice(
                tickUpper,
                pool.token0.decimals,
                pool.token1.decimals,
                revertDisplay
              ),
              { significantDigits: 8 }
            )
      );
  }, [tickUpper, pool, revertDisplay, isMaxTick]);

  const [selectedRange, setSelectedRange] = useState(0);

  useEffect(() => {
    if (pool !== "loading" && tickLower)
      setMinPrice(
        isMinTick
          ? revertDisplay
            ? "∞"
            : "0"
          : formatDisplayNumber(
              +tickToPrice(
                tickLower,
                pool.token0.decimals,
                pool.token1.decimals,
                revertDisplay
              ),
              { significantDigits: 8 }
            )
      );
  }, [tickLower, pool, revertDisplay, isMinTick]);

  const priceLabel =
    pool === "loading" ? (
      <Skeleton className="h-5 w-24" />
    ) : (
      <>
        {revertDisplay ? pool.token0.symbol : pool.token1.symbol} per{" "}
        {revertDisplay ? pool.token1.symbol : pool.token0.symbol}
      </>
    );

  const poolTick =
    pool === "loading"
      ? undefined
      : pool.tick % pool.tickSpacing === 0
      ? pool.tick
      : nearestUsableTick(pool.tick, pool.tickSpacing);

  const increaseTickLower = () => {
    if (pool === "loading" || poolTick === undefined) return;
    const newTick =
      tickLower !== null
        ? tickLower + pool.tickSpacing
        : poolTick + pool.tickSpacing;
    if (newTick <= MAX_TICK) setTickLower(newTick);
  };

  const increaseTickUpper = () => {
    if (pool === "loading" || poolTick === undefined) return;
    const newTick =
      tickUpper !== null
        ? tickUpper + pool.tickSpacing
        : poolTick + pool.tickSpacing;
    if (newTick <= MAX_TICK) setTickUpper(newTick);
  };

  const decreaseTickLower = () => {
    if (pool === "loading" || poolTick === undefined) return;
    const newTick =
      (tickLower !== null ? tickLower : pool.tick) - pool.tickSpacing;

    if (newTick >= MIN_TICK) setTickLower(newTick);
  };
  const decreaseTickUpper = () => {
    if (pool === "loading" || poolTick === undefined) return;
    const newTick =
      (tickUpper !== null ? tickUpper : poolTick) - pool.tickSpacing;

    if (newTick >= MIN_TICK) setTickUpper(newTick);
  };

  const fee = pool === "loading" ? 0 : pool.fee;

  const priceRanges = useMemo(
    () =>
      !fee
        ? []
        : fee <= 0.01
        ? PRICE_RANGE.LOW_POOL_FEE
        : fee > 0.1
        ? PRICE_RANGE.HIGH_POOL_FEE
        : PRICE_RANGE.MEDIUM_POOL_FEE,
    [fee]
  );

  useEffect(() => {
    if (!fee) return;
    if (
      pool !== "loading" &&
      tickLower === null &&
      tickUpper === null &&
      toPosition === null &&
      !initialTick
    ) {
      handleSelectRange(
        fee <= 0.01
          ? DEFAULT_PRICE_RANGE.LOW_POOL_FEE
          : fee > 0.1
          ? DEFAULT_PRICE_RANGE.HIGH_POOL_FEE
          : DEFAULT_PRICE_RANGE.MEDIUM_POOL_FEE
      );
    }
  }, [pool, tickLower, tickUpper, toPosition]);

  useEffect(() => {
    if (pools === "loading" || !initialTick) return;
    if (
      initialTick.tickLower % pools[1].tickSpacing === 0 &&
      initialTick.tickUpper % pools[1].tickSpacing === 0
    ) {
      setTickLower(initialTick.tickLower);
      setTickUpper(initialTick.tickUpper);
    }
  }, [initialTick?.tickLower, initialTick?.tickUpper, pools]);

  const handleSelectRange = (percent: number) => {
    if (pool === "loading") return;

    setSelectedRange(percent);
    if (percent === 100) {
      setTickUpper(nearestUsableTick(MAX_TICK, pool.tickSpacing));
      setTickLower(nearestUsableTick(MIN_TICK, pool.tickSpacing));
      return;
    }

    const currentPrice = tickToPrice(
      pool.tick,
      pool.token0.decimals,
      pool.token1.decimals,
      false
    );
    if (!currentPrice) return;

    const lower = priceToClosestTick(
      (+currentPrice * (1 - percent / 100)).toString(),
      pool.token0.decimals,
      pool.token1.decimals,
      false
    );
    const upper = priceToClosestTick(
      (+currentPrice * (1 + percent / 100)).toString(),
      pool.token0.decimals,
      pool.token1.decimals,
      false
    );

    if (lower) setTickLower(nearestUsableTick(lower, pool.tickSpacing));
    if (upper) setTickUpper(nearestUsableTick(upper, pool.tickSpacing));
  };

  return (
    <div className="flex-1">
      <div className="border border-stroke rounded-md px-4 py-3 text-subText text-sm flex items-center gap-1 flex-wrap">
        Pool Price{" "}
        {pool === "loading" ? (
          <Skeleton className="w-[200px] h-3.5" />
        ) : (
          <>
            <div className="text-text">
              {formatDisplayNumber(
                tickToPrice(
                  pool.tick,
                  pool.token0.decimals,
                  pool.token1.decimals,
                  revertDisplay
                ),
                { significantDigits: 6 }
              )}
            </div>
            <div>{priceLabel}</div>

            <SwapIcon
              role="button"
              onClick={() => setRevertDisplay(!revertDisplay)}
            />
          </>
        )}
      </div>

      {toPosition !== "loading" && toPosition !== null ? (
        <div className="flex-1 border border-stroke rounded-md px-4 py-3 mt-4">
          <div className="text-subText text-sm">Your Position Price Range</div>
          <div className="flex items-center gap-4 mt-3 text-sm">
            <div className="bg-white bg-opacity-[0.04] rounded-md py-3 w-1/2 flex flex-col items-center justify-center gap-1">
              <p className="text-subText">Min Price</p>
              <p className="text-base font-medium">{minPrice}</p>
              <p className="text-subText">
                {pool === "loading"
                  ? ""
                  : revertDisplay
                  ? `${pool?.token0.symbol}/${pool?.token1.symbol}`
                  : `${pool?.token1.symbol}/${pool?.token0.symbol}`}
              </p>
            </div>
            <div className="bg-white bg-opacity-[0.04] rounded-md py-3 w-1/2 flex flex-col items-center justify-center gap-1">
              <p className="text-subText">Max Price</p>
              <p className="text-base font-medium">{maxPrice}</p>
              <p className="text-subText">
                {pool === "loading"
                  ? ""
                  : revertDisplay
                  ? `${pool?.token0.symbol}/${pool?.token1.symbol}`
                  : `${pool?.token1.symbol}/${pool?.token0.symbol}`}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 justify-between text-subText text-sm mt-4">
            {priceRanges.map((percent) => {
              return (
                <button
                  key={percent}
                  className={cn(
                    "border rounded-full border-stroke px-3 py-1 flex items-center justify-center",
                    percent === 100 ? "w-max-content" : "flex-1",
                    selectedRange === percent
                      ? "border-primary text-primary"
                      : ""
                  )}
                  onClick={() => handleSelectRange(percent)}
                >
                  {percent === 100 ? "Full Range" : `${percent}%`}
                </button>
              );
            })}
          </div>

          <div className="border border-stroke rounded-md px-4 py-3 text-subText text-sm mt-4">
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-2 flex-1">
                <div>Min Price</div>
                <input
                  className="bg-transparent text-text text-[18px] font-medium border-none outline-none w-full"
                  inputMode="decimal"
                  autoComplete="off"
                  autoCorrect="off"
                  type="text"
                  pattern="^[0-9]*[.]?[0-9]*$"
                  placeholder="0.0"
                  minLength={1}
                  maxLength={79}
                  value={revertDisplay ? maxPrice : minPrice}
                  onChange={(e) => {
                    const value = e.target.value.replace(/,/g, "");
                    const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`); // match escaped "." characters via in a non-capturing group
                    if (
                      value === "" ||
                      inputRegex.test(
                        value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
                      )
                    ) {
                      setSelectedRange(0);
                      revertDisplay ? setMaxPrice(value) : setMinPrice(value);
                    }
                  }}
                  onBlur={(e) => {
                    if (pool === "loading") return;
                    const tick = priceToClosestTick(
                      e.target.value,
                      pool.token0.decimals,
                      pool.token1.decimals,
                      revertDisplay
                    );
                    if (tick !== undefined) {
                      const t =
                        tick % pool.tickSpacing === 0
                          ? tick
                          : nearestUsableTick(tick, pool.tickSpacing);
                      revertDisplay ? setTickUpper(t) : setTickLower(t);
                    }
                  }}
                />
                <div>{priceLabel}</div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  className="border border-stroke w-6 h-6 rounded-[6px] text-[20px] flex items-center justify-center disabled:cursor-not-allowed"
                  onClick={() => {
                    setSelectedRange(0);
                    revertDisplay ? decreaseTickUpper() : increaseTickLower();
                  }}
                  disabled={revertDisplay ? isMaxTick : isMinTick}
                >
                  +
                </button>
                <button
                  className="border border-stroke w-6 h-6 rounded-[6px] text-[20px] flex items-center justify-center disabled:cursor-not-allowed"
                  onClick={() => {
                    setSelectedRange(0);
                    revertDisplay ? increaseTickUpper() : decreaseTickLower();
                  }}
                  disabled={revertDisplay ? isMaxTick : isMinTick}
                >
                  -
                </button>
              </div>
            </div>
          </div>

          <div className="border border-stroke rounded-md px-4 py-3 text-subText text-sm mt-4">
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-2">
                <div>Max Price</div>
                <input
                  className="bg-transparent text-text text-[18px] font-medium border-none outline-none w-full"
                  inputMode="decimal"
                  autoComplete="off"
                  autoCorrect="off"
                  type="text"
                  pattern="^[0-9]*[.]?[0-9]*$"
                  placeholder="0.0"
                  minLength={1}
                  maxLength={79}
                  value={revertDisplay ? minPrice : maxPrice}
                  onChange={(e) => {
                    const value = e.target.value.replace(/,/g, "");
                    const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`); // match escaped "." characters via in a non-capturing group
                    if (
                      value === "" ||
                      inputRegex.test(
                        value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
                      )
                    ) {
                      setSelectedRange(0);
                      revertDisplay ? setMinPrice(value) : setMaxPrice(value);
                    }
                  }}
                  onBlur={(e) => {
                    if (pool === "loading") return;
                    const tick = priceToClosestTick(
                      e.target.value,
                      pool.token0.decimals,
                      pool.token1.decimals,
                      revertDisplay
                    );
                    if (tick !== undefined) {
                      const t =
                        tick % pool.tickSpacing === 0
                          ? tick
                          : nearestUsableTick(tick, pool.tickSpacing);
                      revertDisplay ? setTickLower(t) : setTickUpper(t);
                    }
                  }}
                />
                <div>{priceLabel}</div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  className="border border-stroke w-6 h-6 rounded-[6px] text-[20px] flex items-center justify-center disabled:cursor-not-allowed"
                  onClick={() => {
                    setSelectedRange(0);
                    revertDisplay ? decreaseTickLower() : increaseTickUpper();
                  }}
                  disabled={!revertDisplay ? isMaxTick : isMinTick}
                >
                  +
                </button>
                <button
                  className="border border-stroke w-6 h-6 rounded-[6px] text-[20px] flex items-center justify-center disabled:cursor-not-allowed"
                  onClick={() => {
                    setSelectedRange(0);
                    revertDisplay ? increaseTickLower() : decreaseTickUpper();
                  }}
                  disabled={!revertDisplay ? isMaxTick : isMinTick}
                >
                  -
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
