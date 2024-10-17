import { chainIdToChain, PATHS } from "@/constants";
import { useEffect, useState } from "react";
import { useWeb3Provider } from "./useProvider";

export default function useMarketPrice(tokensAddress: string) {
  const [prices, setPrices] = useState([]);
  const { chainId } = useWeb3Provider();

  useEffect(() => {
    if (!tokensAddress) {
      if (prices.length) setPrices([]);
      return;
    }
    fetch(
      `${PATHS.KYBERSWAP_PRICE_API}/${chainIdToChain[chainId]}/api/v1/prices?ids=${tokensAddress}`
    )
      .then((res) => res.json())
      .then((res) => {
        setPrices(
          (res.data?.prices || []).map(
            (item: {
              address: string;
              marketPrice: number;
              preferPriceSource: string;
              price: number;
            }) => item.marketPrice || item.price || 0
          )
        );
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, tokensAddress]);

  return prices;
}
