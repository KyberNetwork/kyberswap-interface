import { getFunctionSelector } from "@kyber/utils/crypto";
import {
  ChainId,
  Dex,
  Pool,
  Token,
  tick,
  token,
  univ2Dexes,
  univ3Dexes,
} from "../schema";
import { Theme, defaultTheme } from "../theme";
import { z } from "zod";
import { create } from "zustand";
import { NETWORKS_INFO, PATHS } from "../constants";
import { MAX_TICK, MIN_TICK, nearestUsableTick } from "@kyber/utils/uniswapv3";

interface GetPoolParams {
  chainId: ChainId;
  poolFrom: string;
  dexFrom: Dex;
  poolTo: string;
  dexTo: Dex;
  fetchPrices: (
    address: string[]
  ) => Promise<{ [key: string]: { PriceBuy: number } }>;
}
interface PoolsState {
  pools: "loading" | [Pool, Pool];
  error: string;
  getPools: (params: GetPoolParams) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  reset: () => void;
}

// Create a mapping object for string to Dex enum
const dexMapping: Record<Dex, string[]> = {
  // uni v3 forks
  [Dex.DEX_UNISWAPV3]: ["uniswapv3"],
  [Dex.DEX_PANCAKESWAPV3]: ["pancake-v3"],
  [Dex.DEX_METAVAULTV3]: ["metavault-v3"],
  [Dex.DEX_LINEHUBV3]: ["linehub-v3"],
  [Dex.DEX_SWAPMODEV3]: ["baseswap-v3", "arbidex-v3", "superswap-v3"],
  [Dex.DEX_KOICL]: ["koi-cl"],
  [Dex.DEX_THRUSTERV3]: ["thruster-v3"],
  [Dex.DEX_SUSHISWAPV3]: ["sushiswap-v3"],

  [Dex.DEX_THENAFUSION]: ["thena-fusion"],
  [Dex.DEX_CAMELOTV3]: ["camelot-v3"],
  [Dex.DEX_QUICKSWAPV3ALGEBRA]: ["quickswap-v3"],
  [Dex.DEX_KODIAK_V3]: ["kodiak-v3"],
  [Dex.DEX_SQUADSWAP_V3]: ["squadswap-v3"],

  [Dex.DEX_UNISWAPV2]: ["uniswap"],
  [Dex.DEX_SQUADSWAP_V2]: ["squadswap"],

  [Dex.DEX_UNISWAP_V4]: ["uniswap-v4"],
  [Dex.DEX_UNISWAP_V4_KEM]: ["uniswap-v4-kem"],
} as const;

const poolResponse = z.object({
  data: z.object({
    pools: z.array(
      z
        .object({
          address: z.string(),
          swapFee: z.number(),
          exchange: z
            .enum(Object.values(dexMapping).flat() as [string, ...string[]])
            .transform((val) => {
              // Reverse lookup in the enum
              const dexEnumKey = Object.keys(dexMapping).find((key) =>
                dexMapping[+key as Dex].includes(val)
              );
              if (!dexEnumKey) {
                throw new Error(`No enum value for exchange: ${val}`);
              }
              return parseInt(dexEnumKey, 10) as Dex;
            }),
          tokens: z.tuple([
            token.pick({ address: true }),
            token.pick({ address: true }),
          ]),
          positionInfo: z.object({
            liquidity: z.string(),
            sqrtPriceX96: z.string(),
            tickSpacing: z.number(),
            tick: z.number(),
            ticks: z.array(tick),
          }),
        })
        .or(
          z.object({
            address: z.string(),
            reserveUsd: z.string(),
            amplifiedTvl: z.string(),
            swapFee: z.number(),
            exchange: z.string(),
            type: z.string(),
            timestamp: z.number(),
            reserves: z.tuple([z.string(), z.string()]),
            tokens: z.array(
              z.object({
                address: z.string(),
                swappable: z.boolean(),
              })
            ),
            extraFields: z.object({
              fee: z.number(),
              feePrecision: z.number(),
            }),
          })
        )
    ),
  }),
});

const initState = {
  pools: "loading" as "loading" | [Pool, Pool],
  error: "",
  theme: defaultTheme,
};
export const usePoolsStore = create<PoolsState>((set, get) => ({
  ...initState,
  reset: () => set(initState),
  setTheme: (theme: Theme) => set({ theme }),
  getPools: async ({
    chainId,
    poolFrom,
    poolTo,
    dexFrom,
    dexTo,
    fetchPrices,
  }: GetPoolParams) => {
    try {
      const res = await fetch(
        `${PATHS.BFF_API}/v1/pools?chainId=${chainId}&ids=${poolFrom},${poolTo}&protocol=${Dex[dexFrom]}`
      ).then((res) => res.json());

      const isUniV3 = univ3Dexes.includes(dexFrom);
      const isUniV2 = univ2Dexes.includes(dexFrom);

      const { success, data, error } = poolResponse.safeParse(res);

      const firstLoad = get().pools === "loading";
      if (!success) {
        firstLoad && set({ error: `Can't get pool info ${error.toString()}` });
        return;
      }

      const fromPool = data.data.pools.find(
        (item) => item.address.toLowerCase() === poolFrom.toLowerCase()
      );
      const toPool = data.data.pools.find(
        (item) => item.address.toLowerCase() === poolTo.toLowerCase()
      );
      if (!fromPool) {
        firstLoad &&
          set({ error: `Can't get pool info, address: ${poolFrom}` });
        return;
      }
      if (!toPool) {
        firstLoad && set({ error: `Can't get pool info, address: ${poolTo}` });
        return;
      }

      const fromPoolToken0 = fromPool.tokens[0];
      const fromPoolToken1 = fromPool.tokens[1];
      const toPoolToken0 = toPool.tokens[0];
      const toPoolToken1 = toPool.tokens[1];

      const addresses = [
        fromPoolToken0,
        fromPoolToken1,
        toPoolToken0,
        toPoolToken1,
      ].map((item) => item.address.toLowerCase());

      const tokens: {
        address: string;
        logoURI?: string;
        name: string;
        symbol: string;
        decimals: number;
      }[] = await fetch(
        `${PATHS.KYBERSWAP_SETTING_API}/v1/tokens?chainIds=${chainId}&addresses=${addresses}`
      )
        .then((res) => res.json())
        .then((res) => res?.data?.tokens || [])
        .catch(() => []);

      const prices = await fetchPrices(
        addresses.map((item) => item.toLowerCase())
      );

      const enrichLogoAndPrice = async (
        token: Pick<Token, "address">
      ): Promise<Token | undefined> => {
        const price = prices[token.address.toLowerCase()];
        let tk = tokens.find(
          (item) => item.address.toLowerCase() === token.address.toLowerCase()
        );

        if (!tk) {
          const res = await fetch(
            `${PATHS.KYBERSWAP_SETTING_API}/v1/tokens/import`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                tokens: [
                  { chainId: chainId.toString(), address: token.address },
                ],
              }),
            }
          ).then((res) => res.json());

          tk = res?.data.tokens?.find(
            (item: { data: Token }) =>
              item.data.address.toLowerCase() === token.address.toLowerCase()
          )?.data;
          if (!tk) return;
        }

        return {
          ...token,
          ...tk,
          logo: tk?.logoURI,
          price: price?.PriceBuy || 0,
        };
      };

      const tokenFrom0 = await enrichLogoAndPrice(fromPoolToken0);
      const tokenFrom1 = await enrichLogoAndPrice(fromPoolToken1);
      if (!tokenFrom0 || !tokenFrom1) {
        set({ error: "Can't get token info" });
        return;
      }
      // check category pair
      const pairCheck0 = await fetch(
        `${PATHS.TOKEN_API}/v1/public/category/pair?chainId=${chainId}&tokenIn=${tokenFrom0.address}&tokenOut=${tokenFrom1.address}`
      ).then((res) => res.json());
      const cat = pairCheck0?.data?.category || "commonPair";

      let pool0: Pool;
      const p = fromPool as any;
      if (isUniV3) {
        pool0 = {
          category: cat,
          token0: tokenFrom0,
          token1: tokenFrom1,
          address: poolFrom,
          dex: dexFrom,
          fee: fromPool.swapFee,
          tick: p.positionInfo.tick,
          liquidity: p.positionInfo.liquidity,
          sqrtPriceX96: p.positionInfo.sqrtPriceX96,
          tickSpacing: p.positionInfo.tickSpacing,
          ticks: p.positionInfo.ticks,
          minTick: nearestUsableTick(MIN_TICK, p.positionInfo.tickSpacing),
          maxTick: nearestUsableTick(MAX_TICK, p.positionInfo.tickSpacing),
        } as Pool;
      } else if (isUniV2) {
        pool0 = {
          address: poolFrom,
          category: cat,
          dex: dexFrom,
          token0: tokenFrom0,
          token1: tokenFrom1,
          fee: p.swapFee,
          reserves: p.reserves,
        } as Pool;
      } else {
        set({ error: `Can't get pool info ${poolFrom}` });
        return;
      }

      const tokenTo0 = await enrichLogoAndPrice(toPoolToken0);
      const tokenTo1 = await enrichLogoAndPrice(toPoolToken1);
      if (!tokenTo0 || !tokenTo1) {
        set({ error: "Can't get token info" });
        return;
      }

      // check category pair
      const pairCheck1 = await fetch(
        `${PATHS.TOKEN_API}/v1/public/category/pair?chainId=${chainId}&tokenIn=${tokenTo0.address}&tokenOut=${tokenTo1.address}`
      ).then((res) => res.json());
      const cat1 = pairCheck1?.data?.category || "commonPair";

      const isPoolToUniV3 = univ3Dexes.includes(dexTo);
      const isPoolToUniV2 = univ2Dexes.includes(dexTo);
      let pool1: Pool;
      const p1 = toPool as any;
      if (isPoolToUniV3) {
        pool1 = {
          category: cat1,
          token0: tokenTo0,
          token1: tokenTo1,
          address: poolTo,
          dex: dexTo,
          fee: toPool.swapFee,
          tick: p1.positionInfo.tick,
          liquidity: p1.positionInfo.liquidity,
          sqrtPriceX96: p1.positionInfo.sqrtPriceX96,
          tickSpacing: p1.positionInfo.tickSpacing,
          ticks: p1.positionInfo.ticks,
          minTick: nearestUsableTick(MIN_TICK, p1.positionInfo.tickSpacing),
          maxTick: nearestUsableTick(MAX_TICK, p1.positionInfo.tickSpacing),
        } as Pool;
      } else if (isPoolToUniV2) {
        const totalSupplySelector = getFunctionSelector("totalSupply()");
        const getPayload = (d: string) => {
          return {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              jsonrpc: "2.0",
              method: "eth_call",
              params: [
                {
                  to: poolTo,
                  data: d,
                },
                "latest",
              ],
              id: 1,
            }),
          };
        };
        const totalSupplyRes = await fetch(
          NETWORKS_INFO[chainId].defaultRpc,
          getPayload(`0x${totalSupplySelector}`)
        ).then((res) => res.json());
        const totalSupply = BigInt(totalSupplyRes?.result || "0");
        pool1 = {
          address: poolTo,
          category: cat,
          dex: dexTo,
          token0: tokenTo0,
          token1: tokenTo1,
          fee: p1.swapFee,
          reserves: p1.reserves,
          totalSupply: totalSupply,
        } as Pool;
      } else {
        set({ error: `Can't get pool info ${poolTo}` });
        return;
      }

      set({ pools: [pool0, pool1], error: "" });
    } catch (e) {
      if (get().pools === "loading") set({ error: "Can't get pool info" });
    }
  },
}));
