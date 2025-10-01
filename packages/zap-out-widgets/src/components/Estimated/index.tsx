import { useEffect, useRef } from 'react';

import { useDebounce } from '@kyber/hooks/use-debounce';
import { MouseoverTooltip, Skeleton, TokenLogo } from '@kyber/ui';
import { PI_LEVEL } from '@kyber/utils';
import { formatCurrency, formatDisplayNumber, formatTokenAmount } from '@kyber/utils/number';

import SlippageRow from '@/components/Estimated/SlippageRow';
import useZapRoute from '@/hooks/useZapRoute';
import { useZapOutContext } from '@/stores';
import { useZapOutUserState } from '@/stores/state';

export default function Estimated() {
  const { chainId, positionId, poolAddress, poolType, pool, theme, position } = useZapOutContext(s => s);
  const { slippage, fetchingRoute, fetchZapOutRoute, route, showPreview, liquidityOut, tokenOut, mode } =
    useZapOutUserState();
  const { refund, finalAmountUsd, zapImpact, zapFee, suggestedSlippage, gasUsd, earnedFee } = useZapRoute();
  const { earnedFee0, earnedFee1, feeValue0, feeValue1 } = earnedFee;

  const debounceLiquidityOut = useDebounce(liquidityOut, 500);
  const abortControllerRef = useRef<AbortController>();

  useEffect(() => {
    if (showPreview) return;

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    fetchZapOutRoute({
      chainId,
      positionId,
      poolAddress,
      poolType,
      signal: abortController.signal,
    });

    return () => {
      abortController.abort();
    };
  }, [
    mode,
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

  const color =
    zapImpact.level === PI_LEVEL.VERY_HIGH || zapImpact.level === PI_LEVEL.INVALID
      ? theme.error
      : zapImpact.level === PI_LEVEL.HIGH
        ? theme.warning
        : theme.subText;

  const loading = !position || !pool || fetchingRoute;

  return (
    <div className="rounded-lg border border-stroke px-4 py-3 text-sm">
      <div className="flex items-center justify-between">
        <div>{mode === 'zapOut' ? 'Est. Received Value' : 'Est. Liquidity Value'}</div>

        {fetchingRoute ? (
          <Skeleton className="w-6 h-3" />
        ) : (
          <div>{formatCurrency(mode === 'withdrawOnly' ? finalAmountUsd : refund.value)}</div>
        )}
      </div>

      <div className="mt-2 h-[1px] w-full bg-stroke"></div>

      {mode === 'zapOut' && (
        <>
          <div className="flex items-center justify-between mt-2">
            <div className="text-subText text-xs ">Est. Received {tokenOut?.symbol}</div>
            {fetchingRoute || !tokenOut ? (
              <Skeleton className="w-20 h-4" />
            ) : (
              <div className="flex items-center gap-1">
                <TokenLogo src={tokenOut?.logo} size={16} />
                {refund.refunds[0]?.amount || 0} {tokenOut?.symbol}
              </div>
            )}
          </div>

          <SlippageRow suggestedSlippage={suggestedSlippage} />

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
                    zapImpact.level === PI_LEVEL.VERY_HIGH || zapImpact.level === PI_LEVEL.INVALID
                      ? theme.error
                      : zapImpact.level === PI_LEVEL.HIGH
                        ? theme.warning
                        : theme.text,
                }}
              >
                {zapImpact.display}
              </div>
            ) : (
              '--'
            )}
          </div>

          <div className="flex items-center justify-between mt-2">
            <MouseoverTooltip
              text={
                <div>
                  Fees charged for automatically zapping into a liquidity pool. You still have to pay the standard gas
                  fees.{' '}
                  <a
                    style={{ color: theme.accent }}
                    href="https://docs.kyberswap.com/kyberswap-solutions/kyberswap-zap-as-a-service/zap-fee-model"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    More details.
                  </a>
                </div>
              }
              width="220px"
            >
              <div className="text-subText text-xs border-b border-dotted border-subText">Zap Fee</div>
            </MouseoverTooltip>
            <div>{parseFloat(zapFee.toFixed(3))}%</div>
          </div>
        </>
      )}

      {mode === 'withdrawOnly' && (
        <>
          <div className="flex items-start justify-between mt-2">
            <div className="text-subText text-xs ">Collecting Fees</div>

            <div className="flex justify-end flex-col items-end">
              {loading ? (
                <Skeleton className="h-5 w-20" />
              ) : (
                <>
                  <div className="flex items-center gap-1">
                    <TokenLogo src={pool.token0.logo} size={16} />
                    {formatTokenAmount(earnedFee0, pool.token0.decimals, 4)}
                    <span>{pool.token0.symbol}</span>
                    <span className="text-xs text-subText">
                      ~
                      {formatDisplayNumber(feeValue0, {
                        style: 'currency',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <TokenLogo src={pool.token1.logo} size={16} />
                    {formatTokenAmount(earnedFee1, pool.token1.decimals, 4)}
                    <span>{pool.token1.symbol}</span>
                    <span className="text-xs text-subText">
                      ~
                      {formatDisplayNumber(feeValue1, {
                        style: 'currency',
                      })}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex items-start justify-between mt-2">
            <div className="text-subText text-xs ">Slippage</div>
            <span>{slippage ? (((slippage || 0) * 100) / 10_000).toFixed(2) + '%' : '--'}</span>
          </div>

          <div className="flex items-start justify-between mt-2">
            <MouseoverTooltip text="Estimated network fee for your transaction." width="220px">
              <div className="text-subText text-xs border-b border-dotted border-subText">Est. Gas Fee</div>
            </MouseoverTooltip>

            <span>{route ? formatDisplayNumber(gasUsd, { style: 'currency' }) : '--'}</span>
          </div>
        </>
      )}
    </div>
  );
}
