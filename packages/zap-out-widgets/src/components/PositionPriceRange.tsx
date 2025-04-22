import { univ3PoolNormalize, univ3Position } from "@/schema";
import { useZapOutContext } from "@/stores";
import { useZapOutUserState } from "@/stores/state";
import { formatDisplayNumber } from "@kyber/utils/number";
import { tickToPrice } from "@kyber/utils/uniswapv3";

export function PositionPriceRange() {
  const { position, pool } = useZapOutContext((s) => s);

  const { revertPrice } = useZapOutUserState();

  const { success: isUniv3, data: univ3Pos } =
    univ3Position.safeParse(position);

  const { success: isUniv3Pool, data: univ3Pool } =
    univ3PoolNormalize.safeParse(pool);

  if (!isUniv3 || !isUniv3Pool) return null;

  const minPrice = tickToPrice(
    univ3Pos.tickLower,
    univ3Pool.token0.decimals,
    univ3Pool.token1.decimals,
    revertPrice
  );

  const maxPrice = tickToPrice(
    univ3Pos.tickUpper,
    univ3Pool.token0.decimals,
    univ3Pool.token1.decimals,
    revertPrice
  );

  const isMinTick = univ3Pos.tickLower === univ3Pool.minTick;
  const isMaxTick = univ3Pos.tickUpper === univ3Pool.maxTick;

  const displayLower = isMinTick
    ? "0"
    : formatDisplayNumber(revertPrice ? maxPrice : minPrice, {
        significantDigits: 8,
      });

  const displayUpper = isMaxTick
    ? "∞"
    : formatDisplayNumber(revertPrice ? minPrice : maxPrice, {
        significantDigits: 8,
      });

  const label = revertPrice
    ? `${univ3Pool.token0.symbol} per ${univ3Pool.token1.symbol}`
    : `${univ3Pool.token1.symbol} per ${univ3Pool.token0.symbol}`;

  return (
    <div className="rounded-lg px-4 py-3 border border-stroke text-sm text-subText">
      <div>Your Position Price Ranges</div>

      <div className="flex gap-4 mt-3">
        <div className="bg-layer2 rounded-xl p-3 flex flex-col gap-2 flex-1 text-center">
          <div>Min Price</div>
          <div className="text-text text-sm font-medium">{displayLower}</div>
          <div>{label}</div>
        </div>

        <div className="bg-layer2 rounded-xl p-3 flex flex-col gap-2 flex-1 text-center">
          <div>Max Price</div>
          <div className="text-text text-sm font-medium">{displayUpper}</div>
          <div>{label}</div>
        </div>
      </div>
    </div>
  );
}
