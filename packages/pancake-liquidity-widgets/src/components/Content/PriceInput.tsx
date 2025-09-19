import { useEffect, useState } from "react";
import { useZapState } from "@/hooks/useZapInState";
import { useWidgetInfo } from "@/hooks/useWidgetInfo";
import { nearestUsableTick } from "@pancakeswap/v3-sdk";
import { Type } from "@/types/zapInTypes";
import { cn } from "@kyber/utils/tailwind-helpers";
import { correctPrice } from "@/utils";
import { formatDisplayNumber } from "@kyber/utils/number";

export default function PriceInput({ type }: { type: Type }) {
  const {
    tickLower,
    tickUpper,
    revertPrice,
    setTick,
    priceLower,
    priceUpper,
    positionId,
  } = useZapState();
  const { pool } = useWidgetInfo();
  const [localValue, setLocalValue] = useState("");

  const isFullRange =
    !!pool && tickLower === pool.minTick && tickUpper === pool.maxTick;

  const increase = (tick: number | null) => {
    if (!pool) return;
    const newTick =
      tick === null
        ? nearestUsableTick(
            pool.tickCurrent + pool.tickSpacing,
            pool.tickSpacing
          )
        : tick + pool.tickSpacing;
    setTick(type, newTick);
  };

  const decrease = (tick: number | null) => {
    if (!pool) return;
    const newTick =
      tick === null
        ? nearestUsableTick(
            pool.tickCurrent - pool.tickSpacing,
            pool.tickSpacing
          )
        : tick - pool.tickSpacing;
    setTick(type, newTick);
  };

  const increaseTick = () => {
    if (type === Type.PriceLower) {
      if (!revertPrice) increase(tickLower);
      else decrease(tickUpper);
    } else {
      if (!revertPrice) increase(tickUpper);
      else decrease(tickLower);
    }
  };

  const decreaseTick = () => {
    if (type === Type.PriceLower) {
      if (!revertPrice) decrease(tickLower);
      else increase(tickUpper);
    } else {
      if (!revertPrice) decrease(tickUpper);
      else increase(tickLower);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, ".");
    const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`); // match escaped "." characters via in a non-capturing group
    if (
      value === "" ||
      inputRegex.test(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    ) {
      setLocalValue(value);
    }
  };

  useEffect(() => {
    if (
      type === Type.PriceLower &&
      (!revertPrice ? pool?.minTick === tickLower : pool?.maxTick === tickUpper)
    ) {
      setLocalValue("0");
    } else if (
      type === Type.PriceUpper &&
      (!revertPrice ? pool?.maxTick === tickUpper : pool?.minTick === tickLower)
    ) {
      setLocalValue("∞");
    } else if (priceLower && priceUpper) {
      if (type === Type.PriceLower) {
        const valueToSet = !revertPrice ? priceLower : priceUpper;
        if (positionId)
          setLocalValue(
            formatDisplayNumber(valueToSet, {
              significantDigits: 6,
            })
          );
        else setLocalValue(valueToSet);
      } else {
        const valueToSet = !revertPrice ? priceUpper : priceLower;
        if (positionId)
          setLocalValue(
            formatDisplayNumber(valueToSet, {
              significantDigits: 6,
            })
          );
        else setLocalValue(valueToSet);
      }
    }
  }, [
    isFullRange,
    pool,
    type,
    tickLower,
    tickUpper,
    priceLower,
    priceUpper,
    revertPrice,
    positionId,
  ]);

  return (
    <div className="mt-3 p-3 border border-inputBorder text-center rounded-md bg-inputBackground text-textSecondary">
      <span className="text-secondary text-xs font-semibold">
        {type === Type.PriceLower ? "MIN" : "MAX"} PRICE
      </span>

      <div className="flex my-2 mx-0 gap-1 flex-1 text-sm justify-center">
        {positionId === undefined && (
          <button
            className="w-6 h-6 rounded-[50%] border-2 border-primary p-0 bg-transparent text-primary text-xl leading-6 cursor-pointer hover:enabled:brightness-150 active:enabled:scale-96 disabled:cursor-not-allowed disabled:opacity-60"
            role="button"
            onClick={decreaseTick}
            disabled={isFullRange || positionId !== undefined}
          >
            <span className="relative top-[-3px]">-</span>
          </button>
        )}

        <input
          value={localValue}
          onChange={handleInputChange}
          onBlur={(e) =>
            correctPrice({
              value: e.target.value,
              type,
              pool,
              revertPrice,
              setTick,
            })
          }
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
          className={cn(
            "bg-transparent text-textPrimary text-center text-base w-full max-w-[72px] font-semibold p-0 border-none outline-none disabled:cursor-not-allowed",
            positionId ? "max-w-[120px]" : ""
          )}
        />
        {positionId === undefined && (
          <button
            className="w-6 h-6 rounded-[50%] border-2 border-primary p-0 bg-transparent text-primary text-xl leading-6 cursor-pointer hover:enabled:brightness-150 active:enabled:scale-96 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={increaseTick}
            disabled={isFullRange || positionId !== undefined}
          >
            <span className="relative top-[-3px]">+</span>
          </button>
        )}
      </div>

      <div>
        {revertPrice
          ? `${pool?.token0.symbol} per ${pool?.token1.symbol}`
          : `${pool?.token1.symbol} per ${pool?.token0.symbol}`}
      </div>
    </div>
  );
}
