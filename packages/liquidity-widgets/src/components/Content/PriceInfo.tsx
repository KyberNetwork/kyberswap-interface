import { useWidgetInfo } from "../../hooks/useWidgetInfo";
import SwitchIcon from "../../assets/switch.svg?react";
import { useZapState } from "../../hooks/useZapInState";
import { formatNumber } from "../../utils";

export default function PriceInfo() {
  const { loading, pool, theme } = useWidgetInfo();
  const { marketPrice, revertPrice, toggleRevertPrice } = useZapState();

  if (loading) return <div className="price-info">Loading...</div>;

  const price = pool
    ? (revertPrice
        ? pool.priceOf(pool.token1)
        : pool.priceOf(pool.token0)
      ).toSignificant(6)
    : "--";

  const isDevated =
    !!marketPrice &&
    pool &&
    Math.abs(marketPrice / +pool?.priceOf(pool.token0).toSignificant() - 1) >
      0.02;

  const marketRate = marketPrice
    ? formatNumber(revertPrice ? 1 / marketPrice : marketPrice)
    : null;

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

      {isDevated && (
        <div
          className="price-warning"
          style={{ backgroundColor: `${theme.warning}33` }}
        >
          {/*
          <div className="row">
            <span>Market Price</span>
            <span className="price">{marketRate}</span>
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
          */}
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
