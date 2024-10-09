import "./Content.scss";
import X from "../../assets/x.svg";
import ErrorIcon from "../../assets/error.svg";
import PriceInfo from "./PriceInfo";
//import LiquidityChart from "./LiquidityChart";
import PriceInput from "./PriceInput";
import LiquidityToAdd from "./LiquidityToAdd";
import {
  AggregatorSwapAction,
  PoolSwapAction,
  ProtocolFeeAction,
  Type,
  useZapState,
} from "../../hooks/useZapInState";
import ZapRoute from "./ZapRoute";
import EstLiqValue from "./EstLiqValue";
import useApproval, { APPROVAL_STATE } from "../../hooks/useApproval";
import { useEffect, useState } from "react";
import { useWidgetInfo } from "../../hooks/useWidgetInfo";
import Header from "../Header";
import Preview, { ZapState } from "../Preview";
import { parseUnits } from "ethers/lib/utils";
import Modal from "../Modal";
import { PI_LEVEL, formatNumber, getPriceImpact } from "../../utils";
import InfoHelper from "../InfoHelper";
import { BigNumber } from "ethers";
import { useWeb3Provider } from "../../hooks/useProvider";

export default function Content({
  onDismiss,
  onTogglePreview,
  onTxSubmit,
}: {
  onDismiss: () => void;
  onTogglePreview?: (val: boolean) => void;
  onTxSubmit?: (tx: string) => void;
}) {
  const {
    tokenIn,
    zapInfo,
    amountIn,
    error,
    priceLower,
    priceUpper,
    ttl,
    loading: zapLoading,
    setTick,
    tickLower,
    tickUpper,
    slippage,
    positionId,
    degenMode,
    revertPrice,
    marketPrice,
  } = useZapState();

  const { pool, theme, error: loadPoolError, position } = useWidgetInfo();
  const { account } = useWeb3Provider();

  let amountInWei = "0";
  try {
    amountInWei = parseUnits(amountIn || "0", tokenIn?.decimals).toString();
  } catch {
    //
  }

  const { loading, approvalState, approve } = useApproval(
    amountInWei,
    tokenIn?.address || "",
    zapInfo?.routerAddress || ""
  );

  const [clickedApprove, setClickedLoading] = useState(false);
  const [snapshotState, setSnapshotState] = useState<ZapState | null>(null);
  const hanldeClick = () => {
    if (approvalState === APPROVAL_STATE.NOT_APPROVED) {
      setClickedLoading(true);
      approve().finally(() => setClickedLoading(false));
    } else if (
      pool &&
      amountIn &&
      tokenIn &&
      zapInfo &&
      priceLower &&
      priceUpper &&
      tickLower !== null &&
      tickUpper !== null
    ) {
      const date = new Date();
      date.setMinutes(date.getMinutes() + (ttl || 20));

      setSnapshotState({
        tokenIn,
        amountIn,
        pool,
        zapInfo,
        priceLower,
        priceUpper,
        deadline: Math.floor(date.getTime() / 1000),
        isFullRange: pool.maxTick === tickUpper && pool.minTick === tickLower,
        slippage,
        tickUpper,
        tickLower,
      });
      onTogglePreview?.(true);
    }
  };

  useEffect(() => {
    if (snapshotState === null) {
      onTogglePreview?.(false);
    }
  }, [snapshotState, onTogglePreview]);

  const btnText = (() => {
    if (error) return error;
    if (zapLoading) return "Loading...";
    if (loading) return "Checking Allowance";
    if (approvalState === APPROVAL_STATE.NOT_APPROVED) return "Approve";
    if (approvalState === APPROVAL_STATE.PENDING) return "Approving";
    return "Preview";
  })();

  const aggregatorSwapInfo = zapInfo?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_AGGREGATOR_SWAP"
  ) as AggregatorSwapAction | undefined;
  const swapAmountIn = aggregatorSwapInfo?.aggregatorSwap.swaps.reduce(
    (acc, item) => acc + +item.tokenIn.amountUsd,
    0
  );
  const swapAmountOut = aggregatorSwapInfo?.aggregatorSwap.swaps.reduce(
    (acc, item) => acc + +item.tokenOut.amountUsd,
    0
  );

  const poolSwapInfo = zapInfo?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_POOL_SWAP"
  ) as PoolSwapAction | null;
  const amountInPoolSwap =
    poolSwapInfo?.poolSwap.swaps.reduce(
      (acc, item) => acc + +item.tokenIn.amountUsd,
      0
    ) || 0;
  const amountOutPoolSwap =
    poolSwapInfo?.poolSwap.swaps.reduce(
      (acc, item) => acc + +item.tokenOut.amount,
      0
    ) || 0;

  const swapPriceImpact =
    swapAmountIn && swapAmountOut
      ? ((swapAmountIn +
          amountInPoolSwap -
          (swapAmountOut + amountOutPoolSwap)) *
          100) /
        swapAmountIn
      : null;

  const feeInfo = zapInfo?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_PROTOCOL_FEE"
  ) as ProtocolFeeAction | undefined;

  const piRes = getPriceImpact(zapInfo?.zapDetails.priceImpact, feeInfo);
  const swapPiRes = getPriceImpact(swapPriceImpact, feeInfo);

  const piVeryHigh =
    (zapInfo && [PI_LEVEL.VERY_HIGH, PI_LEVEL.INVALID].includes(piRes.level)) ||
    (!!aggregatorSwapInfo &&
      [PI_LEVEL.VERY_HIGH, PI_LEVEL.INVALID].includes(swapPiRes.level));

  const piHigh =
    (zapInfo && piRes.level === PI_LEVEL.HIGH) ||
    (!!aggregatorSwapInfo && swapPiRes.level === PI_LEVEL.HIGH);

  const disabled =
    clickedApprove ||
    loading ||
    zapLoading ||
    !!error ||
    approvalState === APPROVAL_STATE.PENDING ||
    (piVeryHigh && !degenMode);

  const newPool =
    zapInfo && pool
      ? pool.newPool({
          sqrtRatioX96: zapInfo?.poolDetails.uniswapV3.newSqrtP,
          tick: zapInfo.poolDetails.uniswapV3.newTick,
          liquidity: BigNumber.from(pool.liquidity)
            .add(BigNumber.from(zapInfo.positionDetails.addedLiquidity))
            .toString(),
        })
      : null;

  const isDevated =
    !!marketPrice &&
    newPool &&
    Math.abs(
      marketPrice / +newPool.priceOf(newPool.token0).toSignificant() - 1
    ) > 0.02;

  const isOutOfRangeAfterZap =
    position && newPool
      ? newPool.tickCurrent < position.tickLower ||
        newPool.tickCurrent >= position.tickUpper
      : false;

  const marketRate = marketPrice
    ? formatNumber(revertPrice ? 1 / marketPrice : marketPrice)
    : null;

  const price = newPool
    ? (revertPrice
        ? newPool.priceOf(newPool.token1)
        : newPool.priceOf(newPool.token0)
      ).toSignificant(6)
    : "--";

  return (
    <>
      {loadPoolError && (
        <Modal isOpen onClick={() => onDismiss()}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2rem",
              color: theme.error,
            }}
          >
            <ErrorIcon className="error-icon" />
            <div style={{ textAlign: "center" }}>{loadPoolError}</div>
            <button
              className="primary-btn"
              onClick={onDismiss}
              style={{
                width: "95%",
                background: theme.error,
                border: `1px solid ${theme.error}`,
              }}
            >
              Close
            </button>
          </div>
        </Modal>
      )}
      {snapshotState && (
        <Modal isOpen onClick={() => setSnapshotState(null)}>
          <div className="ks-lw-modal-headline">
            <div>{positionId ? "Increase" : "Add"} Liquidity via Zap</div>
            <div
              role="button"
              onClick={() => setSnapshotState(null)}
              style={{ cursor: "pointer" }}
            >
              <X />
            </div>
          </div>

          <Preview
            onTxSubmit={onTxSubmit}
            zapState={snapshotState}
            onDismiss={() => {
              setSnapshotState(null);
            }}
          />
        </Modal>
      )}
      <Header onDismiss={onDismiss} />
      <div className="ks-lw-content">
        <div className="left">
          <PriceInfo />
          {/*
          <LiquidityChart />
          */}
          <div className="label-row" style={{ marginTop: "1rem" }}>
            {positionId === undefined
              ? "Price ranges"
              : "Your position price ranges"}
            {positionId === undefined && (
              <button
                className="outline-btn"
                onClick={() => {
                  if (!pool) return;
                  setTick(
                    Type.PriceLower,
                    revertPrice ? pool.maxTick : pool.minTick
                  );
                  setTick(
                    Type.PriceUpper,
                    revertPrice ? pool.minTick : pool.maxTick
                  );
                }}
              >
                Full range
              </button>
            )}
          </div>
          <PriceInput type={Type.PriceLower} />
          <PriceInput type={Type.PriceUpper} />
          <LiquidityToAdd />
        </div>

        <div className="right">
          <ZapRoute />
          <EstLiqValue />

          {isOutOfRangeAfterZap && (
            <div
              className="price-warning"
              style={{
                backgroundColor: `${theme.warning}33`,
                color: theme.warning,
              }}
            >
              The position will be inactive after zapping and won’t earn any
              fees until the pool price moves back to select price range
            </div>
          )}
          {isDevated && (
            <div
              className="price-warning"
              style={{ backgroundColor: `${theme.warning}33` }}
            >
              <div className="text">
                The pool's estimated price after zapping of{" "}
                <span
                  style={{
                    fontWeight: "500",
                    color: theme.warning,
                    fontStyle: "normal",
                    marginLeft: "2px",
                  }}
                >
                  1 {revertPrice ? pool?.token1.symbol : pool?.token0.symbol} ={" "}
                  {price}{" "}
                  {revertPrice ? pool?.token0.symbol : pool?.token1.symbol}
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
                . You might have high impermanent loss after you add liquidity
                to this pool
              </div>
            </div>
          )}

          {position?.owner &&
            account &&
            position.owner.toLowerCase() !== account.toLowerCase() && (
              <div
                className="price-warning"
                style={{
                  backgroundColor: `${theme.warning}33`,
                  color: theme.warning,
                }}
              >
                You are not the current owner of the position #{positionId},
                please double check before proceeding
              </div>
            )}
        </div>
      </div>

      <div className="ks-lw-action">
        <button className="outline-btn" onClick={onDismiss}>
          Cancel
        </button>
        <button
          className="primary-btn"
          disabled={disabled}
          onClick={hanldeClick}
          style={
            !disabled && approvalState !== APPROVAL_STATE.NOT_APPROVED
              ? {
                  background:
                    piVeryHigh && degenMode
                      ? theme.error
                      : piHigh
                      ? theme.warning
                      : undefined,
                  border:
                    piVeryHigh && degenMode
                      ? `1px solid ${theme.error}`
                      : piHigh
                      ? theme.warning
                      : undefined,
                }
              : {}
          }
        >
          {btnText}
          {piVeryHigh && (
            <InfoHelper
              width="300px"
              text={
                degenMode
                  ? "You have turned on Degen Mode from settings. Trades with very high price impact can be executed"
                  : "To ensure you dont lose funds due to very high price impact (≥10%), swap has been disabled for this trade. If you still wish to continue, you can turn on Degen Mode from Settings."
              }
            />
          )}
        </button>
      </div>
    </>
  );
}
