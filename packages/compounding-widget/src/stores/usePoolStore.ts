import { create } from 'zustand';

import { Pool, PoolType } from '@kyber/schema';
import { POOL_ERROR, getPoolInfo, getPoolPrice } from '@kyber/utils';

interface PoolState {
  poolLoading: boolean;
  poolError: string;
  pool: 'loading' | Pool;
  poolPrice: number | null;
  revertPrice: boolean;
  toggleRevertPrice: () => void;
  getPool: (props: getPoolProps) => void;
  getPoolPrice: () => void;
  reset: () => void;
}

const initState: Omit<PoolState, 'getPool' | 'getPoolPrice' | 'toggleRevertPrice' | 'reset'> = {
  poolLoading: false,
  pool: 'loading',
  poolError: '',
  poolPrice: null,
  revertPrice: false,
};

interface getPoolProps {
  poolAddress: string;
  chainId: number;
  poolType: PoolType;
}

export const usePoolStore = create<PoolState>((set, get) => ({
  ...initState,
  reset: () => set(initState),
  getPool: async ({ poolAddress, chainId, poolType }: getPoolProps) => {
    set({ poolLoading: true });

    const poolInfo = await getPoolInfo({ poolAddress, chainId, poolType });
    const firstLoad = get().pool === 'loading';

    if (poolInfo.error && (!poolInfo.error.includes(POOL_ERROR.CANT_GET_POOL_INFO) || firstLoad))
      set({ poolError: poolInfo.error });
    else if (poolInfo.pool) {
      set({ pool: poolInfo.pool as Pool });

      const { getPoolPrice } = get();
      getPoolPrice();
    }

    set({ poolLoading: false });
  },
  getPoolPrice: () => {
    const { pool, revertPrice } = get();
    const price = getPoolPrice({ pool, revertPrice });

    if (price !== null) set({ poolPrice: price });
  },
  toggleRevertPrice: () => {
    set(state => ({ revertPrice: !state.revertPrice }));
    get().getPoolPrice();
  },
}));
