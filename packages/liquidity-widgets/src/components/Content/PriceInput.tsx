import { useEffect, useMemo, useState } from "react";
import { Type, useZapState } from "../../hooks/useZapInState";
import { useWidgetInfo } from "../../hooks/useWidgetInfo";
import { nearestUsableTick, tryParseTick } from "../../entities/Pool";

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
  const { pool, poolType } = useWidgetInfo();
  const [localValue, setLocalValue] = useState("");

  const price = useMemo(() => {
    const leftPrice = !revertPrice ? priceLower : priceUpper?.invert();
    const rightPrice = !revertPrice ? priceUpper : priceLower?.invert();
    return type === Type.PriceLower ? leftPrice : rightPrice;
  }, [type, priceLower, revertPrice, priceUpper]);

  const isFullRange =
    !!pool && tickLower === pool.minTick && tickUpper === pool.maxTick;

  const increase = (tick: number | null) => {
    if (!pool) return;
    const newTick =
      tick === null
        ? nearestUsableTick(
            poolType,
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
            poolType,
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

  const correctPrice = (value: string) => {
    if (!pool) return;
    if (revertPrice) {
      const defaultTick =
        (type === Type.PriceLower ? tickLower : tickUpper) || pool?.tickCurrent;
      const tick =
        tryParseTick(poolType, pool?.token1, pool?.token0, pool?.fee, value) ??
        defaultTick;
      if (Number.isInteger(tick))
        setTick(type, nearestUsableTick(poolType, tick, pool.tickSpacing));
    } else {
      const defaultTick =
        (type === Type.PriceLower ? tickLower : tickUpper) || pool?.tickCurrent;
      const tick =
        tryParseTick(poolType, pool?.token0, pool?.token1, pool?.fee, value) ??
        defaultTick;
      if (Number.isInteger(tick))
        setTick(type, nearestUsableTick(poolType, tick, pool.tickSpacing));
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
    } else if (price) setLocalValue(price?.toSignificant(6));
  }, [isFullRange, pool, type, tickLower, tickUpper, price, revertPrice]);

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
          onBlur={(e) => correctPrice(e.target.value)}
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
          {revertPrice
            ? `${pool?.token0.symbol} per ${pool?.token1.symbol}`
            : `${pool?.token1.symbol} per ${pool?.token0.symbol}`}
        </span>
      </div>

      {positionId === undefined && (
        <div className="action">
          <button
            onClick={increaseTick}
            disabled={isFullRange || positionId !== undefined}
          >
            +
          </button>
          <button
            role="button"
            onClick={decreaseTick}
            disabled={isFullRange || positionId !== undefined}
          >
            -
          </button>
        </div>
      )}
    </div>
  );
}
