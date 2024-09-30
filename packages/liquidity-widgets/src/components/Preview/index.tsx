import Info from "../../assets/info.svg";
import DropdownIcon from "../../assets/dropdown.svg";
import Spinner from "../../assets/loader.svg";
import SwitchIcon from "../../assets/switch.svg";
import SuccessIcon from "../../assets/success.svg";
import ErrorIcon from "../../assets/error.svg";
import "./Preview.scss";

import {
  AddLiquidityAction,
  AggregatorSwapAction,
  PoolSwapAction,
  ProtocolFeeAction,
  RefundAction,
  ZAP_URL,
  ZapRouteDetail,
  chainIdToChain,
  useZapState,
} from "../../hooks/useZapInState";
import { NetworkInfo, UNI_V3_BPS } from "../../constants";
import { useWeb3Provider } from "../../hooks/useProvider";
import {
  PI_LEVEL,
  formatCurrency,
  formatNumber,
  formatWei,
  friendlyError,
  getDexLogo,
  getDexName,
  getPriceImpact,
  getWarningThreshold,
} from "../../utils";
import { useEffect, useState } from "react";
import { BigNumber } from "ethers";
import { PoolAdapter, Token, Price } from "../../entities/Pool";
import { useWidgetInfo } from "../../hooks/useWidgetInfo";
import InfoHelper from "../InfoHelper";
import { MouseoverTooltip } from "../Tooltip";
import { formatUnits } from "ethers/lib/utils";

export interface ZapState {
  pool: PoolAdapter;
  zapInfo: ZapRouteDetail;
  tokenIn: Token;
  amountIn: string;
  priceLower: Price;
  priceUpper: Price;
  deadline: number;
  isFullRange: boolean;
  slippage: number;
  tickLower: number;
  tickUpper: number;
}

export interface PreviewProps {
  zapState: ZapState;
  onDismiss: () => void;
  onTxSubmit?: (tx: string) => void;
}

function calculateGasMargin(value: BigNumber): BigNumber {
  const defaultGasLimitMargin = BigNumber.from(20_000);
  const gasMargin = value.mul(BigNumber.from(2000)).div(BigNumber.from(10000));

  return gasMargin.gte(defaultGasLimitMargin)
    ? value.add(gasMargin)
    : value.add(defaultGasLimitMargin);
}

export default function Preview({
  zapState: {
    pool,
    zapInfo,
    tokenIn,
    amountIn,
    priceLower,
    priceUpper,
    deadline,
    slippage,
    tickLower,
    tickUpper,
  },
  onDismiss,
  onTxSubmit,
}: PreviewProps) {
  const { chainId, account, provider } = useWeb3Provider();
  const { poolType, positionId, theme, position } = useWidgetInfo();
  const { source, revertPrice: revert, toggleRevertPrice } = useZapState();

  const [txHash, setTxHash] = useState("");
  const [attempTx, setAttempTx] = useState(false);
  const [txError, setTxError] = useState<Error | null>(null);
  const [txStatus, setTxStatus] = useState<"success" | "failed" | "">("");
  const [showErrorDetail, setShowErrorDetail] = useState(false);

  useEffect(() => {
    if (txHash) {
      const i = setInterval(() => {
        provider?.getTransactionReceipt(txHash).then((res) => {
          if (!res) return;

          if (res.status) {
            setTxStatus("success");
          } else setTxStatus("failed");
        });
      }, 10_000);

      return () => {
        clearInterval(i);
      };
    }
  }, [txHash, provider]);

  const addedLiqInfo = zapInfo.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_ADD_LIQUIDITY"
  ) as AddLiquidityAction;
  const addedAmount0 = formatUnits(
    addedLiqInfo?.addLiquidity.token0.amount,
    pool.token0.decimals
  );
  const addedAmount1 = formatUnits(
    addedLiqInfo?.addLiquidity.token1.amount,
    pool.token1.decimals
  );

  const positionAmount0Usd =
    (+(position?.amount0 || 0) *
      +(addedLiqInfo?.addLiquidity.token0.amountUsd || 0)) /
      +addedAmount0 || 0;

  const positionAmount1Usd =
    (+(position?.amount1 || 0) *
      +(addedLiqInfo?.addLiquidity.token1.amountUsd || 0)) /
      +addedAmount1 || 0;

  const refundInfo = zapInfo.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_REFUND"
  ) as RefundAction | null;
  const refundToken0 =
    refundInfo?.refund.tokens.filter(
      (item) => item.address.toLowerCase() === pool.token0.address.toLowerCase()
    ) || [];
  const refundToken1 =
    refundInfo?.refund.tokens.filter(
      (item) => item.address.toLowerCase() === pool.token1.address.toLowerCase()
    ) || [];

  const refundAmount0 = formatWei(
    refundToken0
      .reduce(
        (acc, cur) => acc.add(BigNumber.from(cur.amount)),
        BigNumber.from("0")
      )
      .toString(),
    pool.token0.decimals
  );

  const refundAmount1 = formatWei(
    refundToken1
      .reduce(
        (acc, cur) => acc.add(BigNumber.from(cur.amount)),
        BigNumber.from("0")
      )
      .toString(),
    pool.token1.decimals
  );

  const refundUsd =
    refundInfo?.refund.tokens.reduce((acc, cur) => acc + +cur.amountUsd, 0) ||
    0;

  const price = pool
    ? (revert
        ? pool.priceOf(pool.token1)
        : pool.priceOf(pool.token0)
      ).toSignificant(6)
    : "--";

  const leftPrice = !revert ? priceLower : priceUpper?.invert();
  const rightPrice = !revert ? priceUpper : priceLower?.invert();

  const quote = (
    <span>
      {revert
        ? `${pool?.token0.symbol} per ${pool?.token1.symbol}`
        : `${pool?.token1.symbol} per ${pool?.token0.symbol}`}
    </span>
  );

  const feeInfo = zapInfo.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_PROTOCOL_FEE"
  ) as ProtocolFeeAction | undefined;

  const zapFee = ((feeInfo?.protocolFee.pcm || 0) / 100_000) * 100;

  const aggregatorSwapInfo = zapInfo.zapDetails.actions.find(
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
  const totalSwapIn = (swapAmountIn || 0) + amountInPoolSwap;
  const totalSwapOut = (swapAmountOut || 0) + amountOutPoolSwap;
  const swapPriceImpact = ((totalSwapIn - totalSwapOut) / totalSwapIn) * 100;

  const piRes = getPriceImpact(zapInfo?.zapDetails.priceImpact, feeInfo);
  const swapPiRes = getPriceImpact(swapPriceImpact, feeInfo);

  const piVeryHigh =
    (zapInfo && [PI_LEVEL.VERY_HIGH, PI_LEVEL.INVALID].includes(piRes.level)) ||
    (!!aggregatorSwapInfo &&
      [PI_LEVEL.VERY_HIGH, PI_LEVEL.INVALID].includes(swapPiRes.level));

  const piHigh =
    (zapInfo && piRes.level === PI_LEVEL.HIGH) ||
    (!!aggregatorSwapInfo && swapPiRes.level === PI_LEVEL.HIGH);

  const [gasUsd, setGasUsd] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${ZAP_URL}/${chainIdToChain[chainId]}/api/v1/in/route/build`, {
      method: "POST",
      body: JSON.stringify({
        sender: account,
        recipient: account,
        route: zapInfo.route,
        deadline,
        source,
      }),
    })
      .then((res) => res.json())
      .then(async (res) => {
        const { data } = res || {};
        if (data.callData) {
          const txData = {
            from: account,
            to: data.routerAddress,
            data: data.callData,
            value: data.value,
          };

          try {
            const [estimateGas, priceRes, gasPrice] = await Promise.all([
              provider.getSigner().estimateGas(txData),
              fetch(
                `https://price.kyberswap.com/${chainIdToChain[chainId]}/api/v1/prices?ids=${NetworkInfo[chainId].wrappedToken.address}`
              )
                .then((res) => res.json())
                .then((res) => res.data.prices[0]),
              provider.getGasPrice(),
            ]);
            const price = priceRes?.marketPrice || priceRes?.price || 0;

            const gasUsd =
              +formatUnits(gasPrice) * +estimateGas.toString() * price;

            setGasUsd(gasUsd);
          } catch (e) {
            console.log("Estimate gas failed", e);
          }
        }
      });
  }, [account, chainId, deadline, provider, source, zapInfo.route]);

  const handleClick = async () => {
    setAttempTx(true);
    setTxHash("");
    setTxError(null);

    fetch(`${ZAP_URL}/${chainIdToChain[chainId]}/api/v1/in/route/build`, {
      method: "POST",
      body: JSON.stringify({
        sender: account,
        recipient: account,
        route: zapInfo.route,
        deadline,
        source: "zap-widget",
      }),
    })
      .then((res) => res.json())
      .then(async (res) => {
        const { data } = res || {};
        if (data.callData) {
          const txData = {
            from: account,
            to: data.routerAddress,
            data: data.callData,
            value: data.value,
          };

          try {
            const estimateGas = await provider.getSigner().estimateGas(txData);
            const txReceipt = await provider.getSigner().sendTransaction({
              ...txData,
              gasLimit: calculateGasMargin(estimateGas),
            });
            setTxHash(txReceipt.hash);
            onTxSubmit?.(txReceipt.hash);
          } catch (e) {
            setAttempTx(false);
            setTxError(e as Error);
          }
        }
      })
      .finally(() => setAttempTx(false));
  };

  const warningThreshold =
    ((feeInfo ? getWarningThreshold(feeInfo) : 1) / 100) * 10_000;

  if (attempTx || txHash) {
    let txStatusText = "";
    if (txHash) {
      if (txStatus === "success") txStatusText = "Transaction successful";
      else if (txStatus === "failed") txStatusText = "Transaction failed";
      else txStatusText = "Processing transaction";
    } else {
      txStatusText = "Waiting For Confirmation";
    }

    return (
      <div className="ks-lw-confirming">
        <div className="loading-area">
          {txStatus === "success" ? (
            <SuccessIcon className="success-icon" />
          ) : txStatus === "failed" ? (
            <ErrorIcon className="error-icon" />
          ) : (
            <Spinner className="spinner" />
          )}
          <div>{txStatusText}</div>

          {!txHash && (
            <div className="subText" style={{ textAlign: "center" }}>
              Confirm this transaction in your wallet - Zapping{" "}
              {formatNumber(+amountIn)} {tokenIn.symbol} into{" "}
              {positionId
                ? `Position #${positionId}`
                : `${getDexName(poolType)} ${pool.token0.symbol}/${
                    pool.token1.symbol
                  } ${(pool.fee / 10_000) * 100}`}
            </div>
          )}
          {txHash && txStatus === "" && (
            <div className="subText">
              Waiting for the transaction to be mined
            </div>
          )}
        </div>

        <div className="divider" />
        {txHash && (
          <a
            className="view-tx"
            href={`${NetworkInfo[chainId].scanLink}/tx/${txHash}`}
            target="_blank"
            rel="noopener norefferer"
          >
            View transaction ↗
          </a>
        )}
        <button
          className="primary-btn"
          style={{ width: "100%" }}
          onClick={onDismiss}
        >
          Close
        </button>
      </div>
    );
  }

  if (txError) {
    return (
      <div className="ks-lw-confirming">
        <div className="loading-area">
          <ErrorIcon className="error-icon" />
          <div>{friendlyError(txError)}</div>
        </div>

        <div style={{ width: "100%" }}>
          <div className="divider" />
          <div
            className="error-detail"
            role="button"
            onClick={() => setShowErrorDetail((prev) => !prev)}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "14px",
              }}
            >
              <Info />
              Error details
            </div>
            <DropdownIcon
              style={{
                transform: `rotate(${!showErrorDetail ? "0" : "-180deg"})`,
                transition: `all 0.2s ease`,
              }}
            />
          </div>
          <div className="divider" />

          <div className={`error-msg ${showErrorDetail ? "error-open" : ""}`}>
            {txError?.message || JSON.stringify(txError)}
          </div>
        </div>

        <button
          className="primary-btn"
          style={{ width: "100%" }}
          onClick={onDismiss}
        >
          {txError ? "Dismiss" : "Close"}
        </button>
      </div>
    );
  }

  return (
    <div className="ks-lw-preview">
      <div className="title">
        <div className="logo">
          <img
            src={(pool.token0 as Token).logoURI}
            alt=""
            width="36px"
            height="36px"
            style={{ borderRadius: "50%" }}
          />
          <img
            src={(pool.token1 as Token).logoURI}
            alt=""
            width="36px"
            height="36px"
            style={{ borderRadius: "50%" }}
          />

          <img
            className="network-logo"
            src={NetworkInfo[chainId].logo}
            width="18px"
            height="18px"
          />
        </div>

        <div>
          <div>
            {pool.token0.symbol}/{pool.token1.symbol}{" "}
            {positionId !== undefined && (
              <span style={{ color: "var(--ks-lw-accent)" }}>
                #{positionId}
              </span>
            )}
          </div>
          <div className="pool-info">
            <div className="tag tag-primary">Fee {pool.fee / UNI_V3_BPS}%</div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <img src={getDexLogo(poolType)} width={16} height={16} alt="" />
              <div>{getDexName(poolType)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <div className="card-title">Zap-in Amount</div>
        <div className="row" style={{ marginTop: "8px" }}>
          <img
            src={tokenIn.logoURI}
            alt=""
            width="20px"
            style={{ borderRadius: "50%" }}
          />

          <div>
            {formatNumber(+amountIn)} {tokenIn.symbol}{" "}
            <span className="est-usd">
              ~{formatCurrency(+zapInfo.zapDetails.initialAmountUsd)}
            </span>
          </div>
        </div>
      </div>

      <div
        className="card card-outline"
        style={{ marginTop: "1rem", fontSize: "14px" }}
      >
        <div className="row-between">
          <div className="card-title">Current pool price</div>
          <div className="row">
            <span>{price}</span>
            {quote}
            <SwitchIcon
              style={{ cursor: "pointer" }}
              onClick={() => toggleRevertPrice()}
              role="button"
            />
          </div>
        </div>

        <div className="row-between" style={{ marginTop: "8px" }}>
          <div className="card flex-col" style={{ flex: 1, width: "50%" }}>
            <div className="card-title">Min Price</div>
            <div
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                width: "100%",
                textAlign: "center",
              }}
            >
              {(
                revert ? tickUpper === pool.maxTick : tickLower === pool.minTick
              )
                ? "0"
                : leftPrice?.toSignificant(6)}
            </div>
            <div className="card-title">{quote}</div>
          </div>
          <div className="card flex-col" style={{ flex: 1, width: "50%" }}>
            <div className="card-title">Max Price</div>
            <div
              style={{
                textAlign: "center",
                width: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {(
                !revert
                  ? tickUpper === pool.maxTick
                  : tickLower === pool.minTick
              )
                ? "∞"
                : rightPrice?.toSignificant(6)}
            </div>
            <div className="card-title">{quote}</div>
          </div>
        </div>
      </div>

      <div className="flex-col" style={{ gap: "12px", marginTop: "1rem" }}>
        <div className="row-between" style={{ alignItems: "flex-start" }}>
          <div className="summary-title">Est. Pooled {pool.token0.symbol}</div>
          <div>
            <div style={{ display: "flex", gap: "4px" }}>
              {pool?.token0?.logoURI && (
                <img
                  src={pool.token0.logoURI}
                  width="16px"
                  height="16px"
                  style={{ marginTop: "4px", borderRadius: "50%" }}
                />
              )}
              <div>
                {position ? (
                  <div style={{ textAlign: "end" }}>
                    {formatNumber(+position.amount0)} {pool?.token0.symbol}
                  </div>
                ) : (
                  <div style={{ textAlign: "end" }}>
                    {formatNumber(+addedAmount0)} {pool?.token0.symbol}
                  </div>
                )}
              </div>
            </div>

            {position && (
              <div style={{ textAlign: "end" }}>
                + {formatNumber(+addedAmount0)} {pool?.token0.symbol}
              </div>
            )}
            <div
              style={{
                marginLeft: "auto",
                width: "fit-content",
                color: theme.subText,
              }}
            >
              ~
              {formatCurrency(
                +(addedLiqInfo?.addLiquidity.token0.amountUsd || 0) +
                  positionAmount0Usd
              )}
            </div>
          </div>
        </div>
        <div className="row-between" style={{ alignItems: "flex-start" }}>
          <div className="summary-title">Est. Pooled {pool.token1.symbol}</div>
          <div>
            <div
              style={{
                display: "flex",
                gap: "4px",
                justifyContent: "flex-end",
              }}
            >
              {pool?.token1?.logoURI && (
                <img
                  src={pool.token1.logoURI}
                  width="16px"
                  height="16px"
                  style={{ marginTop: "4px", borderRadius: "50%" }}
                />
              )}
              {position ? (
                <div style={{ textAlign: "end" }}>
                  {formatNumber(+position.amount1)} {pool?.token1.symbol}
                </div>
              ) : (
                <div style={{ textAlign: "end" }}>
                  {formatNumber(+addedAmount1)} {pool?.token1.symbol}
                </div>
              )}
            </div>
            {position && (
              <div style={{ textAlign: "end" }}>
                + {formatNumber(+addedAmount1)} {pool?.token1.symbol}
              </div>
            )}
            <div
              style={{
                marginLeft: "auto",
                width: "fit-content",
                color: theme.subText,
              }}
            >
              ~
              {formatCurrency(
                +(addedLiqInfo?.addLiquidity.token1.amountUsd || 0) +
                  positionAmount1Usd
              )}
            </div>
          </div>
        </div>

        <div className="row-between">
          <MouseoverTooltip
            text="Based on your price range settings, a portion of your liquidity will be automatically zapped into the pool, while the remaining amount will stay in your wallet."
            width="220px"
          >
            <div className="summary-title underline">Est. Remaining Value</div>
          </MouseoverTooltip>
          <span className="summary-value">
            {formatCurrency(refundUsd)}
            <InfoHelper
              text={
                <div>
                  <div>
                    {refundAmount0} {pool.token0.symbol}{" "}
                  </div>
                  <div>
                    {refundAmount1} {pool.token1.symbol}
                  </div>
                </div>
              }
            />
          </span>
        </div>

        <div className="row-between">
          <MouseoverTooltip
            text="Applied to each zap step. Setting a high slippage tolerance can help transactions succeed, but you may not get such a good price. Please use with caution!"
            width="220px"
          >
            <div className="summary-title underline">Max Slippage</div>
          </MouseoverTooltip>
          <span
            className="summary-value"
            style={{
              color: slippage > warningThreshold ? theme.warning : theme.text,
            }}
          >
            {((slippage * 100) / 10_000).toFixed(2)}%
          </span>
        </div>

        <div className="row-between">
          <MouseoverTooltip
            text="Estimated change in price due to the size of your transaction. Applied to the Swap steps."
            width="220px"
          >
            <div className="summary-title underline">Swap price impact</div>
          </MouseoverTooltip>
          {aggregatorSwapInfo || poolSwapInfo ? (
            <div
              style={{
                color:
                  swapPiRes.level === PI_LEVEL.VERY_HIGH ||
                  swapPiRes.level === PI_LEVEL.INVALID
                    ? theme.error
                    : swapPiRes.level === PI_LEVEL.HIGH
                    ? theme.warning
                    : theme.text,
              }}
            >
              {swapPiRes.display}
            </div>
          ) : (
            "--"
          )}
        </div>

        <div className="row-between">
          <MouseoverTooltip
            text="The difference between input and estimated liquidity received (including remaining amount). Be careful with high value!"
            width="220px"
          >
            <div className="summary-title underline">Zap impact</div>
          </MouseoverTooltip>
          {zapInfo ? (
            <div
              style={{
                color:
                  piRes.level === PI_LEVEL.VERY_HIGH ||
                  piRes.level === PI_LEVEL.INVALID
                    ? theme.error
                    : piRes.level === PI_LEVEL.HIGH
                    ? theme.warning
                    : theme.text,
              }}
            >
              {piRes.display}
            </div>
          ) : (
            "--"
          )}
        </div>

        <div className="row-between">
          <MouseoverTooltip
            text="Estimated network fee for your transaction."
            width="220px"
          >
            <div className="summary-title underline">Est. Gas Fee</div>
          </MouseoverTooltip>
          {gasUsd ? formatCurrency(gasUsd) : "--"}
        </div>

        <div className="row-between">
          <MouseoverTooltip
            text={
              <div>
                Fees charged for automatically zapping into a liquidity pool.
                You still have to pay the standard gas fees.{" "}
                <a
                  style={{ color: theme.accent }}
                  href="https://docs.kyberswap.com/kyberswap-solutions/kyberswap-zap-as-a-service/zap-fee-model"
                  target="_blank"
                  rel="noopener norefferer"
                >
                  More details.
                </a>
              </div>
            }
            width="220px"
          >
            <div className="summary-title underline">Zap Fee</div>
          </MouseoverTooltip>
          {parseFloat(zapFee.toFixed(3))}%
        </div>
      </div>

      {slippage > warningThreshold && (
        <div
          className="warning-msg"
          style={{
            backgroundColor: theme.warning + "33",
            color: theme.warning,
          }}
        >
          Slippage is high, your transaction might be front-run!
        </div>
      )}

      {aggregatorSwapInfo && swapPiRes.level !== PI_LEVEL.NORMAL && (
        <div
          className="warning-msg"
          style={{
            backgroundColor:
              swapPiRes.level === PI_LEVEL.HIGH
                ? `${theme.warning}33`
                : `${theme.error}33`,
            color:
              swapPiRes.level === PI_LEVEL.HIGH ? theme.warning : theme.error,
          }}
        >
          Swap {swapPiRes.msg}
        </div>
      )}

      {zapInfo && piRes.level !== PI_LEVEL.NORMAL && (
        <div
          className="warning-msg"
          style={{
            backgroundColor:
              piRes.level === PI_LEVEL.HIGH
                ? `${theme.warning}33`
                : `${theme.error}33`,
            color: piRes.level === PI_LEVEL.HIGH ? theme.warning : theme.error,
          }}
        >
          {piRes.msg}
        </div>
      )}

      <button
        className="primary-btn"
        onClick={handleClick}
        style={{
          marginTop: "1rem",
          width: "100%",
          background: piVeryHigh
            ? theme.error
            : piHigh
            ? theme.warning
            : undefined,
          border: piVeryHigh
            ? `1px solid ${theme.error}`
            : piHigh
            ? theme.warning
            : undefined,
        }}
      >
        {positionId ? "Increase" : "Add"} Liquidity
      </button>
    </div>
  );
}
