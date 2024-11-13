import { create } from "zustand";
import { ChainId, Dex, Pool, Token, tick, token } from "../schema";
import { z } from "zod";
import { NetworkInfo } from "../constants";

interface GetPoolParams {
  chainId: ChainId;
  poolFrom: string;
  dexFrom: Dex;
  poolTo: string;
  dexTo: Dex;
}
interface PoolsState {
  pools: "loading" | [Pool, Pool];
  error: string;
  getPools: (params: GetPoolParams) => void;
}

const BFF_API = "https://bff.kyberswap.com/api";

// Create a mapping object for string to Dex enum
const dexMapping: Record<Dex, string> = {
  [Dex.Uniswapv3]: "uniswapv3",
  [Dex.Pancakev3]: "pancake-v3",
  // Add new DEX mappings here when needed
} as const;

const poolResponse = z.object({
  data: z.object({
    pools: z.array(
      z.object({
        address: z.string(),
        swapFee: z.number(),
        exchange: z
          .enum(Object.values(dexMapping) as [string, ...string[]])
          .transform((val) => {
            // Reverse lookup in the enum
            const dexEnumKey = Object.keys(dexMapping).find(
              (key) => dexMapping[+key as Dex] === val
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
    ),
  }),
});

export const usePoolsStore = create<PoolsState>((set, get) => ({
  pools: "loading",
  error: "",
  getPools: async ({
    chainId,
    poolFrom,
    poolTo,
    dexFrom,
    dexTo,
  }: GetPoolParams) => {
    try {
      const res = await fetch(
        `${BFF_API}/v1/pools?chainId=${chainId}&ids=${poolFrom},${poolTo}`
      ).then((res) => res.json());
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
      ]
        .map((item) => item.address)
        .join(",");

      const tokens: {
        address: string;
        logoURI?: string;
        name: string;
        symbol: string;
        decimals: number;
      }[] = await fetch(
        `https://ks-setting.kyberswap.com/api/v1/tokens?chainIds=${chainId}&addresses=${addresses}`
      )
        .then((res) => res.json())
        .then((res) => res?.data?.tokens || [])
        .catch(() => []);

      const prices: { address: string; price: number; marketPrice: number }[] =
        await fetch(
          `https://price.kyberswap.com/${NetworkInfo[chainId].pricePath}/api/v1/prices?ids=${addresses}`
        )
          .then((res) => res.json())
          .then((res) => res?.data?.prices || [])
          .catch(() => []);

      const enrichLogoAndPrice = (
        token: Pick<Token, "address">
      ): Token | undefined => {
        const price = prices.find(
          (item) => item.address.toLowerCase() === token.address.toLowerCase()
        );
        const tk = tokens.find(
          (item) => item.address.toLowerCase() === token.address.toLowerCase()
        );

        if (!tk) {
          return;
        }

        return {
          ...token,
          ...tk,
          logo: tk?.logoURI,
          price: price?.marketPrice || price?.price || 0,
        };
      };

      const tokenFrom0 = enrichLogoAndPrice(fromPoolToken0);
      const tokenFrom1 = enrichLogoAndPrice(fromPoolToken1);
      if (!tokenFrom0 || !tokenFrom1) {
        set({ error: "Can't get token info" });
        return;
      }

      const pool0: Pool = {
        token0: tokenFrom0,
        token1: tokenFrom1,
        address: poolFrom,
        dex: dexFrom,
        fee: fromPool.swapFee,
        tick: fromPool.positionInfo.tick,
        liquidity: fromPool.positionInfo.liquidity,
        sqrtPriceX96: fromPool.positionInfo.sqrtPriceX96,
        tickSpacing: fromPool.positionInfo.tickSpacing,
        ticks: fromPool.positionInfo.ticks,
      };

      const tokenTo0 = enrichLogoAndPrice(toPoolToken0);
      const tokenTo1 = enrichLogoAndPrice(toPoolToken1);
      if (!tokenTo0 || !tokenTo1) {
        set({ error: "Can't get token info" });
        return;
      }

      const pool1: Pool = {
        token0: tokenTo0,
        token1: tokenTo1,
        address: poolTo,
        dex: dexTo,
        fee: toPool.swapFee,
        tick: toPool.positionInfo.tick,
        liquidity: toPool.positionInfo.liquidity,
        sqrtPriceX96: toPool.positionInfo.sqrtPriceX96,
        tickSpacing: toPool.positionInfo.tickSpacing,
        ticks: toPool.positionInfo.ticks,
      };

      set({ pools: [pool0, pool1], error: "" });
    } catch (e) {
      if (get().pools === "loading") set({ error: "Can't get pool info" });
    }
  },
}));
