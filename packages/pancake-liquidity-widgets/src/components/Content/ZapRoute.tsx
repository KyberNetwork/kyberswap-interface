import { useMemo } from "react";
import { useWidgetInfo } from "@/hooks/useWidgetInfo";
import { useZapState } from "@/hooks/useZapInState";
import { useWeb3Provider } from "@/hooks/useProvider";
import {
  ZapAction,
  AddLiquidityAction,
  AggregatorSwapAction,
  PoolSwapAction,
} from "@/types/zapInTypes";
import { formatWei, getDexName } from "@/utils";
import { NetworkInfo } from "@/constants";
import InfoHelper from "@/components/InfoHelper";
import { PancakeToken } from "@/entities/Pool";

export default function ZapRoute() {
  const { zapInfo, tokensIn } = useZapState();
  const { pool, poolType } = useWidgetInfo();
  const { chainId } = useWeb3Provider();

  const tokens = useMemo(
    () =>
      [
        ...tokensIn,
        pool?.token0,
        pool?.token1,
        NetworkInfo[chainId].wrappedToken,
      ] as PancakeToken[],
    [chainId, pool?.token0, pool?.token1, tokensIn]
  );

  const swapInfo = useMemo(() => {
    const aggregatorSwapInfo = zapInfo?.zapDetails.actions.find(
      (item) => item.type === ZapAction.AGGREGATOR_SWAP
    ) as AggregatorSwapAction | null;

    const poolSwapInfo = zapInfo?.zapDetails.actions.find(
      (item) => item.type === ZapAction.POOL_SWAP
    ) as PoolSwapAction | null;

    const parsedAggregatorSwapInfo =
      aggregatorSwapInfo?.aggregatorSwap?.swaps?.map((item) => {
        const tokenIn = tokens.find(
          (token: PancakeToken) =>
            token.address.toLowerCase() === item.tokenIn.address.toLowerCase()
        );
        const tokenOut = tokens.find(
          (token: PancakeToken) =>
            token.address.toLowerCase() === item.tokenOut.address.toLowerCase()
        );
        return {
          tokenInSymbol: tokenIn?.symbol || "--",
          tokenOutSymbol: tokenOut?.symbol || "--",
          amountIn: formatWei(item.tokenIn.amount, tokenIn?.decimals),
          amountOut: formatWei(item.tokenOut.amount, tokenOut?.decimals),
          pool: "KyberSwap",
        };
      }) || [];

    const parsedPoolSwapInfo =
      poolSwapInfo?.poolSwap?.swaps?.map((item) => {
        const tokenIn = tokens.find(
          (token: PancakeToken) =>
            token.address.toLowerCase() === item.tokenIn.address.toLowerCase()
        );
        const tokenOut = tokens.find(
          (token: PancakeToken) =>
            token.address.toLowerCase() === item.tokenOut.address.toLowerCase()
        );
        return {
          tokenInSymbol: tokenIn?.symbol || "--",
          tokenOutSymbol: tokenOut?.symbol || "--",
          amountIn: formatWei(item.tokenIn.amount, tokenIn?.decimals),
          amountOut: formatWei(item.tokenOut.amount, tokenOut?.decimals),
          pool: `${getDexName(poolType)} Pool`,
        };
      }) || [];

    return parsedAggregatorSwapInfo.concat(parsedPoolSwapInfo);
  }, [tokens, zapInfo?.zapDetails.actions, poolType]);

  const addedLiquidityInfo = useMemo(() => {
    const data = zapInfo?.zapDetails.actions.find(
      (item) => item.type === ZapAction.ADD_LIQUIDITY
    ) as AddLiquidityAction | null;

    const addedAmount0 = formatWei(
      data?.addLiquidity.token0.amount,
      pool?.token0.decimals
    );
    const addedAmount1 = formatWei(
      data?.addLiquidity.token1.amount,
      pool?.token1.decimals
    );

    return { addedAmount0, addedAmount1 };
  }, [
    pool?.token0.decimals,
    pool?.token1.decimals,
    zapInfo?.zapDetails.actions,
  ]);

  return (
    <>
      <div className="text-xs font-medium text-secondary uppercase">
        Zap Route
        <InfoHelper text="The actual Zap Route could be adjusted with on-chain states" />
      </div>
      <div className="pcs-lw-card flex flex-col gap-4">
        {swapInfo.map((item, index) => (
          <div className="flex gap-3 items-center" key={index}>
            <div className="rounded-[50%] w-6 h-6 flex justify-center items-center text-sm font-medium bg-inputBackground text-textSecondary">
              {index + 1}
            </div>
            <div className="flex-1 text-xs text-textSecondary leading-[18px]">
              Swap {item.amountIn} {item.tokenInSymbol} for {item.amountOut}{" "}
              {item.tokenOutSymbol} via{" "}
              <span className="text-textPrimary font-medium">{item.pool}</span>
            </div>
          </div>
        ))}

        <div className="flex gap-3 items-center">
          <div className="rounded-[50%] w-6 h-6 flex justify-center items-center text-sm font-medium bg-inputBackground text-textSecondary">
            {swapInfo.length + 1}
          </div>
          <div className="flex-1 text-xs text-textSecondary leading-[18px]">
            Build LP using {addedLiquidityInfo.addedAmount0}{" "}
            {pool?.token0.symbol} and {addedLiquidityInfo.addedAmount1}{" "}
            {pool?.token1.symbol} on{" "}
            <span className="text-textPrimary font-medium">
              {getDexName(poolType)}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
