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
import { useEffect, useState } from "react";
import { formatDisplayNumber } from "@kyber/utils/number";
import { cn } from "@kyber/utils/tailwind-helpers";
import { useZapStateStore } from "../stores/useZapStateStore";

export function TargetPoolState() {
  const { pools } = usePoolsStore();
  const { tickLower, tickUpper, setTickLower, setTickUpper } =
    useZapStateStore();

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

      <div className="flex items-center gap-2 justify-between text-subText text-sm mt-4">
        {[100, 80, 50, 20].map((percent) => (
          <button
            key={percent}
            className={cn(
              "border rounded-full border-stroke px-3 py-1 flex items-center justify-center",
              percent === 100 ? "w-max-content" : "flex-1"
            )}
            onClick={() => {
              if (pool === "loading") return;
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

              if (lower)
                setTickLower(nearestUsableTick(lower, pool.tickSpacing));
              if (upper)
                setTickUpper(nearestUsableTick(upper, pool.tickSpacing));
            }}
          >
            {percent === 100 ? "Full Range" : `${percent}%`}
          </button>
        ))}
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
              pattern="^[0-9]*[.,]?[0-9]*$"
              placeholder="0.0"
              minLength={1}
              maxLength={79}
              value={revertDisplay ? maxPrice : minPrice}
              onChange={(e) => {
                const value = e.target.value.replace(/,/g, ".");
                const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`); // match escaped "." characters via in a non-capturing group
                if (
                  value === "" ||
                  inputRegex.test(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
                ) {
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
                revertDisplay ? decreaseTickUpper() : increaseTickLower();
              }}
              disabled={revertDisplay ? isMaxTick : isMinTick}
            >
              +
            </button>
            <button
              className="border border-stroke w-6 h-6 rounded-[6px] text-[20px] flex items-center justify-center disabled:cursor-not-allowed"
              onClick={() => {
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
              pattern="^[0-9]*[.,]?[0-9]*$"
              placeholder="0.0"
              minLength={1}
              maxLength={79}
              value={revertDisplay ? minPrice : maxPrice}
              onChange={(e) => {
                const value = e.target.value.replace(/,/g, ".");
                const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`); // match escaped "." characters via in a non-capturing group
                if (
                  value === "" ||
                  inputRegex.test(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
                ) {
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
                revertDisplay ? decreaseTickLower() : increaseTickUpper();
              }}
              disabled={!revertDisplay ? isMaxTick : isMinTick}
            >
              +
            </button>
            <button
              className="border border-stroke w-6 h-6 rounded-[6px] text-[20px] flex items-center justify-center disabled:cursor-not-allowed"
              onClick={() => {
                revertDisplay ? increaseTickLower() : decreaseTickUpper();
              }}
              disabled={!revertDisplay ? isMaxTick : isMinTick}
            >
              -
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
