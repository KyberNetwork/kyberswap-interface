import { PATHS, NETWORKS_INFO } from "@/constants";
import { useEffect, useMemo, useState } from "react";
import { TokenInfo, parseMarketTokenInfo } from "@/components/TokenInfo/utils";
import { useWidgetContext } from "@/stores/widget";

const FETCH_INTERVAL = 60_000;
let fetchInterval: ReturnType<typeof setInterval>;

export default function useMarketTokenInfo(tokenAddress: string) {
  const chainId = useWidgetContext((s) => s.chainId);
  const [marketTokenInfo, setMarketTokenInfo] = useState<TokenInfo | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);

  const parsedMarketTokenInfo = useMemo(
    () => parseMarketTokenInfo(marketTokenInfo),
    [marketTokenInfo]
  );

  const handleFetchCoingeckoData = () => {
    if (!tokenAddress) return;
    setLoading(true);
    fetch(
      tokenAddress === NETWORKS_INFO[chainId].wrappedToken.address.toLowerCase()
        ? `${PATHS.COINGECKO_API_URL}/coins/${NETWORKS_INFO[chainId].coingeckoNativeTokenId}`
        : `${PATHS.COINGECKO_API_URL}/coins/${NETWORKS_INFO[chainId].coingeckoNetworkId}/contract/${tokenAddress}`
    )
      .then((res) => res.json())
      .then((data) =>
        setMarketTokenInfo({
          price: data?.market_data?.current_price?.usd || 0,
          marketCap: data?.market_data?.market_cap?.usd || 0,
          marketCapRank: data?.market_data?.market_cap_rank || 0,
          circulatingSupply: data?.market_data?.circulating_supply || 0,
          totalSupply: data?.market_data?.total_supply || 0,
          allTimeHigh: data?.market_data?.ath?.usd || 0,
          allTimeLow: data?.market_data?.atl?.usd || 0,
          tradingVolume: data?.market_data?.total_volume?.usd || 0,
          description: data?.description || { en: "" },
          name: data?.name || "",
        })
      )
      .catch((e) => {
        console.log(e.message);
        setMarketTokenInfo(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!tokenAddress) return;

    if (fetchInterval) clearInterval(fetchInterval);
    handleFetchCoingeckoData();

    fetchInterval = setInterval(() => {
      handleFetchCoingeckoData();
    }, FETCH_INTERVAL);

    return () => {
      clearInterval(fetchInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenAddress]);

  return { marketTokenInfo: parsedMarketTokenInfo, loading };
}
