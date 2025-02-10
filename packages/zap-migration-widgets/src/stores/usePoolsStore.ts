import { create } from "zustand";
import { ChainId, Dex, Pool, Token, tick, token } from "../schema";
import { z } from "zod";
import { Theme, defaultTheme } from "../theme";
// import { useTokenPrices } from "@kyber/hooks/use-token-prices";

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

const BFF_API = "https://bff.kyberswap.com/api";

// Create a mapping object for string to Dex enum
const dexMapping: Record<Dex, string> = {
  [Dex.Uniswapv3]: "uniswapv3",
  [Dex.Pancakev3]: "pancake-v3",
  [Dex.Sushiv3]: "sushiswap-v3",
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
        `${BFF_API}/v1/pools?chainId=${chainId}&ids=${poolFrom},${poolTo}&protocol=${
          dexFrom === Dex.Uniswapv3
            ? "DEX_UNISWAPV3"
            : dexFrom === Dex.Pancakev3
            ? "DEX_PANCAKESWAPV3"
            : "DEX_SUSHISWAPV3"
        }`
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
      ].map((item) => item.address.toLowerCase());

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
            `https://ks-setting.kyberswap.com/api/v1/tokens/import`,
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
        `https://token-api.kyberengineering.io/api/v1/public/category/pair?chainId=${chainId}&tokenIn=${tokenFrom0.address}&tokenOut=${tokenFrom1.address}`
      ).then((res) => res.json());
      const cat = pairCheck0?.data?.category || "commonPair";

      const pool0: Pool = {
        category: cat,
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

      const tokenTo0 = await enrichLogoAndPrice(toPoolToken0);
      const tokenTo1 = await enrichLogoAndPrice(toPoolToken1);
      if (!tokenTo0 || !tokenTo1) {
        set({ error: "Can't get token info" });
        return;
      }

      // check category pair
      const pairCheck1 = await fetch(
        `https://token-api.kyberengineering.io/api/v1/public/category/pair?chainId=${chainId}&tokenIn=${tokenTo0.address}&tokenOut=${tokenTo1.address}`
      ).then((res) => res.json());
      const cat1 = pairCheck1?.data?.category || "commonPair";

      const pool1: Pool = {
        category: cat1,
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
