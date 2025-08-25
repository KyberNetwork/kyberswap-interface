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

export const fetchTokenPrice = async ({ addresses, chainId }: { addresses: string[]; chainId: number }) => {
  const priceResponse: PriceResponse = await fetch(`${API_URLS.TOKEN_API}/v1/public/tokens/prices`, {
    method: 'POST',
    body: JSON.stringify({
      [chainId]: addresses,
    }),
  }).then(res => res.json() as Promise<PriceResponse>);

  return priceResponse?.data?.[chainId] || {};
};
