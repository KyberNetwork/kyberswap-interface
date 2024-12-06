import { useMemo } from "react";
import { useZapState } from "../../hooks/useZapInState";
import { formatNumber } from "../../utils";
import SwitchIcon from "@/assets/svg/switch.svg";
import { useWidgetContext } from "@/stores/widget";
import { tickToPrice } from "@kyber/utils/uniswapv3";
import { formatDisplayNumber } from "@kyber/utils/number";

export default function PriceInfo() {
  const { pool, theme } = useWidgetContext((s) => s);
  const loading = pool === "loading";
  const { marketPrice, revertPrice, toggleRevertPrice } = useZapState();

  const price = useMemo(
    () =>
      pool !== "loading"
        ? formatDisplayNumber(
            tickToPrice(
              pool.tick,
              pool.token0.decimals,
              pool.token1.decimals,
              revertPrice
            ),
            { significantDigits: 6 }
          )
        : "--",
    [pool, revertPrice]
  );

  const isDeviated = useMemo(
    () =>
      !!marketPrice &&
      pool !== "loading" &&
      Math.abs(
        marketPrice /
          +tickToPrice(
            pool.tick,
            pool.token0.decimals,
            pool.token1.decimals,
            revertPrice
          ) -
          1
      ) > 0.02,
    [marketPrice, pool]
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
