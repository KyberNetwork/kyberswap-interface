import { useEffect, useRef } from 'react';

import { useDebounce } from '@kyber/hooks/use-debounce';
import { Skeleton, TokenLogo } from '@kyber/ui';
import { formatDisplayNumber, formatTokenAmount } from '@kyber/utils/number';

import { SlippageWarning } from '@/components/SlippageWarning';
import { SwapPI } from '@/components/SwapImpact';
import { MouseoverTooltip } from '@/components/Tooltip';
import { ProtocolFeeAction, ZapAction } from '@/hooks/types/zapInTypes';
import { useZapOutContext } from '@/stores';
import { RefundAction, RemoveLiquidityAction, useZapOutUserState } from '@/stores/state';
import { PI_LEVEL, formatCurrency, getPriceImpact } from '@/utils';

export function EstLiqValue() {
  const { chainId, positionId, poolAddress, poolType, pool, theme, position } = useZapOutContext(s => s);
  const { slippage, fetchingRoute, fetchZapOutRoute, route, showPreview, liquidityOut, tokenOut, mode } =
    useZapOutUserState();

  const debounceLiquidityOut = useDebounce(liquidityOut, 500);
  const abortControllerRef = useRef<AbortController>();

  const actionRefund = route?.zapDetails.actions.find(item => item.type === 'ACTION_TYPE_REFUND') as
    | RefundAction
    | undefined;

  const amountOut = BigInt(actionRefund?.refund.tokens[0].amount || 0);
  const amountOutUsd =
    mode === 'withdrawOnly'
      ? Number(route?.zapDetails.finalAmountUsd) || 0
      : Number(actionRefund?.refund.tokens[0].amountUsd || 0);

  const feeInfo = route?.zapDetails.actions.find(item => item.type === ZapAction.PROTOCOL_FEE) as
    | ProtocolFeeAction
    | undefined;

  const piRes = getPriceImpact(route?.zapDetails.priceImpact, 'Zap Impact', route?.zapDetails.suggestedSlippage || 100);

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

  const suggestedSlippage = route?.zapDetails.suggestedSlippage || 100;

  const zapFee = ((feeInfo?.protocolFee.pcm || 0) / 100_000) * 100;

  const color =
    piRes.level === PI_LEVEL.VERY_HIGH || piRes.level === PI_LEVEL.INVALID
      ? theme.error
      : piRes.level === PI_LEVEL.HIGH
        ? theme.warning
        : theme.subText;

  const actionRemoveLiq = route?.zapDetails.actions.find(item => item.type === 'ACTION_TYPE_REMOVE_LIQUIDITY') as
    | RemoveLiquidityAction
    | undefined;

  const { fees } = actionRemoveLiq?.removeLiquidity || {};

  const fee0 = pool !== 'loading' && fees?.find(f => f.address.toLowerCase() === pool.token0.address.toLowerCase());
  const fee1 = pool !== 'loading' && fees?.find(f => f.address.toLowerCase() === pool.token1.address.toLowerCase());

  const feeAmount0 = BigInt(fee0 ? fee0.amount : 0);
  const feeAmount1 = BigInt(fee1 ? fee1.amount : 0);

  const loading = position === 'loading' || pool === 'loading' || fetchingRoute;

  return (
    <div className="rounded-lg border border-stroke px-4 py-3 text-sm">
      <div className="flex items-center justify-between">
        <div>{mode === 'zapOut' ? 'Est. Received Value' : 'Est. Liquidity Value'}</div>

        {fetchingRoute ? <Skeleton className="w-6 h-3" /> : <div>{formatCurrency(amountOutUsd)}</div>}
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
                {formatTokenAmount(amountOut, tokenOut?.decimals || 18, 6)} {tokenOut?.symbol}
              </div>
            )}
          </div>

          <SlippageWarning slippage={slippage} suggestedSlippage={suggestedSlippage} showWarning={!!route} />

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
                    piRes.level === PI_LEVEL.VERY_HIGH || piRes.level === PI_LEVEL.INVALID
                      ? theme.error
                      : piRes.level === PI_LEVEL.HIGH
                        ? theme.warning
                        : theme.text,
                }}
              >
                {piRes.display}
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
                    {formatTokenAmount(feeAmount0, pool.token0.decimals, 4)}
                    <span>{pool.token0.symbol}</span>
                    {fee0 && (
                      <span className="text-xs text-subText">
                        ~
                        {formatDisplayNumber(fee0.amountUsd, {
                          style: 'currency',
                        })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <TokenLogo src={pool.token1.logo} size={16} />
                    {formatTokenAmount(feeAmount1, pool.token1.decimals, 4)}
                    <span>{pool.token1.symbol}</span>
                    {fee1 && (
                      <span className="text-xs text-subText">
                        ~
                        {formatDisplayNumber(fee1.amountUsd, {
                          style: 'currency',
                        })}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex items-start justify-between mt-2">
            <div className="text-subText text-xs ">Slippage</div>
            <span>{((slippage * 100) / 10_000).toFixed(2)}%</span>
          </div>

          <div className="flex items-start justify-between mt-2">
            <MouseoverTooltip text="Estimated network fee for your transaction." width="220px">
              <div className="text-subText text-xs border-b border-dotted border-subText">Est. Gas Fee</div>
            </MouseoverTooltip>

            <span>{route?.gasUsd ? formatDisplayNumber(route.gasUsd, { style: 'currency' }) : '--'}</span>
          </div>
        </>
      )}
    </div>
  );
}
