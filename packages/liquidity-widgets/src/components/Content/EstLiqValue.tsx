import { BigNumber } from "ethers";
import { useWidgetInfo } from "../../hooks/useWidgetInfo";
import {
  AddLiquidityAction,
  AggregatorSwapAction,
  PartnerFeeAction,
  PoolSwapAction,
  ProtocolFeeAction,
  RefundAction,
  useZapState,
} from "../../hooks/useZapInState";
import {
  PI_LEVEL,
  formatCurrency,
  formatNumber,
  formatWei,
  getPriceImpact,
} from "../../utils";
import InfoHelper from "../InfoHelper";
import { formatUnits } from "ethers/lib/utils";
import { MouseoverTooltip } from "../Tooltip";

export default function EstLiqValue() {
  const { zapInfo, source } = useZapState();
  const { pool, theme, position } = useWidgetInfo();

  const addLiquidityInfo = zapInfo?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_ADD_LIQUIDITY"
  ) as AddLiquidityAction | undefined;
  const addedAmount0 = formatUnits(
    addLiquidityInfo?.addLiquidity.token0.amount || "0",
    pool?.token0.decimals
  );
  const addedAmount1 = formatUnits(
    addLiquidityInfo?.addLiquidity.token1.amount || "0",
    pool?.token1.decimals
  );

  const refundInfo = zapInfo?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_REFUND"
  ) as RefundAction | null;
  const refundToken0 =
    refundInfo?.refund.tokens.filter(
      (item) =>
        item.address.toLowerCase() === pool?.token0.address.toLowerCase()
    ) || [];
  const refundToken1 =
    refundInfo?.refund.tokens.filter(
      (item) =>
        item.address.toLowerCase() === pool?.token1.address.toLowerCase()
    ) || [];

  const refundAmount0 = formatWei(
    refundToken0
      .reduce(
        (acc, cur) => acc.add(BigNumber.from(cur.amount)),
        BigNumber.from("0")
      )
      .toString(),
    pool?.token0.decimals
  );

  const refundAmount1 = formatWei(
    refundToken1
      .reduce(
        (acc, cur) => acc.add(BigNumber.from(cur.amount)),
        BigNumber.from("0")
      )
      .toString(),
    pool?.token1.decimals
  );

  const refundUsd =
    refundInfo?.refund.tokens.reduce((acc, cur) => acc + +cur.amountUsd, 0) ||
    0;

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
  const totalSwapIn = (swapAmountIn || 0) + amountInPoolSwap;
  const totalSwapOut = (swapAmountOut || 0) + amountOutPoolSwap;
  const swapPriceImpact = ((totalSwapIn - totalSwapOut) / totalSwapIn) * 100;

  const feeInfo = zapInfo?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_PROTOCOL_FEE"
  ) as ProtocolFeeAction | undefined;

  const partnerFeeInfo = zapInfo?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_PARTNER_FEE"
  ) as PartnerFeeAction | undefined;

  const protocolFee = ((feeInfo?.protocolFee.pcm || 0) / 100_000) * 100;
  const partnerFee = ((partnerFeeInfo?.partnerFee.pcm || 0) / 100_000) * 100;

  const piRes = getPriceImpact(zapInfo?.zapDetails.priceImpact, feeInfo);
  const swapPiRes = getPriceImpact(swapPriceImpact, feeInfo);

  const positionAmount0Usd =
    (+(position?.amount0 || 0) *
      +(addLiquidityInfo?.addLiquidity.token0.amountUsd || 0)) /
      +addedAmount0 || 0;

  const positionAmount1Usd =
    (+(position?.amount1 || 0) *
      +(addLiquidityInfo?.addLiquidity.token1.amountUsd || 0)) /
      +addedAmount1 || 0;

  const addedAmountUsd =
    +(zapInfo?.positionDetails.addedAmountUsd || 0) +
      positionAmount0Usd +
      positionAmount1Usd || 0;

  return (
    <>
      <div className="zap-route est-liq-val">
        <div className="title">
          Est. Liquidity Value
          {!!addedAmountUsd && <span>{formatCurrency(addedAmountUsd)}</span>}
        </div>
        <div className="divider"></div>

        <div className="detail-row">
          <div className="label">Est. Pooled {pool?.token0.symbol}</div>
          {zapInfo ? (
            <div>
              <div className="token-amount">
                {pool?.token0?.logoURI && (
                  <img
                    src={pool.token0.logoURI}
                    width="14px"
                    style={{ marginTop: "2px", borderRadius: "50%" }}
                  />
                )}
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
              {position && (
                <div style={{ textAlign: "end" }}>
                  + {formatNumber(+addedAmount0)} {pool?.token0.symbol}
                </div>
              )}

              <div className="label" style={{ marginLeft: "auto" }}>
                ~
                {formatCurrency(
                  +(addLiquidityInfo?.addLiquidity.token0.amountUsd || 0) +
                    positionAmount0Usd
                )}
              </div>
            </div>
          ) : (
            "--"
          )}
        </div>

        <div className="detail-row">
          <div className="label">Est. Pooled {pool?.token1.symbol}</div>
          {zapInfo ? (
            <div>
              <div className="token-amount">
                {pool?.token1?.logoURI && (
                  <img
                    src={pool?.token1?.logoURI}
                    width="14px"
                    style={{ marginTop: "2px", borderRadius: "50%" }}
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

              <div className="label" style={{ marginLeft: "auto" }}>
                ~
                {formatCurrency(
                  +(addLiquidityInfo?.addLiquidity.token1.amountUsd || 0) +
                    positionAmount1Usd
                )}
              </div>
            </div>
          ) : (
            "--"
          )}
        </div>

        <div className="detail-row">
          <MouseoverTooltip
            text="Based on your price range settings, a portion of your liquidity will be automatically zapped into the pool, while the remaining amount will stay in your wallet."
            width="220px"
          >
            <div className="label underline">Est. Remaining Value</div>
          </MouseoverTooltip>

          <div>
            {formatCurrency(refundUsd)}
            <InfoHelper
              text={
                <div>
                  <div>
                    {refundAmount0} {pool?.token0.symbol}{" "}
                  </div>
                  <div>
                    {refundAmount1} {pool?.token1.symbol}
                  </div>
                </div>
              }
            />
          </div>
        </div>

        <div className="detail-row">
          <MouseoverTooltip
            text="Estimated change in price due to the size of your transaction. Applied to the Swap steps."
            width="220px"
          >
            <div className="label underline">Swap Price Impact</div>
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

        <div className="detail-row">
          <MouseoverTooltip
            text="The difference between input and estimated liquidity received (including remaining amount). Be careful with high value!"
            width="220px"
          >
            <div className="label underline">Zap Impact</div>
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

        <div className="detail-row">
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
            <div className="label underline">Zap Fee</div>
          </MouseoverTooltip>

          <MouseoverTooltip
            text={
              partnerFee
                ? `${parseFloat(
                    protocolFee.toFixed(3)
                  )}% Protocol Fee + ${parseFloat(
                    partnerFee.toFixed(3)
                  )}% Fee for ${source}`
                : ""
            }
          >
            <div className="underline">
              {feeInfo
                ? parseFloat((protocolFee + partnerFee).toFixed(3)) + "%"
                : "--"}
            </div>
          </MouseoverTooltip>
        </div>
      </div>

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
    </>
  );
}
