import { create } from 'zustand';
import { useShallow } from 'zustand/shallow';

import { POOL_CATEGORY, Pool, PoolType } from '@kyber/schema';
import { POOL_ERROR, getPoolInfo, getPoolPrice } from '@kyber/utils';
import { MAX_TICK, MIN_TICK, nearestUsableTick } from '@kyber/utils/uniswapv3';

import { CreatePoolConfig } from '@/types/index';

const DEFAULT_TICK_SPACING_BY_FEE: Record<number, number> = {
  0.005: 1,
  0.01: 1,
  0.05: 10,
  0.1: 20,
  0.3: 60,
  0.5: 100,
  1: 200,
  3: 600,
};

const getDefaultTickSpacing = (fee: number) => {
  const spacing = DEFAULT_TICK_SPACING_BY_FEE[fee];
  if (spacing) return spacing;
  if (fee <= 0.01) return 1;
  if (fee <= 0.05) return 10;
  if (fee <= 0.3) return 60;
  if (fee <= 1) return 200;
  return 600;
};

const DEFAULT_SQRT_RATIO_X96 = (1n << 96n).toString();

const buildSyntheticPool = (config: CreatePoolConfig, poolType: PoolType): Pool => {
  const tickSpacing = getDefaultTickSpacing(config.fee);
  return {
    address: '',
    poolType: poolType as PoolType.DEX_UNISWAP_V4_FAIRFLOW,
    token0: config.token0,
    token1: config.token1,
    fee: config.fee,
    tick: 0,
    liquidity: '0',
    sqrtPriceX96: DEFAULT_SQRT_RATIO_X96,
    tickSpacing,
    ticks: [],
    minTick: nearestUsableTick(MIN_TICK, tickSpacing),
    maxTick: nearestUsableTick(MAX_TICK, tickSpacing),
    category: POOL_CATEGORY.COMMON_PAIR,
    stats: {
      tvl: 0,
      volume24h: 0,
      fees24h: 0,
      apr: 0,
      apr24h: 0,
      apr30d: 0,
      kemLMApr24h: 0,
      kemLMApr30d: 0,
      kemEGApr24h: 0,
      kemEGApr30d: 0,
    },
    isFarming: false,
    isFarmingLm: false,
  };
};

interface PoolState {
  poolLoading: boolean;
  poolError: string;
  pool: Pool | null;
  poolPrice: number | null;
  revertPrice: boolean;
  setPoolPrice: (price: number | null) => void;
  toggleRevertPrice: () => void;
  getPool: (props: getPoolProps) => void;
  setCreatePool: (config: CreatePoolConfig, poolType: PoolType) => void;
  reset: () => void;
}

const initState: Omit<PoolState, 'getPool' | 'setCreatePool' | 'toggleRevertPrice' | 'reset' | 'setPoolPrice'> = {
  poolLoading: false,
  pool: null,
  poolError: '',
  poolPrice: null,
  revertPrice: false,
};

interface getPoolProps {
  poolAddress: string;
  chainId: number;
  poolType: PoolType;
}

const usePoolRawStore = create<PoolState>((set, get) => ({
  ...initState,
  reset: () => set(initState),
  getPool: async ({ poolAddress, chainId, poolType }: getPoolProps) => {
    set({ poolLoading: true });

    const poolInfo = await getPoolInfo({ poolAddress, chainId, poolType });
    const firstLoad = get().pool === null;

    if (poolInfo.error && (!poolInfo.error.includes(POOL_ERROR.CANT_GET_POOL_INFO) || firstLoad))
      set({ poolError: poolInfo.error });
    else if (poolInfo.pool) {
      set({ pool: poolInfo.pool as Pool });

      const revertPrice = get().revertPrice;
      const price = getPoolPrice({ pool: poolInfo.pool as Pool, revertPrice });
      if (price !== null) set({ poolPrice: price });
    }

    set({ poolLoading: false });
  },
  setCreatePool: (config: CreatePoolConfig, poolType: PoolType) => {
    set({ pool: buildSyntheticPool(config, poolType) });
  },
  setPoolPrice: (price: number | null) => {
    set({ poolPrice: price });
  },
  toggleRevertPrice: () => {
    set(state => ({ revertPrice: !state.revertPrice }));

    const { pool, revertPrice } = get();
    const price = getPoolPrice({ pool, revertPrice });
    if (price !== null) set({ poolPrice: price });
  },
}));

type PoolStoreKeys = keyof ReturnType<typeof usePoolRawStore.getState>;

export const usePoolStore = <K extends PoolStoreKeys>(keys: K[]) => {
  return usePoolRawStore(
    useShallow(s =>
      keys.reduce(
        (acc, key) => {
          acc[key] = s[key];
          return acc;
        },
        {} as Pick<typeof s, K>,
      ),
    ),
  );
};
