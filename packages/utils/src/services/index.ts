import { API_URLS, Token } from '@kyber/schema';

export const fetchTokenInfo = async (address: string, chainId: number) => {
  try {
    const res = await fetch(
      `${API_URLS.KYBERSWAP_SETTING_API}/v1/tokens?pageSize=100&page=1&query=${address}&chainIds=${chainId}`,
    );
    const { data } = (await res.json()) as { data: { tokens: (Token & { logoURI: string })[] } };

    return (
      data.tokens.map(token => ({
        ...token,
        logo: token.logoURI,
      })) || []
    );
  } catch (error) {
    return [];
  }
};

export const fetchTokens = async (addresses: string[], chainId: number) => {
  try {
    // Make parallel requests for all addresses
    const promises = addresses.map(address => fetchTokenInfo(address, chainId));
    const results = await Promise.all(promises);

    // Flatten and deduplicate results
    const allTokens = results.flat();
    const uniqueTokens = allTokens.filter(
      (token, index, arr) => arr.findIndex(t => t.address.toLowerCase() === token.address.toLowerCase()) === index,
    );

    return uniqueTokens;
  } catch (error) {
    return [];
  }
};

interface PriceResponse {
  data: {
    [chainId: string]: {
      [address: string]: { PriceBuy: number; PriceSell: number };
    };
  };
}

/** Either side can be absent when the price service cannot value that leg of the market. */
export interface TokenPriceEntry {
  PriceBuy?: number;
  PriceSell?: number;
}

/** A buy/sell spread at or beyond this ratio is not a market, and its mid is not a price. */
const MAX_PRICE_SPREAD_RATIO = 2;

/**
 * A token's USD price as the mid of its buy/sell spread, or `null` when either side is missing or the
 * two sides are too far apart — a one-sided or wildly split quote comes from a market the price
 * service could only value on one leg and can sit orders of magnitude away from the tradable price.
 */
export const getMidPrice = (entry?: TokenPriceEntry): number | null => {
  if (!entry?.PriceBuy || !entry?.PriceSell) return null;
  const [low, high] =
    entry.PriceBuy < entry.PriceSell ? [entry.PriceBuy, entry.PriceSell] : [entry.PriceSell, entry.PriceBuy];
  if (high >= low * MAX_PRICE_SPREAD_RATIO) return null;
  return (low + high) / 2;
};

export const fetchTokenPrice = async ({ addresses, chainId }: { addresses: string[]; chainId: number }) => {
  const priceResponse: PriceResponse = await fetch(`${API_URLS.TOKEN_API}/v1/public/tokens/prices`, {
    method: 'POST',
    body: JSON.stringify({
      [chainId]: addresses,
    }),
  }).then(res => res.json() as Promise<PriceResponse>);

  return priceResponse?.data?.[chainId] || {};
};
