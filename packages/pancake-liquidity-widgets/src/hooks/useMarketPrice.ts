import { useEffect, useMemo } from "react";
import {
  chainIdToChain,
  NATIVE_TOKEN_ADDRESS,
  NetworkInfo,
  PATHS,
} from "@/constants";
import { useWeb3Provider } from "@/hooks/useProvider";
import { PancakeTokenAdvanced } from "@/types/zapInTypes";

export default function useMarketPrice({
  tokensIn,
  setTokensIn,
}: {
  tokensIn: PancakeTokenAdvanced[];
  setTokensIn: (value: PancakeTokenAdvanced[]) => void;
}) {
  const { chainId } = useWeb3Provider();

  const tokensAddress = useMemo(
    () =>
      tokensIn
        .map((token) =>
          token.address?.toLowerCase() !== NATIVE_TOKEN_ADDRESS.toLowerCase()
            ? token.address
            : NetworkInfo[chainId].wrappedToken.address
        )
        ?.join(","),
    [chainId, tokensIn]
  );

  useEffect(() => {
    const getPrices = () => {
      if (!tokensAddress) return;
      fetch(
        `${PATHS.KYBERSWAP_PRICE_API}/${chainIdToChain[chainId]}/api/v1/prices?ids=${tokensAddress}`
      )
        .then((res) => res.json())
        .then((res) => {
          const prices = res.data?.prices || [];
          const tokensInClone = [...tokensIn];
          prices.forEach(
            async (
              item: {
                address: string;
                marketPrice: number;
                preferPriceSource: string;
                price: number;
              },
              index: number
            ) => {
              tokensInClone[index].price = item.marketPrice || item.price || 0;
            }
          );
          setTokensIn(tokensInClone);
        });
    };

    getPrices();
    const i = setInterval(() => getPrices, 30 * 1_000);

    return () => clearInterval(i);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokensAddress]);
}
