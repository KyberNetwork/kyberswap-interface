import { API_URLS, Token } from '@kyber/schema';

export const fetchTokenInfo = async (address: string, chainId: number) => {
  try {
    const res = await fetch(
      `${API_URLS.KYBERSWAP_SETTING_API}/v1/tokens?pageSize=100&page=1&query=${address}&chainIds=${chainId}`,
    );
    const { data } = (await res.json()) as { data: { tokens: Token[] } };

    return data.tokens || [];
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

export const fetchTokenPrice = async ({ addresses, chainId }: { addresses: string[]; chainId: number }) => {
  const priceResponse: PriceResponse = await fetch(`${API_URLS.TOKEN_API}/v1/public/tokens/prices`, {
    method: 'POST',
    body: JSON.stringify({
      [chainId]: addresses,
    }),
  }).then(res => res.json() as Promise<PriceResponse>);

  return priceResponse?.data?.[chainId] || {};
};
