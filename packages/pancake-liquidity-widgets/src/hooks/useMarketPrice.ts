import { useEffect, useMemo } from "react";
import { NATIVE_TOKEN_ADDRESS, NetworkInfo } from "@/constants";
import { useWeb3Provider } from "@/hooks/useProvider";
import { PancakeTokenAdvanced } from "@/types/zapInTypes";
import { useTokenPrices } from "@kyber/hooks/use-token-prices";

export default function useMarketPrice({
  tokensIn,
  setTokensIn,
}: {
  tokensIn: PancakeTokenAdvanced[];
  setTokensIn: (value: PancakeTokenAdvanced[]) => void;
}) {
  const { chainId } = useWeb3Provider();
  const { fetchPrices } = useTokenPrices({ addresses: [], chainId });

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

      fetchPrices(
        tokensAddress.split(",").map((item) => item.toLowerCase())
      ).then((prices) => {
        const tokensInClone = tokensIn.map((item) => ({
          ...item,
          price: prices[item.address.toLowerCase()]?.PriceBuy || 0,
        }));

        setTokensIn(tokensInClone as PancakeTokenAdvanced[]);
      });
    };

    getPrices();
    const i = setInterval(() => getPrices, 30 * 1_000);

    return () => clearInterval(i);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokensAddress]);
}
