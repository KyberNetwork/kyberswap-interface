import { formatTokenAmount } from "@kyber/utils/number";
import { DexInfos } from "../../constants";
import { usePoolsStore } from "../../stores/usePoolsStore";
import {
  AddLiquidityAction,
  AggregatorSwapAction,
  GetRouteResponse,
  RemoveLiquidityAction,
} from "../../stores/useZapStateStore";

export function MigrationSummary({ route }: { route: GetRouteResponse }) {
  const { pools } = usePoolsStore();

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

  const swapAction = route.zapDetails.actions.find(
    (action) => action.type === "ACTION_TYPE_AGGREGATOR_SWAP"
  ) as AggregatorSwapAction | undefined;

  const swaps = (swapAction?.aggregatorSwap.swaps || [])
    .map((item) => {
      const tokenIn =
        pools[0].token0.address === item.tokenIn.address.toLowerCase()
          ? pools[0].token0
          : pools[0].token1.address === item.tokenIn.address.toLowerCase()
          ? pools[0].token1
          : undefined;
      const tokenOut =
        pools[1].token0.address === item.tokenOut.address.toLowerCase()
          ? pools[1].token0
          : pools[1].token1.address === item.tokenOut.address.toLowerCase()
          ? pools[1].token1
          : undefined;

      if (!tokenIn || !tokenOut) return;

      return {
        tokenIn,
        tokenOut,
        amountIn: formatTokenAmount(
          BigInt(item.tokenIn.amount),
          tokenIn.decimals,
          8
        ),
        amountOut: formatTokenAmount(
          BigInt(item.tokenOut.amount),
          tokenOut.decimals,
          8
        ),
      };
    })
    .filter(Boolean);

  const addliquidityAction = route.zapDetails.actions.find(
    (action) => action.type === "ACTION_TYPE_ADD_LIQUIDITY"
  ) as AddLiquidityAction | undefined;

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
          <span className="text-text">{DexInfos[pools[0].dex].name}</span>
        </div>
      </div>

      <div className="flex items-start text-subText gap-2 mt-3">
        <div className="rounded-full w-4 h-4 bg-layer2 text-xs text-center">
          2
        </div>
        <div className="text-xs">
          {swaps.map((swap, index) => (
            <div key={index}>
              Swap {swap?.amountIn} {swap?.tokenIn.symbol} to {swap?.amountOut}{" "}
              {swap?.tokenOut.symbol}
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
          {formatTokenAmount(
            BigInt(addliquidityAction?.addLiquidity.token0.amount || 0),
            pools[1].token0.decimals,
            8
          )}{" "}
          {pools[1].token0.symbol} and{" "}
          {formatTokenAmount(
            BigInt(addliquidityAction?.addLiquidity.token1.amount || 0),
            pools[1].token1.decimals,
            8
          )}{" "}
          {pools[1].token1.symbol} into{" "}
          <span className="text-text">{DexInfos[pools[1].dex].name}</span> in
          the selected fee pool
        </div>
      </div>
    </div>
  );
}
