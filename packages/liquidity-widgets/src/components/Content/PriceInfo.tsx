import { useMemo } from "react";
import { useZapState } from "../../hooks/useZapInState";
import { assertUnreachable, formatNumber } from "../../utils";
import SwitchIcon from "@/assets/svg/switch.svg";
import { useWidgetContext } from "@/stores/widget";
import { tickToPrice } from "@kyber/utils/uniswapv3";
import { divideBigIntToString, formatDisplayNumber } from "@kyber/utils/number";
import { univ2PoolNormalize, univ3PoolNormalize } from "@/schema";

export default function PriceInfo() {
  const { pool, theme, poolType } = useWidgetContext((s) => s);
  const { marketPrice, revertPrice, toggleRevertPrice } = useZapState();

  const loading = pool === "loading";

  const price = useMemo(() => {
    if (pool === "loading") return "--";
    const { success, data } = univ3PoolNormalize.safeParse(pool);
    if (success) {
      return formatDisplayNumber(
        tickToPrice(
          data.tick,
          data.token0.decimals,
          data.token1.decimals,
          revertPrice
        ),
        { significantDigits: 6 }
      );
    }

    const { success: isUniV2, data: uniV2Pool } =
      univ2PoolNormalize.safeParse(pool);

    if (isUniV2) {
      const p = divideBigIntToString(
        BigInt(uniV2Pool.reserves[1]) * BigInt(uniV2Pool.token0.decimals),
        BigInt(uniV2Pool.reserves[0]) * BigInt(uniV2Pool.token1.decimals),
        18
      );
      return formatDisplayNumber(revertPrice ? 1 / +p : p, {
        significantDigits: 8,
      });
    }
    return assertUnreachable(poolType as never, "poolType is not handled");
  }, [pool, revertPrice]);

  const isDeviated = useMemo(
    () =>
      !!marketPrice &&
      Math.abs(marketPrice / (revertPrice ? 1 / +price : +price) - 1) > 0.02,
    [marketPrice, price, revertPrice]
  );

  const marketRate = useMemo(
    () =>
      marketPrice
        ? formatNumber(revertPrice ? 1 / marketPrice : marketPrice)
        : null,
    [marketPrice, revertPrice]
  );

  if (loading) return <div className="price-info">Loading...</div>;

  return (
    <>
      <div className="price-info">
        <div className="row">
          <span>Pool price</span>
          <span className="price">{price}</span>
          <span>
            {revertPrice
              ? `${pool?.token0.symbol} per ${pool?.token1.symbol}`
              : `${pool?.token1.symbol} per ${pool?.token0.symbol}`}
          </span>
          <SwitchIcon
            style={{ cursor: "pointer" }}
            onClick={() => toggleRevertPrice()}
            role="button"
          />
        </div>
      </div>

      {marketPrice === null && (
        <div
          className="price-warning"
          style={{ backgroundColor: `${theme.warning}33` }}
        >
          <span className="text">
            Unable to get the market price. Please be cautious!
          </span>
        </div>
      )}

      {isDeviated && (
        <div
          className="price-warning"
          style={{ backgroundColor: `${theme.warning}33` }}
        >
          <div className="text">
            The pool's current price of{" "}
            <span
              style={{
                fontWeight: "500",
                color: theme.warning,
                fontStyle: "normal",
              }}
            >
              1 {revertPrice ? pool?.token1.symbol : pool?.token0.symbol} ={" "}
              {price} {revertPrice ? pool?.token0.symbol : pool?.token1.symbol}
            </span>{" "}
            deviates from the market price{" "}
            <span
              style={{
                fontWeight: "500",
                color: theme.warning,
                fontStyle: "normal",
              }}
            >
              (1 {revertPrice ? pool?.token1.symbol : pool?.token0.symbol} ={" "}
              {marketRate}{" "}
              {revertPrice ? pool?.token0.symbol : pool?.token1.symbol})
            </span>
            . You might have high impermanent loss after you add liquidity to
            this pool
          </div>
        </div>
      )}
    </>
  );
}
