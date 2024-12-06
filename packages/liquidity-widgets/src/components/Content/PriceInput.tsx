import { useEffect, useState } from "react";
import { useZapState } from "../../hooks/useZapInState";
import { Type } from "../../hooks/types/zapInTypes";
import { NO_DATA } from "@/constants";
import { useWidgetContext } from "@/stores/widget";
import {
  MAX_TICK,
  MIN_TICK,
  nearestUsableTick,
  priceToClosestTick,
  tickToPrice,
} from "@kyber/utils/uniswapv3";
import { formatDisplayNumber } from "@kyber/utils/number";

export default function PriceInput({ type }: { type: Type }) {
  const {
    tickLower,
    tickUpper,
    revertPrice,
    setTickLower,
    setTickUpper,
    positionId,
  } = useZapState();
  const { pool } = useWidgetContext((s) => s);
  const [localValue, setLocalValue] = useState("");

  const isFullRange =
    pool !== "loading" &&
    tickLower === pool.minTick &&
    tickUpper === pool.maxTick;

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

  const wrappedCorrectPrice = (value: string) => {
    if (pool === "loading") return;
    const tick = priceToClosestTick(
      value,
      pool.token0.decimals,
      pool.token1.decimals,
      revertPrice
    );
    if (tick !== undefined) {
      const t =
        tick % pool.tickSpacing === 0
          ? tick
          : nearestUsableTick(tick, pool.tickSpacing);
      if (type === Type.PriceLower) {
        revertPrice ? setTickUpper(t) : setTickLower(t);
      } else {
        revertPrice ? setTickLower(t) : setTickUpper(t);
      }
    }
  };

  const isMinTick = pool !== "loading" && tickLower === pool.minTick;
  const isMaxTick = pool !== "loading" && tickUpper === pool.maxTick;

  useEffect(() => {
    if (pool !== "loading") {
      let minPrice = localValue;
      let maxPrice = localValue;
      if (tickUpper !== null)
        maxPrice = isMaxTick
          ? revertPrice
            ? "0"
            : "∞"
          : formatDisplayNumber(
              +tickToPrice(
                tickUpper,
                pool.token0.decimals,
                pool.token1.decimals,
                revertPrice
              ),
              { significantDigits: 8 }
            );
      if (tickLower !== null)
        minPrice = isMinTick
          ? revertPrice
            ? "∞"
            : "0"
          : formatDisplayNumber(
              +tickToPrice(
                tickLower,
                pool.token0.decimals,
                pool.token1.decimals,
                revertPrice
              ),
              { significantDigits: 8 }
            );

      if (type === Type.PriceLower) {
        setLocalValue(revertPrice ? maxPrice : minPrice);
      } else {
        setLocalValue(revertPrice ? minPrice : maxPrice);
      }
    }
  }, [tickUpper, tickLower, pool, revertPrice, isMaxTick, isMinTick]);

  return (
    <div className="price-input">
      <div className="input-wrapper">
        <span>{type === Type.PriceLower ? "Min" : "Max"} price</span>
        <input
          value={localValue}
          onChange={(e) => {
            const value = e.target.value.replace(/,/g, ".");
            const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`); // match escaped "." characters via in a non-capturing group
            if (
              value === "" ||
              inputRegex.test(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
            ) {
              setLocalValue(value);
            }
          }}
          onBlur={(e) => wrappedCorrectPrice(e.target.value)}
          inputMode="decimal"
          autoComplete="off"
          autoCorrect="off"
          disabled={positionId !== undefined}
          type="text"
          pattern="^[0-9]*[.,]?[0-9]*$"
          placeholder="0.0"
          minLength={1}
          maxLength={79}
          spellCheck="false"
        />
        <span>
          {pool !== "loading"
            ? revertPrice
              ? `${pool?.token0.symbol}/${pool?.token1.symbol}`
              : `${pool?.token1.symbol}/${pool?.token0.symbol}`
            : NO_DATA}
        </span>
      </div>

      {positionId === undefined && (
        <div className="action">
          <button
            onClick={() => {
              if (type === Type.PriceLower) {
                revertPrice ? decreaseTickUpper() : increaseTickLower();
              } else {
                revertPrice ? decreaseTickLower() : increaseTickUpper();
              }
            }}
            disabled={isFullRange || positionId !== undefined}
          >
            +
          </button>
          <button
            role="button"
            onClick={() => {
              if (type === Type.PriceLower) {
                revertPrice ? increaseTickUpper() : decreaseTickLower();
              } else {
                revertPrice ? increaseTickLower() : decreaseTickUpper();
              }
            }}
            disabled={isFullRange || positionId !== undefined}
          >
            -
          </button>
        </div>
      )}
    </div>
  );
}
