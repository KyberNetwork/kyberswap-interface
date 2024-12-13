import { useEffect, useMemo, useState } from "react";

import { ChartEntry, TickDataRaw, TickProcessed } from "./types";
import { computeSurroundingTicks } from "./utils";
import { useZapState } from "../../hooks/useZapInState";
import { PATHS } from "@/constants";
import { useWidgetContext } from "@/stores/widget";
import { Token } from "@/schema";

// TODO: Implement this
const TICK_SPACINGS: { [feeAmount: number]: number } = {};

//const PRICE_FIXED_DIGITS = 8;

export function useDensityChartData() {
  const { data: ticks = [], isLoading } = usePoolActiveLiquidity();

  const formattedData = useMemo(() => {
    if (!ticks.length) {
      return undefined;
    }

    const newData: ChartEntry[] = [];

    for (let i = 0; i < ticks.length; i++) {
      const t = ticks[i];

      const chartEntry = {
        activeLiquidity: parseFloat(t.liquidityActive.toString()),
        price0: parseFloat(t.price0),
      };

      if (chartEntry.activeLiquidity > 0) {
        newData.push(chartEntry);
      }
    }

    return newData;
  }, [ticks]);

  return useMemo(() => {
    return {
      formattedData,
      isLoading,
    };
  }, [formattedData, isLoading]);
}

const getActiveTick = (
  tickCurrent: number | undefined,
  feeAmount: number | undefined
) =>
  typeof tickCurrent !== "undefined" && feeAmount
    ? Math.floor(tickCurrent / TICK_SPACINGS[feeAmount]) *
      TICK_SPACINGS[feeAmount]
    : undefined;

const chainIdToExplorerInfoChainName: { [id: number]: string } = {
  1: "ETHEREUM",
  42161: "ARBITRUM",
  10: "OPTIMISM",
  137: "POLYGON",
  8453: "BASE",
  56: "BNB",
  43114: "AVALANCHE",
  324: "ZKSYNC",
};

export function usePoolActiveLiquidity(): {
  activeTick?: number;
  data?: TickProcessed[];
  isLoading: boolean;
} {
  const chainId = useWidgetContext((s) => s.chainId);
  const { pool, poolAddress } = useWidgetContext((s) => s);
  const { revertPrice } = useZapState();

  const tickCurrent = undefined; // TODO: pool === "loading" ? undefined : pool.tick;
  const fee = pool === "loading" ? undefined : pool.fee * 10_000;
  // Find nearest valid tick for pool in case tick is not initialized.
  const activeTick = useMemo(
    () => getActiveTick(tickCurrent, fee),
    [tickCurrent, fee]
  );

  const [ticks, setTicks] = useState<TickDataRaw[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // useEffect(() => {
  //   const chainName = chainIdToExplorerInfoChainName[chainId];
  //   if (!chainName) return;
  //   (async () => {
  //     setIsLoading(true);
  //     let tickData: (TickDataRaw & { tickIdx: number })[] = [];
  //     let after = "";
  //     const a = 2;
  //     while (1 + 1 == a) {
  //       const res = await fetch(
  //         `https://explorer-api.pancakeswap.com/cached/pools/ticks/v3/${chainName}/${poolAddress}?after=${after}`
  //       ).then((res) => res.json());
  //
  //       tickData = [...tickData, ...(res.rows || [])];
  //       if (res.hasNextPage) {
  //         after = res.endCursor;
  //       } else {
  //         break;
  //       }
  //     }
  //     setTicks(tickData.map((item) => ({ ...item, tick: item.tickIdx })));
  //     setIsLoading(false);
  //   })();
  // }, [poolAddress, chainId]);

  useEffect(() => {
    const chainName = chainIdToExplorerInfoChainName[chainId];
    if (!chainName) return;

    (async () => {
      setIsLoading(true);
      let tickData: (TickDataRaw & { tickIdx: number })[] = [];
      let skip = 0;
      const a = 2;
      while (1 + 1 == a) {
        const res = await fetch(PATHS.INTERFACE_GATEWAY_UNISWAP, {
          method: "POST",
          body: JSON.stringify({
            operationName: "AllV3Ticks",
            query:
              "query AllV3Ticks($chain: Chain!, $address: String!, $skip: Int, $first: Int) {\n  v3Pool(chain: $chain, address: $address) {\n    ticks(skip: $skip, first: $first) {\n      tick: tickIdx\n      liquidityNet\n      price0\n      price1\n      __typename\n    }\n    __typename\n  }\n}",
            variables: {
              address: poolAddress,
              chain: chainName,
              first: 1000,
              skip,
            },
          }),
        }).then((res) => res.json());
        const data = res?.data?.v3Pool?.ticks || [];
        tickData = [...tickData, ...data];
        if (data.length === 0) {
          break;
        } else {
          skip += 1000;
        }
      }
      setTicks(tickData);
      setIsLoading(false);
    })();
  }, [poolAddress, chainId]);

  const token0: Token | null = useMemo(
    () => (pool !== "loading" ? pool.token0 : null),

    [pool, chainId]
  );
  const token1: Token | null = useMemo(
    () => (pool !== "loading" ? pool.token1 : null),
    [chainId, pool]
  );

  return useMemo(() => {
    if (
      !token0 ||
      !token1 ||
      activeTick === undefined ||
      !ticks ||
      ticks.length === 0
    ) {
      return {
        activeTick,
        data: undefined,
        isLoading: false,
      };
    }

    // find where the active tick would be to partition the array
    // if the active tick is initialized, the pivot will be an element
    // if not, take the previous tick as pivot
    const pivot = ticks.findIndex(({ tick }) => Number(tick) > activeTick) - 1;

    if (pivot < 0) {
      // consider setting a local error
      console.error("TickData pivot not found");
      return {
        activeTick,
        data: undefined,
        isLoading: false,
      };
    }

    const activeTickProcessed: TickProcessed = {
      liquidityActive: 0n, // TODO: BigInt(pool === "loading" ? 0 : pool.liquidity),
      tick: activeTick,
      liquidityNet:
        Number(ticks[pivot].tick) === activeTick
          ? BigInt(ticks[pivot].liquidityNet)
          : 0n,
      price0: "0",
      // TODO: Fix this
      //token0 && token1
      //  ? tickToPrice(
      //      revertPrice ? token1 : token0,
      //      revertPrice ? token0 : token1,
      //      activeTick
      //    ).toFixed(PRICE_FIXED_DIGITS)
      //  : "0",
    };

    const subsequentTicks = computeSurroundingTicks(
      revertPrice ? token1 : token0,
      revertPrice ? token0 : token1,
      activeTickProcessed,
      ticks,
      pivot,
      true
    );

    const previousTicks = computeSurroundingTicks(
      revertPrice ? token1 : token0,
      revertPrice ? token0 : token1,
      activeTickProcessed,
      ticks,
      pivot,
      false
    );

    const ticksProcessed = previousTicks
      .concat(activeTickProcessed)
      .concat(subsequentTicks);

    return {
      activeTick,
      data: ticksProcessed,
      isLoading,
    };
  }, [token0, token1, activeTick, pool, ticks, isLoading, revertPrice]);
}
