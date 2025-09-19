import { useEffect, useMemo, useState } from "react";
import { NATIVE_TOKEN_ADDRESS, NetworkInfo } from "@/constants";
import { useWeb3Provider } from "@/hooks/useProvider";
import { PancakeTokenAdvanced } from "@/types/zapInTypes";
import { fetchTokenPrice } from "@kyber/utils";

export interface Price {
  address: string;
  price: number;
}

export default function useMarketPrice({
  tokens,
}: {
  tokens: PancakeTokenAdvanced[];
}) {
  const { chainId } = useWeb3Provider();
  const [prices, setPrices] = useState<Array<Price>>([]);

  const tokensAddress = useMemo(
    () =>
      tokens
        .map((token) =>
          token.address?.toLowerCase() !== NATIVE_TOKEN_ADDRESS.toLowerCase()
            ? token.address
            : NetworkInfo[chainId].wrappedToken.address
        )
        ?.join(","),
    [chainId, tokens]
  );

  useEffect(() => {
    const getPrices = () => {
      if (!tokensAddress) return;

      fetchTokenPrice({
        addresses: tokensAddress.split(",").map((item) => item.toLowerCase()),
        chainId,
      }).then((prices) => {
        const newPrices: Array<Price> = [];
        Object.keys(prices).forEach((key) => {
          newPrices.push({
            address: key,
            price: prices[key].PriceBuy,
          });
        });
        setPrices(newPrices);
      });
    };

    getPrices();
    const i = setInterval(() => getPrices, 30 * 1_000);

    return () => clearInterval(i);
  }, [chainId, tokensAddress]);

  return prices;
}
