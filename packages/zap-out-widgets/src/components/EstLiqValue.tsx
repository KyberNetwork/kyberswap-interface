import { MouseoverTooltip } from "@/components/Tooltip";
import questionImg from "@/assets/svg/question.svg?url";
import { ProtocolFeeAction, ZapAction } from "@/hooks/types/zapInTypes";
import { useDebounce } from "@kyber/hooks/use-debounce";
import { useZapOutContext } from "@/stores";
import { RefundAction, useZapOutUserState } from "@/stores/state";
import { PI_LEVEL, formatCurrency, getPriceImpact } from "@/utils";
import { Skeleton } from "@kyber/ui/skeleton";
import { formatTokenAmount } from "@kyber/utils/number";
import { useEffect } from "react";
import { SwapPI } from "@/components/SwapImpact";
import { SlippageWarning } from "@/components/SlippageWarning";

export function EstLiqValue() {
  const { chainId, positionId, poolAddress, poolType, pool, theme } =
    useZapOutContext((s) => s);
  const {
    slippage,
    fetchingRoute,
    fetchZapOutRoute,
    route,
    showPreview,
    liquidityOut,
    tokenOut,
  } = useZapOutUserState();

  const debounceLiquidityOut = useDebounce(liquidityOut, 500);

  const actionRefund = route?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_REFUND"
  ) as RefundAction | undefined;

  const amountOut = BigInt(actionRefund?.refund.tokens[0].amount || 0);
  const amountOutUsd = Number(actionRefund?.refund.tokens[0].amountUsd || 0);

  const feeInfo = route?.zapDetails.actions.find(
    (item) => item.type === ZapAction.PROTOCOL_FEE
  ) as ProtocolFeeAction | undefined;

  const piRes = getPriceImpact(
    route?.zapDetails.priceImpact,
    "Zap Impact",
    route?.zapDetails.suggestedSlippage || 100
  );

  useEffect(() => {
    if (showPreview) return;
    fetchZapOutRoute({ chainId, positionId, poolAddress, poolType });
  }, [
    showPreview,
    pool,
    fetchZapOutRoute,
    debounceLiquidityOut,
    tokenOut?.address,
    chainId,
    positionId,
    poolAddress,
    poolType,
  ]);

  const suggestedSlippage = route?.zapDetails.suggestedSlippage || 100;

  const zapFee = ((feeInfo?.protocolFee.pcm || 0) / 100_000) * 100;

  const color =
    piRes.level === PI_LEVEL.VERY_HIGH || piRes.level === PI_LEVEL.INVALID
      ? theme.error
      : piRes.level === PI_LEVEL.HIGH
      ? theme.warning
      : theme.subText;

  return (
    <div className="rounded-lg border border-stroke px-4 py-3 text-sm">
      <div className="flex items-center justify-between">
        <div>Est. Received Value</div>

        {fetchingRoute ? (
          <Skeleton className="w-6 h-3" />
        ) : (
          <div>{formatCurrency(amountOutUsd)}</div>
        )}
      </div>

      <div className="mt-2 h-[1px] w-full bg-stroke"></div>

      <div className="flex items-center justify-between mt-2">
        <div className="text-subText text-xs ">
          Est. Received {tokenOut?.symbol}
        </div>
        {fetchingRoute || !tokenOut ? (
          <Skeleton className="w-20 h-4" />
        ) : (
          <div className="flex items-center gap-1">
            <img
              src={tokenOut?.logo}
              className="w-4 h-4 rounded-full"
              alt=""
              onError={({ currentTarget }) => {
                currentTarget.onerror = null; // prevents looping
                currentTarget.src = questionImg;
              }}
            />
            {formatTokenAmount(amountOut, tokenOut?.decimals || 18, 6)}{" "}
            {tokenOut?.symbol}
          </div>
        )}
      </div>

      <SlippageWarning
        slippage={slippage}
        suggestedSlippage={suggestedSlippage}
        showWarning={!!route}
      />

      <div className="flex items-center justify-between mt-2">
        <SwapPI />
      </div>

      <div className="flex items-center justify-between mt-2">
        <MouseoverTooltip
          text="The difference between input and estimated received (including remaining amount). Be careful with high value!"
          width="220px"
        >
          <div
            className="text-subText text-xs border-b border-dotted border-subText"
            style={
              route
                ? {
                    color,
                    borderColor: color,
                  }
                : {}
            }
          >
            Zap Impact
          </div>
        </MouseoverTooltip>
        {route ? (
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

      <div className="flex items-center justify-between mt-2">
        <MouseoverTooltip
          text={
            <div>
              Fees charged for automatically zapping into a liquidity pool. You
              still have to pay the standard gas fees.{" "}
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
          <div className="text-subText text-xs border-b border-dotted border-subText">
            Zap Fee
          </div>
        </MouseoverTooltip>
        <div>{parseFloat(zapFee.toFixed(3))}%</div>
      </div>
    </div>
  );
}
