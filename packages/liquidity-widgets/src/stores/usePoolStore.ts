import { create } from 'zustand';

import { Pool, PoolType } from '@kyber/schema';
import { POOL_ERROR, getPoolInfo } from '@kyber/utils';

interface PoolState {
  poolLoading: boolean;
  poolError: string;
  pool: 'loading' | Pool;
  getPool: (props: getPoolProps) => void;
  reset: () => void;
}

const initState: Omit<PoolState, 'getPool' | 'reset'> = {
  poolLoading: false,
  pool: 'loading',
  poolError: '',
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
    else if (poolInfo.pool) set({ pool: poolInfo.pool as Pool });

    set({ poolLoading: false });
  },
}));
