import "./Content.scss";
import X from "../../assets/x.svg";
import ErrorIcon from "../../assets/error.svg";
import PriceInfo from "./PriceInfo";
// import LiquidityChart from "./LiquidityChart";
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
import Modal from "../Modal";
import { PI_LEVEL, getPriceImpact } from "../../utils";
import InfoHelper from "../InfoHelper";
import { parseUnits } from "viem";
import { tryParseTick } from "../../utils/pancakev3";
import { nearestUsableTick } from "@pancakeswap/v3-sdk";
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
  } = useZapState();

  const {
    pool,
    theme,
    error: loadPoolError,
    onConnectWallet,
  } = useWidgetInfo();
  const { account } = useWeb3Provider();

  let amountInWei = "0";
  try {
    amountInWei = parseUnits(
      amountIn || "0",
      tokenIn?.decimals || 0
    ).toString();
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

  const piRes = getPriceImpact(zapInfo?.zapDetails.priceImpact, theme, feeInfo);
  const swapPiRes = getPriceImpact(swapPriceImpact, theme, feeInfo);

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

  const correctPrice = (value: string, type: Type) => {
    if (!pool) return;
    if (revertPrice) {
      const defaultTick =
        (type === Type.PriceLower ? tickLower : tickUpper) || pool?.tickCurrent;
      const tick =
        tryParseTick(pool?.token1, pool?.token0, pool?.fee, value) ??
        defaultTick;
      if (Number.isInteger(tick))
        setTick(type, nearestUsableTick(tick, pool.tickSpacing));
    } else {
      const defaultTick =
        (type === Type.PriceLower ? tickLower : tickUpper) || pool?.tickCurrent;
      const tick =
        tryParseTick(pool?.token0, pool?.token1, pool?.fee, value) ??
        defaultTick;
      if (Number.isInteger(tick))
        setTick(type, nearestUsableTick(tick, pool.tickSpacing));
    }
  };
  const currentPoolPrice = pool
    ? revertPrice
      ? pool.priceOf(pool.token1)
      : pool.priceOf(pool.token0)
    : undefined;

  const selectPriceRange = (percent: number) => {
    if (!currentPoolPrice) return;
    const left = +currentPoolPrice.toSignificant(18) * (1 - percent);
    const right = +currentPoolPrice.toSignificant(18) * (1 + percent);
    correctPrice(left.toString(), Type.PriceLower);
    correctPrice(right.toString(), Type.PriceUpper);
  };

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
          <LiquidityToAdd />

          <div className="label" style={{ marginTop: "1.5rem" }}>
            Set price ranges
          </div>

          <div className="ks-lw-card">
            <PriceInfo />

            <div className="price-input-group">
              <PriceInput type={Type.PriceLower} />
              <PriceInput type={Type.PriceUpper} />
            </div>

            {positionId === undefined && (
              <div className="price-input-preset">
                <button
                  className="outline-btn"
                  onClick={() => selectPriceRange(0.1)}
                >
                  10%
                </button>
                <button
                  className="outline-btn"
                  onClick={() => selectPriceRange(0.2)}
                >
                  20%
                </button>
                <button
                  className="outline-btn"
                  onClick={() => selectPriceRange(0.75)}
                >
                  75%
                </button>
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
              </div>
            )}
          </div>
        </div>

        <div className="right">
          <ZapRoute />
          <EstLiqValue />
        </div>
      </div>

      <div className="ks-lw-action">
        <button className="outline-btn" onClick={onDismiss}>
          Cancel
        </button>

        {!account ? (
          <button className="primary-btn" onClick={onConnectWallet}>
            Connect Wallet
          </button>
        ) : (
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
                color={theme.textReverse}
                text={
                  degenMode
                    ? "You have turned on Degen Mode from settings. Trades with very high price impact can be executed"
                    : "To ensure you dont lose funds due to very high price impact (≥10%), swap has been disabled for this trade. If you still wish to continue, you can turn on Degen Mode from Settings."
                }
              />
            )}
          </button>
        )}
      </div>
    </>
  );
}
