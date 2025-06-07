import {
  API_URLS,
  ChainId,
  PoolType,
  Token,
  Univ2PoolType,
  Univ3PoolType,
  poolResponse,
  univ2Pool,
  univ3Pool,
} from '@kyber/schema';

import { fetchTokenPrice } from '../services';
import { MAX_TICK, MIN_TICK, nearestUsableTick } from '../uniswapv3';

export enum POOL_ERROR {
  CANT_GET_POOL_INFO = "Can't get pool info",
  CANT_GET_TOKEN_INFO = "Can't get token info",
  INVALID_POOL_TYPE = 'Invalid pool type',
  INVALID_UNIV3_POOL_TYPE = 'Invalid univ3 pool type',
  INVALID_UNIV2_POOL_TYPE = 'Invalid univ2 pool type',
}

export const getPoolInfo = async ({
  poolAddress,
  chainId,
  poolType,
}: {
  poolAddress: string;
  chainId: ChainId;
  poolType: PoolType;
}) => {
  const poolServiceResponse = await fetch(
    `${API_URLS.BFF_API}/v1/pools?chainId=${chainId}&ids=${poolAddress}&protocol=${poolType}`,
  ).then(res => res.json() as Promise<Record<string, any>>);

  const { success, data, error } = poolResponse.safeParse({
    poolType,
    ...poolServiceResponse,
  });

  if (!success)
    return {
      error: `${POOL_ERROR.CANT_GET_POOL_INFO} ${error.toString()}`,
      pool: null,
    };

  const pool = (
    data.data.pools as Array<{
      address: string;
      swapFee: number;
      exchange: string;
      tokens: [{ address: string }, { address: string }];
      positionInfo: {
        tick: number;
        liquidity: string;
        sqrtPriceX96: string;
        tickSpacing: number;
        ticks?: any[];
      };
    }>
  ).find(item => item.address.toLowerCase() === poolAddress.toLowerCase());

  if (!pool)
    return {
      error: `${POOL_ERROR.CANT_GET_POOL_INFO}, address: ${poolAddress}`,
      pool: null,
    };

  const token0Address = pool.tokens[0].address;
  const token1Address = pool.tokens[1].address;

  const { token0, token1 } = await getPoolTokens({ token0Address, token1Address, chainId });

  if (!token0 || !token1)
    return {
      error: POOL_ERROR.CANT_GET_TOKEN_INFO,
      pool: null,
    };

  const category = await getPoolCategory({ token0Address, token1Address, chainId });

  const { success: isUniV3, data: univ3PoolInfo } = univ3Pool.safeParse(pool);
  const { success: isUniV2, data: univ2PoolInfo } = univ2Pool.safeParse(pool);

  if (isUniV3) {
    const { success: isUniV3PoolType } = Univ3PoolType.safeParse(poolType);
    if (!isUniV3PoolType)
      return {
        error: POOL_ERROR.INVALID_UNIV3_POOL_TYPE,
        pool: null,
      };

    return {
      error: null,
      pool: {
        category,
        poolType,
        token0,
        token1,
        address: univ3PoolInfo.address,
        fee: univ3PoolInfo.swapFee,
        liquidity: univ3PoolInfo.positionInfo.liquidity,
        sqrtPriceX96: univ3PoolInfo.positionInfo.sqrtPriceX96,
        tick: univ3PoolInfo.positionInfo.tick,
        tickSpacing: univ3PoolInfo.positionInfo.tickSpacing,
        ticks: univ3PoolInfo.positionInfo.ticks || [],
        minTick: nearestUsableTick(MIN_TICK, univ3PoolInfo.positionInfo.tickSpacing),
        maxTick: nearestUsableTick(MAX_TICK, univ3PoolInfo.positionInfo.tickSpacing),
      },
    };
  }

  if (isUniV2) {
    const { success: isUniV2PoolType } = Univ2PoolType.safeParse(poolType);
    if (!isUniV2PoolType)
      return {
        error: POOL_ERROR.INVALID_UNIV2_POOL_TYPE,
        pool: null,
      };

    return {
      error: null,
      pool: {
        address: univ2PoolInfo.address,
        poolType,
        category,
        token0,
        token1,
        fee: univ2PoolInfo.swapFee,
        reserves: univ2PoolInfo.reserves,
      },
    };
  }

  return {
    error: POOL_ERROR.INVALID_POOL_TYPE,
    pool: null,
  };
};

const getPoolTokens = async ({
  token0Address,
  token1Address,
  chainId,
}: {
  token0Address: string;
  token1Address: string;
  chainId: ChainId;
}) => {
  const prices = await fetchTokenPrice({
    addresses: [token0Address.toLowerCase(), token1Address.toLowerCase()],
    chainId,
  });

  const token0Price = prices[token0Address.toLowerCase()]?.PriceBuy || 0;
  const token1Price = prices[token1Address.toLowerCase()]?.PriceBuy || 0;

  const tokens: {
    address: string;
    logoURI?: string;
    name: string;
    symbol: string;
    decimals: number;
  }[] = await fetch(
    `${API_URLS.KYBERSWAP_SETTING_API}/v1/tokens?chainIds=${chainId}&addresses=${token0Address},${token1Address}`,
  )
    .then(res => res.json() as Promise<{ data: { tokens: Token[] } }>)
    .then(res => res?.data?.tokens || [])
    .catch(() => []);

  let token0 = tokens.find(tk => tk.address.toLowerCase() === token0Address.toLowerCase());
  let token1 = tokens.find(tk => tk.address.toLowerCase() === token1Address.toLowerCase());

  if (!token0 || !token1) {
    const tokensToImport = [];
    if (!token0)
      tokensToImport.push({
        chainId: chainId.toString(),
        address: token0Address,
      });
    if (!token1)
      tokensToImport.push({
        chainId: chainId.toString(),
        address: token1Address,
      });

    const res = await fetch(`${API_URLS.KYBERSWAP_SETTING_API}/v1/tokens/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tokens: tokensToImport }),
    }).then(res => res.json() as Promise<{ data: { tokens: { data: Token }[] } }>);

    if (!token0)
      token0 = res?.data?.tokens?.find(
        (item: { data: Token }) => item.data.address.toLowerCase() === token0Address.toLowerCase(),
      )?.data;
    if (!token1)
      token1 = res?.data?.tokens?.find(
        (item: { data: Token }) => item.data.address.toLowerCase() === token1Address.toLowerCase(),
      )?.data;
  }

  return {
    token0: token0
      ? {
          ...token0,
          logo: token0.logoURI,
          price: token0Price,
        }
      : null,
    token1: token1
      ? {
          ...token1,
          logo: token1.logoURI,
          price: token1Price,
        }
      : null,
  };
};

const getPoolCategory = async ({
  token0Address,
  token1Address,
  chainId,
}: {
  token0Address: string;
  token1Address: string;
  chainId: ChainId;
}) => {
  const pairCheck = await fetch(
    `${API_URLS.TOKEN_API}/v1/public/category/pair?chainId=${chainId}&tokenIn=${token0Address}&tokenOut=${token1Address}`,
  ).then(res => res.json() as Promise<{ data: { category: string } }>);

  return pairCheck?.data?.category || 'commonPair';
};
