import { API_URLS, FARMING_PROGRAM, Token } from '@kyber/schema';

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

interface PoolStatResponse {
  data: {
    poolStats: PoolStatInfo;
    programs?: Array<FARMING_PROGRAM>;
  };
}

export interface PoolStatInfo {
  tvl: number;
  volume24h: number;
  fees24h: number;
  apr: number;
  kemLMApr: number;
  kemEGApr: number;
}

export const fetchPoolStat = async ({ chainId, poolAddress }: { chainId: number; poolAddress: string }) => {
  const poolStatResponse: PoolStatResponse = (await fetch(
    `${API_URLS.ZAP_EARN_API}/v1/pools?chainId=${chainId}&address=${poolAddress}`,
  ).then(res => res.json())) as PoolStatResponse;

  const poolStat = poolStatResponse?.data?.poolStats;
  if (!poolStat) return null;

  const programs = poolStatResponse?.data?.programs || [];

  return {
    ...poolStat,
    isFarming: programs.includes(FARMING_PROGRAM.EG) || programs.includes(FARMING_PROGRAM.LM),
  };
};
