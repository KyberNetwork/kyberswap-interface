import { create } from 'zustand';

import { Pool, PoolType } from '@kyber/schema';
import { POOL_ERROR, PoolStatInfo, fetchPoolStat, getPoolInfo } from '@kyber/utils';

interface PoolState {
  poolLoading: boolean;
  poolError: string;
  pool: 'loading' | Pool;
  poolStat: PoolStatInfo | null;
  getPool: (props: getPoolProps) => void;
  getPoolStat: ({ poolAddress, chainId }: { poolAddress: string; chainId: number }) => void;
  reset: () => void;
}

const initState: Omit<PoolState, 'getPool' | 'getPoolStat' | 'reset'> = {
  poolLoading: false,
  pool: 'loading',
  poolStat: null,
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
  getPoolStat: async ({ poolAddress, chainId }: { poolAddress: string; chainId: number }) => {
    try {
      const poolStat = await fetchPoolStat({ chainId, poolAddress });
      set({ poolStat: poolStat });
    } catch (error) {
      console.error('Error fetching pool stat', error);
    }
  },
}));
