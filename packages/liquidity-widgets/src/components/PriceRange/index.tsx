import {
  DEFAULT_PRICE_RANGE,
  FULL_PRICE_RANGE,
  PRICE_RANGE,
} from "@/constants";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../ui/button";
import { useZapState } from "@/hooks/useZapInState";
import { useWidgetContext } from "@/stores/widget";
import {
  nearestUsableTick,
  priceToClosestTick,
  tickToPrice,
} from "@kyber/utils/uniswapv3";
import { univ3PoolNormalize, univ3PoolType } from "@/schema";

interface SelectedRange {
  range: typeof FULL_PRICE_RANGE | number;
  priceLower: string | null;
  priceUpper: string | null;
}

const PriceRange = () => {
  const [selectedRange, setSelectedRange] = useState<SelectedRange | null>(
    null
  );

  const {
    priceLower,
    priceUpper,
    setTickLower,
    setTickUpper,
    tickLower,
    tickUpper,
    revertPrice,
  } = useZapState();

  const { pool, positionId } = useWidgetContext((s) => s);
  const loading = pool === "loading";

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

  const minPrice = useMemo(() => {
    if (pool !== "loading") {
      const { success, data } = univ3PoolNormalize.safeParse(pool);
      if (
        success &&
        ((!revertPrice && data.minTick === tickLower) ||
          (revertPrice && data.maxTick === tickUpper))
      )
        return "0";

      return !revertPrice ? priceLower : priceUpper;
    }
  }, [revertPrice, pool, tickLower, tickUpper, priceLower, priceUpper]);

  const maxPrice = useMemo(() => {
    if (pool !== "loading") {
      const { success, data } = univ3PoolNormalize.safeParse(pool);
      if (
        success &&
        ((!revertPrice && data.maxTick === tickUpper) ||
          (revertPrice && data.minTick === tickLower))
      )
        return "∞";
      return !revertPrice ? priceUpper : priceLower;
    }
  }, [revertPrice, pool, tickUpper, tickLower, priceUpper, priceLower]);

  const handleSelectPriceRange = (range: typeof FULL_PRICE_RANGE | number) => {
    if (pool === "loading") return;
    const { success, data } = univ3PoolNormalize.safeParse(pool);
    if (!success) return;

    if (range === FULL_PRICE_RANGE) {
      setTickLower(data.minTick);
      setTickUpper(data.maxTick);
      setSelectedRange({ range, priceLower: null, priceUpper: null });
      return;
    }

    const currentPoolPrice = tickToPrice(
      data.tick,
      pool.token0.decimals,
      pool.token1.decimals,
      false
    );

    if (!currentPoolPrice) return;

    const left = +currentPoolPrice * (1 - range);
    const right = +currentPoolPrice * (1 + range);

    const lower = priceToClosestTick(
      left.toString(),
      pool.token0.decimals,
      pool.token1.decimals,
      false
    );
    const upper = priceToClosestTick(
      right.toString(),
      pool.token0.decimals,
      pool.token1.decimals,
      false
    );

    if (lower) setTickLower(nearestUsableTick(lower, data.tickSpacing));
    if (upper) setTickUpper(nearestUsableTick(upper, data.tickSpacing));
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
        selectedRange.priceLower !== priceLower ||
        selectedRange.priceUpper !== priceUpper
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
        fee <= 0.01
          ? DEFAULT_PRICE_RANGE.LOW_POOL_FEE
          : fee > 0.1
          ? DEFAULT_PRICE_RANGE.HIGH_POOL_FEE
          : DEFAULT_PRICE_RANGE.MEDIUM_POOL_FEE
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fee]);

  const isUniv3 =
    pool !== "loading" && univ3PoolType.safeParse(pool.poolType).success;

  if (!isUniv3) return null;

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
