import { z } from 'zod';

import {
  API_URLS,
  ChainId,
  NATIVE_TOKEN_ADDRESS,
  Pool,
  PoolType,
  Token,
  poolResponse,
  univ2PoolNormalize,
  univ2RawPool,
  univ2Types,
  univ3PoolNormalize,
  univ3RawPool,
  univ3Types,
  univ4Types,
} from '@kyber/schema';

import { divideBigIntToString } from '../number';
import { fetchTokenPrice } from '../services';
import { MAX_TICK, MIN_TICK, nearestUsableTick, sqrtToPrice } from '../uniswapv3';

export enum POOL_ERROR {
  MISSING_TARGET_POOL = 'Missing target pool',
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
    `${API_URLS.ZAP_EARN_API}/v1/pools?chainId=${chainId}&address=${poolAddress}`,
  ).then(res => res.json() as Promise<Record<string, any>>);

  const { success, data, error } = poolResponse.safeParse({
    poolType,
    ...poolServiceResponse,
  });

  if (!success)
    return {
      error: `${POOL_ERROR.CANT_GET_POOL_INFO}: ${z.prettifyError(error)}`,
      pool: null,
    };

  const pool = data.data as {
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
    staticExtra?: string;
  };

  if (!pool)
    return {
      error: `${POOL_ERROR.CANT_GET_POOL_INFO}, address: ${poolAddress}`,
      pool: null,
    };

  const isUniV4 = univ4Types.includes(poolType);

  const staticExtra = pool.staticExtra && 'staticExtra' in pool ? JSON.parse(pool.staticExtra) : null;
  const isToken0Native = isUniV4 && pool.staticExtra && staticExtra?.['0x0']?.[0];
  const isToken1Native = isUniV4 && pool.staticExtra && staticExtra?.['0x0']?.[1];

  const token0Address = isToken0Native ? NATIVE_TOKEN_ADDRESS.toLowerCase() : pool.tokens[0].address;
  const token1Address = isToken1Native ? NATIVE_TOKEN_ADDRESS.toLowerCase() : pool.tokens[1].address;

  const { token0, token1 } = await getPoolTokens({ token0Address, token1Address, chainId });

  if (!token0 || !token1)
    return {
      error: POOL_ERROR.CANT_GET_TOKEN_INFO,
      pool: null,
    };

  const category = await getPoolCategory({ token0Address, token1Address, chainId });

  const { success: isUniV3, data: univ3PoolInfo } = univ3RawPool.safeParse(pool);
  const { success: isUniV2, data: univ2PoolInfo } = univ2RawPool.safeParse(pool);

  if (isUniV3) {
    const isUniV3PoolType = univ3Types.includes(poolType as any);
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
        stats: {
          ...univ3PoolInfo.poolStats,
          kemLMApr: univ3PoolInfo.poolStats.kemLMApr || 0,
          kemEGApr: univ3PoolInfo.poolStats.kemEGApr || 0,
        },
        isFarming: univ3PoolInfo.programs?.includes('eg') || univ3PoolInfo.programs?.includes('lm'),
        haveLm: univ3PoolInfo.programs?.includes('lm'),
      },
    };
  }

  if (isUniV2) {
    const isUniV2PoolType = univ2Types.includes(poolType as any);
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
        stats: {
          ...univ2PoolInfo.poolStats,
          kemLMApr: univ2PoolInfo.poolStats.kemLMApr || 0,
          kemEGApr: univ2PoolInfo.poolStats.kemEGApr || 0,
        },
        isFarming: univ2PoolInfo.programs?.includes('eg') || univ2PoolInfo.programs?.includes('lm'),
        haveLm: univ2PoolInfo.programs?.includes('lm'),
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

export const getPoolPrice = ({ pool, revertPrice }: { pool: Pool | 'loading' | null; revertPrice: boolean }) => {
  if (pool === 'loading' || !pool) return null;

  const { success: isUniV3, data: uniV3PoolInfo } = univ3PoolNormalize.safeParse(pool);
  const { success: isUniV2, data: uniV2PoolInfo } = univ2PoolNormalize.safeParse(pool);

  if (isUniV3) {
    return +sqrtToPrice(
      BigInt(uniV3PoolInfo.sqrtPriceX96 || 0),
      uniV3PoolInfo.token0.decimals,
      uniV3PoolInfo.token1.decimals,
      revertPrice,
    );
  }
  if (isUniV2) {
    const price = +divideBigIntToString(
      BigInt(uniV2PoolInfo.reserves[1]) * 10n ** BigInt(uniV2PoolInfo.token0.decimals),
      BigInt(uniV2PoolInfo.reserves[0]) * 10n ** BigInt(uniV2PoolInfo.token1.decimals),
      18,
    );

    return revertPrice ? 1 / price : price;
  }

  return null;
};
