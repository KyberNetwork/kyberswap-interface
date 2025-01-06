import { DexInfos, NetworkInfo } from "@/constants";
import { PoolSwapAction, ZapAction } from "@/hooks/types/zapInTypes";
import { Token } from "@/schema";
import { useZapOutContext } from "@/stores/zapout";
import {
  AggregatorSwapAction,
  RefundAction,
  RemoveLiquidityAction,
  useZapOutUserState,
} from "@/stores/zapout/zapout-state";
import { formatUnits } from "@kyber/utils/crypto";
import { formatDisplayNumber, formatTokenAmount } from "@kyber/utils/number";
import { useMemo } from "react";

export function ZapSummary() {
  const { pool, chainId, poolType } = useZapOutContext((s) => s);
  const { route, tokenOut } = useZapOutUserState();

  const actionRefund = route?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_REFUND"
  ) as RefundAction | undefined;

  const amountOut = BigInt(actionRefund?.refund.tokens[0].amount || 0);

  const actionRemoveLiq = route?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_REMOVE_LIQUIDITY"
  ) as RemoveLiquidityAction | undefined;

  const { tokens, fees } = actionRemoveLiq?.removeLiquidity || {};

  const poolTokens: Token[] =
    pool === "loading" ? [] : [pool.token0, pool.token1];

  const token0 = poolTokens.find(
    (item) => item.address.toLowerCase() === tokens?.[0]?.address.toLowerCase()
  );
  const token1 = poolTokens.find(
    (item) => item.address.toLowerCase() === tokens?.[1]?.address.toLowerCase()
  );

  const amountToken0 = BigInt(tokens?.[0]?.amount || 0);
  const amountToken1 = BigInt(tokens?.[1]?.amount || 0);

  const feeToken0 = poolTokens.find(
    (item) => item.address.toLowerCase() === fees?.[0]?.address.toLowerCase()
  );
  const feeToken1 = poolTokens.find(
    (item) => item.address.toLowerCase() === fees?.[1]?.address.toLowerCase()
  );

  const feeAmount0 = BigInt(fees?.[0]?.amount || 0);
  const feeAmount1 = BigInt(fees?.[1]?.amount || 0);

  const swapAction = route?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_AGGREGATOR_SWAP"
  ) as AggregatorSwapAction | undefined;

  const amountIns: { token: Token; amount: bigint }[] = [];
  swapAction?.aggregatorSwap?.swaps.forEach((item) => {
    const token = poolTokens.find(
      (pt) => pt.address.toLowerCase() === item.tokenIn.address.toLowerCase()
    );
    const amount = BigInt(item.tokenIn.amount);

    if (token) {
      amountIns.push({ token, amount });
    }
  });

  const dexNameObj = DexInfos[poolType].name;
  const dexName =
    typeof dexNameObj === "string" ? dexNameObj : dexNameObj[chainId];

  const swapInfo = useMemo(() => {
    const aggregatorSwapInfo = route?.zapDetails.actions.find(
      (item) => item.type === ZapAction.AGGREGATOR_SWAP
    ) as AggregatorSwapAction | null;

    const poolSwapInfo = route?.zapDetails.actions.find(
      (item) => item.type === ZapAction.POOL_SWAP
    ) as PoolSwapAction | null;

    if (pool === "loading") return [];
    const tokens = [
      pool.token0,
      pool.token1,
      NetworkInfo[chainId].wrappedToken,
    ];
    if (tokenOut) tokens.push(tokenOut);

    const parsedAggregatorSwapInfo =
      aggregatorSwapInfo?.aggregatorSwap?.swaps?.map((item) => {
        const tokenIn = tokens.find(
          (token) =>
            token.address.toLowerCase() === item.tokenIn.address.toLowerCase()
        );
        const tokenOut = tokens.find(
          (token) =>
            token.address.toLowerCase() === item.tokenOut.address.toLowerCase()
        );
        return {
          tokenInSymbol: tokenIn?.symbol || "--",
          tokenOutSymbol: tokenOut?.symbol || "--",
          amountIn: formatUnits(item.tokenIn.amount, tokenIn?.decimals),
          amountOut: formatUnits(item.tokenOut.amount, tokenOut?.decimals),
          pool: "KyberSwap",
        };
      }) || [];

    const parsedPoolSwapInfo =
      poolSwapInfo?.poolSwap?.swaps?.map((item) => {
        const tokenIn = tokens.find(
          (token) =>
            token.address.toLowerCase() === item.tokenIn.address.toLowerCase()
        );
        const tokenOut = tokens.find(
          (token) =>
            token.address.toLowerCase() === item.tokenOut.address.toLowerCase()
        );
        return {
          tokenInSymbol: tokenIn?.symbol || "--",
          tokenOutSymbol: tokenOut?.symbol || "--",
          amountIn: formatUnits(item.tokenIn.amount, tokenIn?.decimals),
          amountOut: formatUnits(item.tokenOut.amount, tokenOut?.decimals),
          pool: `${dexName} Pool`,
        };
      }) || [];

    return parsedAggregatorSwapInfo.concat(parsedPoolSwapInfo);
  }, [chainId, dexName, pool, route?.zapDetails.actions]);

  return (
    <div className="rounded-lg border border-stroke px-4 py-3 text-sm">
      <div>Est. Received Value</div>
      <div className="text-xs italic text-subText mt-1">
        The actual Zap Routes could be adjusted with on-chain states
      </div>

      <div className="mt-2 h-[1px] w-full bg-stroke"></div>

      <div className="flex gap-2 mt-2">
        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-layer2 text-xs font-medium">
          1
        </div>
        <div className="flex-1 text-subText text-xs">
          Remove{" "}
          {amountToken0 !== 0n
            ? formatTokenAmount(amountToken0, token0?.decimals || 18)
            : ""}{" "}
          {token0?.symbol}
          {amountToken1 !== 0n
            ? `+ ${formatTokenAmount(amountToken1, token1?.decimals || 18)} ${
                token1?.symbol
              }`
            : ""}{" "}
          {feeAmount0 !== 0n || feeAmount1 !== 0n ? (
            <>
              and claim fee{" "}
              {feeAmount0 !== 0n
                ? formatTokenAmount(feeAmount0, feeToken0?.decimals || 18)
                : ""}{" "}
              {feeAmount0 !== 0n ? feeToken0?.symbol : ""}{" "}
              {feeAmount1 !== 0n
                ? `+ ${formatTokenAmount(
                    feeAmount1,
                    feeToken1?.decimals || 18
                  )} ${feeToken1?.symbol}`
                : ""}{" "}
            </>
          ) : (
            ""
          )}
        </div>
      </div>

      {swapInfo.length > 0 && (
        <div className="flex gap-2 mt-3">
          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-layer2 text-xs font-medium">
            2
          </div>
          <div className="text-xs text-subText flex-1">
            {swapInfo.map((item, index) => (
              <div className="flex gap-3 items-center text-xs" key={index}>
                <div className="flex-1 text-subText leading-4">
                  <span>
                    Swap {formatDisplayNumber(item.amountIn)}{" "}
                    {item.tokenInSymbol} for{" "}
                    {formatDisplayNumber(item.amountOut)}{" "}
                  </span>
                  {item.tokenOutSymbol} via{" "}
                  <span className="font-medium text-text">{item.pool}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-3 items-center">
        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-layer2 text-xs font-medium">
          {swapInfo.length > 0 ? 3 : 2}
        </div>
        <div className="text-xs text-subText">
          Receive {formatTokenAmount(amountOut, tokenOut?.decimals || 18)}{" "}
          {tokenOut?.symbol}
        </div>
      </div>
    </div>
  );
}
