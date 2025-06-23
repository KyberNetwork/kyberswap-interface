import { useMemo } from "react";
import { tickToPrice } from "@kyber/utils/uniswapv3";
import { type PoolInfo, type TickProcessed } from "@/types";
import { computeSurroundingTicks } from "@/utils";
import { PRICE_FIXED_DIGITS } from "@/constants";

export default function usePoolActiveLiquidity({
  pool,
  revertPrice,
}: {
  pool: PoolInfo;
  revertPrice: boolean;
}) {
  const { tickCurrent, tickSpacing, ticks, liquidity, token0, token1 } = pool;

  return useMemo(() => {
    if (
      (!tickCurrent && tickCurrent !== 0) ||
      !tickSpacing ||
      !ticks ||
      !ticks.length ||
      !token0 ||
      !token1
    )
      return [];

    const activeTick = Math.floor(tickCurrent / tickSpacing) * tickSpacing;

    // find where the active tick would be to partition the array
    // if the active tick is initialized, the pivot will be an element
    // if not, take the previous tick as pivot
    const pivot =
      ticks.findIndex(({ index: tick }) => Number(tick) > activeTick) - 1;

    if (pivot < 0) {
      // consider setting a local error
      // TickData pivot not found
      return [];
    }

    const activeTickProcessed: TickProcessed = {
      liquidityActive: BigInt(liquidity),
      tick: activeTick,
      liquidityNet:
        Number(ticks[pivot].index) === activeTick
          ? BigInt(ticks[pivot].liquidityNet)
          : 0n,
      price: Number(
        tickToPrice(activeTick, token0.decimals, token1.decimals, revertPrice)
      ).toFixed(PRICE_FIXED_DIGITS),
    };

    const subsequentTicks = computeSurroundingTicks(
      token0.decimals,
      token1.decimals,
      activeTickProcessed,
      ticks,
      pivot,
      true,
      revertPrice
    );
    const previousTicks = computeSurroundingTicks(
      token0.decimals,
      token1.decimals,
      activeTickProcessed,
      ticks,
      pivot,
      false,
      revertPrice
    );
    const ticksProcessed = previousTicks
      .concat(activeTickProcessed)
      .concat(subsequentTicks);

    return ticksProcessed;
  }, [liquidity, revertPrice, tickCurrent, tickSpacing, ticks, token0, token1]);
}
