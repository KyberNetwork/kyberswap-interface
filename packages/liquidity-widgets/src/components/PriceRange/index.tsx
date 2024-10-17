import {
  DEFAULT_PRICE_RANGE,
  FULL_PRICE_RANGE,
  PRICE_RANGE,
} from "@/constants";
import { useWidgetInfo } from "@/hooks/useWidgetInfo";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../ui/button";
import { correctPrice } from "@/utils";
import { Type } from "@/hooks/types/zapInTypes";
import { Price } from "@/entities/Pool";
import { useZapState } from "@/hooks/useZapInState";

interface SelectedRange {
  range: typeof FULL_PRICE_RANGE | number;
  priceLower: Price | null;
  priceUpper: Price | null;
}

const PriceRange = () => {
  const [selectedRange, setSelectedRange] = useState<SelectedRange | null>(
    null
  );

  const { priceLower, priceUpper, setTick, tickLower, tickUpper, revertPrice } =
    useZapState();

  const { pool, poolType, positionId, loading } = useWidgetInfo();

  const { fee = 0 } = pool || {};

  const priceRanges = useMemo(
    () =>
      !fee
        ? []
        : fee / 10_000 <= 0.01
        ? PRICE_RANGE.LOW_POOL_FEE
        : fee / 10_000 > 0.1
        ? PRICE_RANGE.HIGH_POOL_FEE
        : PRICE_RANGE.MEDIUM_POOL_FEE,
    [fee]
  );

  const minPrice = useMemo(() => {
    if (
      (!revertPrice && pool?.minTick === tickLower) ||
      (revertPrice && pool?.maxTick === tickUpper)
    )
      return "0";

    return (!revertPrice ? priceLower : priceUpper?.invert())?.toSignificant(6);
  }, [revertPrice, pool, tickLower, tickUpper, priceLower, priceUpper]);

  const maxPrice = useMemo(() => {
    if (
      (!revertPrice && pool?.maxTick === tickUpper) ||
      (revertPrice && pool?.minTick === tickLower)
    )
      return "∞";

    return (!revertPrice ? priceUpper : priceLower?.invert())?.toSignificant(6);
  }, [revertPrice, pool, tickUpper, tickLower, priceUpper, priceLower]);

  const handleSelectPriceRange = (range: typeof FULL_PRICE_RANGE | number) => {
    if (!pool) return;

    if (range === FULL_PRICE_RANGE) {
      setTick(Type.PriceLower, revertPrice ? pool.maxTick : pool.minTick);
      setTick(Type.PriceUpper, revertPrice ? pool.minTick : pool.maxTick);
      setSelectedRange({ range, priceLower: null, priceUpper: null });
      return;
    }

    const currentPoolPrice = pool
      ? revertPrice
        ? pool.priceOf(pool.token1)
        : pool.priceOf(pool.token0)
      : undefined;

    if (!currentPoolPrice) return;

    const left = +currentPoolPrice.toSignificant(18) * (1 - range);
    const right = +currentPoolPrice.toSignificant(18) * (1 + range);
    correctPrice(
      left.toString(),
      Type.PriceLower,
      pool,
      tickLower,
      tickUpper,
      poolType,
      revertPrice,
      setTick
    );
    correctPrice(
      right.toString(),
      Type.PriceUpper,
      pool,
      tickLower,
      tickUpper,
      poolType,
      revertPrice,
      setTick
    );
    setSelectedRange({ range, priceLower: null, priceUpper: null });
  };

  // Set to show selected range on UI
  useEffect(() => {
    if (selectedRange?.range && priceLower && priceUpper) {
      if (!selectedRange?.priceLower && !selectedRange?.priceUpper) {
        setSelectedRange({
          ...selectedRange,
          priceLower,
          priceUpper,
        });
      } else if (
        selectedRange.priceLower?.toFixed() !== priceLower.toFixed() ||
        selectedRange.priceUpper?.toFixed() !== priceUpper.toFixed()
      )
        setSelectedRange(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceLower, priceUpper]);

  // Set default price range depending on protocol fee
  useEffect(() => {
    if (!fee) return;
    if (!selectedRange)
      handleSelectPriceRange(
        fee / 10_000 <= 0.01
          ? DEFAULT_PRICE_RANGE.LOW_POOL_FEE
          : fee / 10_000 > 0.1
          ? DEFAULT_PRICE_RANGE.HIGH_POOL_FEE
          : DEFAULT_PRICE_RANGE.MEDIUM_POOL_FEE
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fee]);

  return !positionId ? (
    <div className="flex gap-[6px] my-[10px]">
      {priceRanges.map((item: string | number, index: number) => (
        <Button
          key={index}
          variant="outline"
          className={`flex-1 ${
            item === selectedRange?.range
              ? " text-accent !border-accent"
              : " text-subText"
          }`}
          onClick={() =>
            handleSelectPriceRange(item as typeof FULL_PRICE_RANGE | number)
          }
        >
          {item === FULL_PRICE_RANGE ? item : `${Number(item) * 100}%`}
        </Button>
      ))}
    </div>
  ) : (
    <div className="px-4 py-3 mt-4 text-sm border border-stroke rounded-md">
      <p className="text-subText mb-3">
        {!loading ? "Your Position Price Ranges" : "Loading..."}
      </p>
      {!loading && (
        <div className="flex items-center gap-4">
          <div className="bg-white bg-opacity-[0.04] rounded-md py-3 w-1/2 flex flex-col items-center justify-center gap-1">
            <p className="text-subText">Min Price</p>
            <p>{minPrice}</p>
            <p className="text-subText">
              {revertPrice
                ? `${pool?.token0.symbol}/${pool?.token1.symbol}`
                : `${pool?.token1.symbol}/${pool?.token0.symbol}`}
            </p>
          </div>
          <div className="bg-white bg-opacity-[0.04] rounded-md py-3 w-1/2 flex flex-col items-center justify-center gap-1">
            <p className="text-subText">Max Price</p>
            <p>{maxPrice}</p>
            <p className="text-subText">
              {revertPrice
                ? `${pool?.token0.symbol}/${pool?.token1.symbol}`
                : `${pool?.token1.symbol}/${pool?.token0.symbol}`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceRange;
