import { useWidgetInfo } from "../../hooks/useWidgetInfo";
import { useZapState } from "../../hooks/useZapInState";
import {
  AddLiquidityAction,
  AggregatorSwapAction,
  PoolSwapAction,
  ZapAction,
} from "../../hooks/types/zapInTypes";
import { formatWei, getDexName } from "../../utils";
import { useMemo } from "react";
import { Token } from "@/entities/Pool";
import { useWeb3Provider } from "@/hooks/useProvider";
import { NetworkInfo } from "@/constants";

export default function ZapRoute() {
  const { zapInfo, tokensIn } = useZapState();
  const { pool, poolType } = useWidgetInfo();
  const { chainId } = useWeb3Provider();

  const swapInfo = useMemo(() => {
    const aggregatorSwapInfo = zapInfo?.zapDetails.actions.find(
      (item) => item.type === ZapAction.AGGREGATOR_SWAP
    ) as AggregatorSwapAction | null;

    const poolSwapInfo = zapInfo?.zapDetails.actions.find(
      (item) => item.type === ZapAction.POOL_SWAP
    ) as PoolSwapAction | null;

    if (!pool) return [];
    const tokens = [
      ...tokensIn,
      pool.token0,
      pool.token1,
      NetworkInfo[chainId].wrappedToken,
    ];

    const parsedAggregatorSwapInfo =
      aggregatorSwapInfo?.aggregatorSwap?.swaps?.map((item) => {
        const tokenIn = tokens.find(
          (token: Token) =>
            token.address.toLowerCase() === item.tokenIn.address.toLowerCase()
        );
        const tokenOut = tokens.find(
          (token: Token) =>
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
          (token: Token) =>
            token.address.toLowerCase() === item.tokenIn.address.toLowerCase()
        );
        const tokenOut = tokens.find(
          (token: Token) =>
            token.address.toLowerCase() === item.tokenOut.address.toLowerCase()
        );
        return {
          tokenInSymbol: tokenIn?.symbol || "--",
          tokenOutSymbol: tokenOut?.symbol || "--",
          amountIn: formatWei(item.tokenIn.amount, tokenIn?.decimals),
          amountOut: formatWei(item.tokenOut.amount, tokenOut?.decimals),
          pool: `${getDexName(poolType, chainId)} Pool`,
        };
      }) || [];

    return parsedAggregatorSwapInfo.concat(parsedPoolSwapInfo);
  }, [poolType, zapInfo?.zapDetails.actions]);

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
    <div className="zap-route mb-4">
      <div className="title">Zap Summary</div>
      <div className="subTitle">
        The actual Zap Routes could be adjusted with on-chain states
      </div>
      <div className="divider mt-1" />

      {swapInfo.map((item, index) => (
        <div className="row" key={index}>
          <div className="step">{index + 1}</div>
          <div className="text">
            Swap {item.amountIn} {item.tokenInSymbol} for {item.amountOut}{" "}
            {item.tokenOutSymbol} via{" "}
            <span className="font-medium text-text">{item.pool}</span>
          </div>
        </div>
      ))}

      <div className="row">
        <div className="step">{swapInfo.length + 1}</div>
        <div className="text">
          Build LP using {addedLiquidityInfo.addedAmount0} {pool?.token0.symbol}{" "}
          and {addedLiquidityInfo.addedAmount1} {pool?.token1.symbol} on{" "}
          <span className="font-medium text-text">
            {getDexName(poolType, chainId)}
          </span>
        </div>
      </div>
    </div>
  );
}
