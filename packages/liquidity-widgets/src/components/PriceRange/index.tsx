import {
  DEFAULT_PRICE_RANGE,
  FULL_PRICE_RANGE,
  PRICE_RANGE,
} from "@/constants";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@kyber/ui/button";
import { useZapState } from "@/hooks/useZapInState";
import { useWidgetContext } from "@/stores/widget";
import {
  nearestUsableTick,
  priceToClosestTick,
  tickToPrice,
} from "@kyber/utils/uniswapv3";
import { univ3PoolNormalize, univ3PoolType } from "@/schema";
import { toString } from "@/utils/number";

interface SelectedRange {
  range: number | string;
  tickLower?: number;
  tickUpper?: number;
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
        : fee <= 0.05
        ? PRICE_RANGE.MEDIUM_POOL_FEE
        : fee <= 0.3
        ? PRICE_RANGE.MIDDLE_POOL_FEE
        : PRICE_RANGE.HIGH_POOL_FEE,
    [fee]
  );

  const priceRangeCalculated = useMemo(() => {
    if (!priceRanges.length || pool === "loading") return;
    const { success, data } = univ3PoolNormalize.safeParse(pool);
    if (!success) return;
    return priceRanges
      .map((item) => {
        if (item === FULL_PRICE_RANGE)
          return {
            range: item,
            tickLower: data.minTick,
            tickUpper: data.maxTick,
          };

        const currentPoolPrice = tickToPrice(
          data.tick,
          pool.token0?.decimals,
          pool.token1?.decimals,
          false
        );

        if (!currentPoolPrice) return;

        const left = +currentPoolPrice * (1 - Number(item));
        const right = +currentPoolPrice * (1 + Number(item));

        const lower = priceToClosestTick(
          toString(Number(left)),
          pool.token0?.decimals,
          pool.token1?.decimals,
          false
        );
        const upper = priceToClosestTick(
          toString(Number(right)),
          pool.token0?.decimals,
          pool.token1?.decimals,
          false
        );
        if (!lower || !upper) return null;

        return {
          range: item,
          tickLower: nearestUsableTick(lower, data.tickSpacing),
          tickUpper: nearestUsableTick(upper, data.tickSpacing),
        };
      })
      .filter((item) => !!item);
  }, [pool, priceRanges]);

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

  const handleSelectPriceRange = (range: string | number) => {
    if (!priceRangeCalculated) return;
    const selected = priceRangeCalculated.find((item) => item?.range === range);
    if (!selected) return;
    setSelectedRange(selected);
    setTickLower(selected.tickLower);
    setTickUpper(selected.tickUpper);
  };

  useEffect(() => {
    if (!priceRangeCalculated) return;
    const selected = priceRangeCalculated.find(
      (item) => item?.tickLower === tickLower && item?.tickUpper === tickUpper
    );
    if (selected) setSelectedRange(selected);
    else setSelectedRange(null);
  }, [priceRangeCalculated, tickLower, tickUpper]);

  // Set default price range depending on protocol fee
  useEffect(() => {
    if (!fee) return;
    if (!selectedRange)
      handleSelectPriceRange(
        fee <= 0.01
          ? DEFAULT_PRICE_RANGE.LOW_POOL_FEE
          : fee <= 0.05
          ? DEFAULT_PRICE_RANGE.MEDIUM_POOL_FEE
          : fee <= 0.3
          ? DEFAULT_PRICE_RANGE.MIDDLE_POOL_FEE
          : DEFAULT_PRICE_RANGE.HIGH_POOL_FEE
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
            <p className="max-w-full truncate" title={minPrice?.toString()}>
              {minPrice}
            </p>
            <p className="text-subText">
              {revertPrice
                ? `${pool?.token0.symbol}/${pool?.token1.symbol}`
                : `${pool?.token1.symbol}/${pool?.token0.symbol}`}
            </p>
          </div>
          <div className="bg-white bg-opacity-[0.04] rounded-md px-2 py-3 w-1/2 flex flex-col items-center justify-center gap-1">
            <p className="text-subText">Max Price</p>
            <p className="max-w-full truncate" title={maxPrice?.toString()}>
              {maxPrice}
            </p>
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
