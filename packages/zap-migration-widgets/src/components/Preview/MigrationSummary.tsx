import { formatTokenAmount } from "@kyber/utils/number";
import { DexInfos, NetworkInfo } from "../../constants";
import { usePoolsStore } from "../../stores/usePoolsStore";
import {
  AddLiquidityAction,
  AggregatorSwapAction,
  GetRouteResponse,
  PoolSwapAction,
  RemoveLiquidityAction,
} from "../../stores/useZapStateStore";
import { useMemo } from "react";
import { ChainId } from "../..";
import { formatWei } from "../../utils";

export function MigrationSummary({
  route,
  chainId,
}: {
  route: GetRouteResponse;
  chainId: ChainId;
}) {
  const { pools } = usePoolsStore();

  const swaps = useMemo(() => {
    const aggregatorSwapInfo = route?.zapDetails.actions.find(
      (item) => item.type === "ACTION_TYPE_AGGREGATOR_SWAP"
    ) as AggregatorSwapAction | null;

    const poolSwapInfo = route?.zapDetails.actions.find(
      (item) => item.type === "ACTION_TYPE_POOL_SWAP"
    ) as PoolSwapAction | null;

    if (pools === "loading") return [];
    const tokens = [
      pools[0].token0,
      pools[0].token1,
      pools[1].token0,
      pools[1].token1,
      NetworkInfo[chainId].wrappedToken,
    ];

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
          amountIn: formatWei(item.tokenIn.amount, tokenIn?.decimals),
          amountOut: formatWei(item.tokenOut.amount, tokenOut?.decimals),
          pool: "KyberSwap",
        };
      }) || [];

    const dexNameObj = DexInfos[pools[1].dex].name;
    const dexName =
      typeof dexNameObj === "string" ? dexNameObj : dexNameObj[chainId];

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
          amountIn: formatWei(item.tokenIn.amount, tokenIn?.decimals),
          amountOut: formatWei(item.tokenOut.amount, tokenOut?.decimals),
          pool: `${dexName} Pool`,
        };
      }) || [];

    return parsedAggregatorSwapInfo.concat(parsedPoolSwapInfo);
  }, [chainId, pools, route?.zapDetails.actions]);

  if (pools === "loading") return null;
  const actionRemove = route.zapDetails.actions.find(
    (action) => action.type === "ACTION_TYPE_REMOVE_LIQUIDITY"
  ) as RemoveLiquidityAction | undefined;
  const amount0Removed =
    actionRemove?.removeLiquidity.tokens.find(
      (tk) => tk.address.toLowerCase() === pools[0].token0.address.toLowerCase()
    )?.amount || "0";
  const amount1Removed =
    actionRemove?.removeLiquidity.tokens.find(
      (tk) => tk.address.toLowerCase() === pools[0].token1.address.toLowerCase()
    )?.amount || "0";

  const addliquidityAction = route.zapDetails.actions.find(
    (action) => action.type === "ACTION_TYPE_ADD_LIQUIDITY"
  ) as AddLiquidityAction | undefined;

  const addedAmount0 = BigInt(
    addliquidityAction?.addLiquidity.token0.amount || 0
  );
  const addedAmount1 = BigInt(
    addliquidityAction?.addLiquidity.token1.amount || 0
  );
  const dexFrom =
    typeof DexInfos[pools[0].dex].name === "string"
      ? DexInfos[pools[0].dex].name
      : DexInfos[pools[0].dex].name[chainId];

  const dexTo =
    typeof DexInfos[pools[1].dex].name === "string"
      ? DexInfos[pools[1].dex].name
      : DexInfos[pools[1].dex].name[chainId];

  return (
    <div className="border border-stroke rounded-md px-4 py-3 mt-8">
      <div className="text-sm">Migration Summary</div>
      <div className="h-[1px] bg-stroke w-full mt-2" />

      <div className="flex items-center text-subText gap-2 mt-3">
        <div className="rounded-full w-4 h-4 bg-layer2 text-xs text-center">
          1
        </div>
        <div className="text-xs">
          Remove{" "}
          {formatTokenAmount(
            BigInt(amount0Removed),
            pools[0].token0.decimals,
            8
          )}{" "}
          {pools[0].token0.symbol} and{" "}
          {formatTokenAmount(
            BigInt(amount1Removed),
            pools[0].token1.decimals,
            8
          )}{" "}
          {pools[0].token1.symbol} from{" "}
          <span className="text-text">{dexFrom as string}</span>
        </div>
      </div>

      <div className="flex items-start text-subText gap-2 mt-3">
        <div className="rounded-full w-4 h-4 bg-layer2 text-xs text-center">
          2
        </div>
        <div className="text-xs">
          {swaps.map((item, index) => (
            <div className="flex-1 text-subText leading-4" key={index}>
              Swap {item.amountIn} {item.tokenInSymbol} for {item.amountOut}{" "}
              {item.tokenOutSymbol} via{" "}
              <span className="font-medium text-text">{item.pool}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center text-subText gap-2 mt-3">
        <div className="rounded-full w-4 h-4 bg-layer2 text-xs text-center">
          3
        </div>
        <div className="text-xs">
          Add{" "}
          {addedAmount0 !== 0n &&
            `${formatTokenAmount(addedAmount0, pools[1].token0.decimals, 8)} ${
              pools[1].token0.symbol
            } and`}{" "}
          {addedAmount0 !== 0n &&
            `${formatTokenAmount(addedAmount1, pools[1].token1.decimals, 8)} ${
              pools[1].token1.symbol
            }`}{" "}
          into <span className="text-text">{dexTo as string}</span> in the
          selected fee pool
        </div>
      </div>
    </div>
  );
}
