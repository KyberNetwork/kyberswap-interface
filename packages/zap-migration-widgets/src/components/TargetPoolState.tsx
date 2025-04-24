import SwapIcon from "../assets/icons/swap.svg";
import {
  ChainId,
  UniV2Pool,
  UniV3Pool,
  UniV3Position,
  univ2Dexes,
  univ3Dexes,
  univ3PoolCommonField,
} from "../schema";
import { usePoolsStore } from "../stores/usePoolsStore";
import { usePositionStore } from "../stores/usePositionStore";
import { useZapStateStore } from "../stores/useZapStateStore";
import { Skeleton } from "@kyber/ui/skeleton";
import {
  divideBigIntToString,
  formatDisplayNumber,
  toString,
} from "@kyber/utils/number";
import { cn } from "@kyber/utils/tailwind-helpers";
import {
  MAX_TICK,
  MIN_TICK,
  nearestUsableTick,
  priceToClosestTick,
  tickToPrice,
} from "@kyber/utils/uniswapv3";
import { useEffect, useMemo, useState } from "react";
import { EstimateLiqValue } from "./EstimateLiqValue";
import {
  FeeAmount,
  FULL_PRICE_RANGE,
  PRICE_RANGE,
  DEFAULT_PRICE_RANGE,
} from "../constants/priceRanges";

interface SelectedRange {
  range: number | string;
  tickLower: number;
  tickUpper: number;
}

const getFeeRange = (fee: number): FeeAmount | undefined => {
  if (!fee) return;
  return [
    FeeAmount.HIGH,
    FeeAmount.MEDIUM,
    FeeAmount.LOW,
    FeeAmount.LOWEST,
  ].reduce(
    (range, current) => (current >= fee ? current : range),
    FeeAmount.HIGH
  );
};

export function TargetPoolState({
  initialTick,
  chainId,
}: {
  initialTick?: { tickLower: number; tickUpper: number };
  chainId: ChainId;
}) {
  const { pools } = usePoolsStore();
  const { tickLower, tickUpper, setTickLower, setTickUpper } =
    useZapStateStore();

  const { toPosition } = usePositionStore();

  const isUniV3 = pools !== "loading" && univ3Dexes.includes(pools[1].dex);
  const isUniV2 = pools !== "loading" && univ2Dexes.includes(pools[1].dex);

  useEffect(() => {
    if (toPosition !== "loading" && toPosition !== null && isUniV3) {
      setTickLower((toPosition as UniV3Position).tickLower);
      setTickUpper((toPosition as UniV3Position).tickUpper);
    }
  }, [toPosition, isUniV3, setTickLower, setTickUpper]);

  const pool = pools === "loading" ? "loading" : pools[1];
  const [revertDisplay, setRevertDisplay] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const isMinTick =
    pool !== "loading" &&
    isUniV3 &&
    tickLower === nearestUsableTick(MIN_TICK, (pool as UniV3Pool).tickSpacing);
  const isMaxTick =
    pool !== "loading" &&
    isUniV3 &&
    tickUpper === nearestUsableTick(MAX_TICK, (pool as UniV3Pool).tickSpacing);

  const [selectedRange, setSelectedRange] = useState<SelectedRange | null>(
    null
  );

  useEffect(() => {
    if (pool !== "loading" && tickUpper && tickLower) {
      const maxPrice = isMaxTick
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
          );
      const minPrice = isMinTick
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

      setMaxPrice(
        toPosition && toPosition !== "loading"
          ? revertDisplay
            ? minPrice
            : maxPrice
          : maxPrice
      );
      setMinPrice(
        toPosition && toPosition !== "loading"
          ? revertDisplay
            ? maxPrice
            : minPrice
          : minPrice
      );
    }
  }, [
    tickLower,
    pool,
    revertDisplay,
    isMinTick,
    isMaxTick,
    tickUpper,
    toPosition,
  ]);

  const priceLabel =
    pool === "loading" ? (
      <Skeleton className="h-5 w-24" />
    ) : (
      <>
        {revertDisplay ? pool.token0.symbol : pool.token1.symbol} per{" "}
        {revertDisplay ? pool.token1.symbol : pool.token0.symbol}
      </>
    );

  const poolTick = !isUniV3
    ? undefined
    : pool === "loading"
    ? undefined
    : (pool as UniV3Pool).tick % (pool as UniV3Pool).tickSpacing === 0
    ? (pool as UniV3Pool).tick
    : nearestUsableTick(
        (pool as UniV3Pool).tick,
        (pool as UniV3Pool).tickSpacing
      );

  const increaseTickLower = () => {
    if (!isUniV3) return;
    if (pool === "loading" || poolTick === undefined) return;
    const newTick =
      tickLower !== null
        ? tickLower + (pool as UniV3Pool).tickSpacing
        : poolTick + (pool as UniV3Pool).tickSpacing;
    if (newTick <= MAX_TICK) setTickLower(newTick);
  };

  const increaseTickUpper = () => {
    if (!isUniV3) return;
    if (pool === "loading" || poolTick === undefined) return;
    const newTick =
      tickUpper !== null
        ? tickUpper + (pool as UniV3Pool).tickSpacing
        : poolTick + (pool as UniV3Pool).tickSpacing;
    if (newTick <= MAX_TICK) setTickUpper(newTick);
  };

  const decreaseTickLower = () => {
    if (!isUniV3) return;
    if (pool === "loading" || poolTick === undefined) return;
    const newTick =
      (tickLower !== null ? tickLower : (pool as UniV3Pool).tick) -
      (pool as UniV3Pool).tickSpacing;

    if (newTick >= MIN_TICK) setTickLower(newTick);
  };
  const decreaseTickUpper = () => {
    if (!isUniV3) return;
    if (pool === "loading" || poolTick === undefined) return;
    const newTick =
      (tickUpper !== null ? tickUpper : poolTick) -
      (pool as UniV3Pool).tickSpacing;

    if (newTick >= MIN_TICK) setTickUpper(newTick);
  };

  const fee = pool === "loading" ? 0 : pool.fee;
  const feeRange = getFeeRange(fee);
  const priceRanges = useMemo(
    () => (feeRange ? PRICE_RANGE[feeRange] : []),
    [feeRange]
  );

  const priceRangeCalculated = useMemo(() => {
    if (!priceRanges.length || pool === "loading") return;
    const { success, data } = univ3PoolCommonField.safeParse(pool);
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

  const handleSelectPriceRange = (range: string | number) => {
    if (!priceRangeCalculated) return;
    const selected = priceRangeCalculated.find((item) => item?.range === range);
    if (!selected) return;
    setSelectedRange(selected);
  };

  useEffect(() => {
    if (!priceRangeCalculated || !selectedRange) return;
    setTickLower(selectedRange.tickLower);
    setTickUpper(selectedRange.tickUpper);
  }, [priceRangeCalculated, selectedRange, setTickLower, setTickUpper]);

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
    if (!feeRange || (toPosition !== "loading" && toPosition !== null)) return;
    if (!selectedRange) handleSelectPriceRange(DEFAULT_PRICE_RANGE[feeRange]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feeRange, toPosition]);

  useEffect(() => {
    if (
      pools === "loading" ||
      !initialTick ||
      !isUniV3 ||
      !("tickSpacing" in pools[1])
    )
      return;
    if (
      initialTick.tickLower % pools[1].tickSpacing === 0 &&
      initialTick.tickUpper % pools[1].tickSpacing === 0
    ) {
      setTickLower(initialTick.tickLower);
      setTickUpper(initialTick.tickUpper);
    }
  }, [initialTick, isUniV3, pools, setTickLower, setTickUpper]);

  let poolPrice;
  if (isUniV3 && pool !== "loading") {
    poolPrice = formatDisplayNumber(
      tickToPrice(
        (pool as UniV3Pool).tick,
        pool.token0.decimals,
        pool.token1.decimals,
        revertDisplay
      ),
      { significantDigits: 6 }
    );
  } else if (isUniV2 && pool !== "loading") {
    const po = pool as UniV2Pool;
    if (po.reserves) {
      const p = divideBigIntToString(
        BigInt(po.reserves[1]) * 10n ** BigInt(po.token0.decimals),
        BigInt(po.reserves[0]) * 10n ** BigInt(po.token1.decimals),
        18
      );
      poolPrice = formatDisplayNumber(revertDisplay ? 1 / +p : p, {
        significantDigits: 5,
      });
    }
  }

  return (
    <div className="flex-1">
      <div className="border border-stroke rounded-md px-4 py-3 text-subText text-sm flex items-center gap-1 flex-wrap">
        Pool Price{" "}
        {pool === "loading" && poolPrice ? (
          <Skeleton className="w-[200px] h-3.5" />
        ) : (
          <>
            <div className="text-text">{poolPrice}</div>
            <div>{priceLabel}</div>

            <SwapIcon
              role="button"
              onClick={() => setRevertDisplay(!revertDisplay)}
            />
          </>
        )}
      </div>

      {isUniV2 && <EstimateLiqValue chainId={chainId} />}

      {isUniV3 &&
        (toPosition !== "loading" && toPosition !== null ? (
          <div className="flex-1 border border-stroke rounded-md px-4 py-3 mt-4">
            <div className="text-subText text-sm">
              Your Position Price Range
            </div>
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
              {priceRanges.map((priceRange) => {
                return (
                  <button
                    key={priceRange}
                    className={cn(
                      "border rounded-full border-stroke px-3 py-1 flex items-center justify-center",
                      priceRange === FULL_PRICE_RANGE
                        ? "w-max-content"
                        : "flex-1",
                      selectedRange?.range === priceRange
                        ? "border-primary text-primary"
                        : ""
                    )}
                    onClick={() =>
                      handleSelectPriceRange(
                        priceRange as typeof FULL_PRICE_RANGE | number
                      )
                    }
                  >
                    {priceRange === FULL_PRICE_RANGE
                      ? priceRange
                      : `${Number(priceRange) * 100}%`}
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
                        setSelectedRange(null);
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
                          tick % (pool as any).tickSpacing === 0
                            ? tick
                            : nearestUsableTick(
                                tick,
                                (pool as any).tickSpacing
                              );
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
                      setSelectedRange(null);
                      revertDisplay ? decreaseTickUpper() : increaseTickLower();
                    }}
                    disabled={revertDisplay ? isMaxTick : isMinTick}
                  >
                    +
                  </button>
                  <button
                    className="border border-stroke w-6 h-6 rounded-[6px] text-[20px] flex items-center justify-center disabled:cursor-not-allowed"
                    onClick={() => {
                      setSelectedRange(null);
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
                        setSelectedRange(null);
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
                          tick % (pool as UniV3Pool).tickSpacing === 0
                            ? tick
                            : nearestUsableTick(
                                tick,
                                (pool as UniV3Pool).tickSpacing
                              );
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
                      setSelectedRange(null);
                      revertDisplay ? decreaseTickLower() : increaseTickUpper();
                    }}
                    disabled={!revertDisplay ? isMaxTick : isMinTick}
                  >
                    +
                  </button>
                  <button
                    className="border border-stroke w-6 h-6 rounded-[6px] text-[20px] flex items-center justify-center disabled:cursor-not-allowed"
                    onClick={() => {
                      setSelectedRange(null);
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
        ))}
    </div>
  );
}
