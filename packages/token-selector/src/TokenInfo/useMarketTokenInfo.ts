import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { I18n } from "@lingui/core";

import { API_URLS, ChainId } from "@kyber/schema";

import {
  TokenInfo,
  getMarketTokenInfo,
  getNetworkInfo,
} from "@/TokenInfo/utils";

const FETCH_INTERVAL = 60_000;

interface UseMarketTokenInfoParams {
  tokenAddress: string;
  chainId: ChainId;
  i18n: I18n;
}

export default function useMarketTokenInfo({
  tokenAddress,
  chainId,
  i18n,
}: UseMarketTokenInfoParams) {
  const [marketTokenInfo, setMarketTokenInfo] = useState<TokenInfo | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const fetchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const parsedMarketTokenInfo = useMemo(
    () => getMarketTokenInfo(marketTokenInfo, i18n),
    [marketTokenInfo, i18n],
  );
  const networkInfo = useMemo(() => getNetworkInfo(chainId), [chainId]);

  const handleFetchCoingeckoData = useCallback(() => {
    if (!tokenAddress || !networkInfo) return;

    const isNativeToken =
      tokenAddress === networkInfo.wrappedToken.address.toLowerCase();
    const requestUrl = isNativeToken
      ? networkInfo.coingeckoNativeTokenId
        ? `${API_URLS.COINGECKO_API_URL}/coins/${networkInfo.coingeckoNativeTokenId}`
        : null
      : networkInfo.coingeckoNetworkId
        ? `${API_URLS.COINGECKO_API_URL}/coins/${networkInfo.coingeckoNetworkId}/contract/${tokenAddress}`
        : null;

    if (!requestUrl) return;

    setLoading(true);
    fetch(requestUrl)
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
        }),
      )
      .catch((e) => {
        console.log(e.message);
        setMarketTokenInfo(null);
      })
      .finally(() => setLoading(false));
  }, [networkInfo, tokenAddress]);

  useEffect(() => {
    setMarketTokenInfo(null);
    if (!tokenAddress || !networkInfo) return;

    if (fetchIntervalRef.current) clearInterval(fetchIntervalRef.current);
    handleFetchCoingeckoData();

    fetchIntervalRef.current = setInterval(() => {
      handleFetchCoingeckoData();
    }, FETCH_INTERVAL);

    return () => {
      if (fetchIntervalRef.current) clearInterval(fetchIntervalRef.current);
    };
  }, [handleFetchCoingeckoData, networkInfo, tokenAddress]);

  return { marketTokenInfo: parsedMarketTokenInfo, loading };
}
