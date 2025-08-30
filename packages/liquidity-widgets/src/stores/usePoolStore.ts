import { create } from 'zustand';
import { useShallow } from 'zustand/shallow';

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
  reset: () => void;
}

const initState: Omit<PoolState, 'getPool' | 'toggleRevertPrice' | 'reset'> = {
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

const usePoolRawStore = create<PoolState>((set, get) => ({
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

      const revertPrice = get().revertPrice;
      const price = getPoolPrice({ pool: poolInfo.pool as Pool, revertPrice });
      if (price !== null) set({ poolPrice: price });
    }

    set({ poolLoading: false });
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
